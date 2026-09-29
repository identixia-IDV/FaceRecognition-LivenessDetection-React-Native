import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  addVideoWorkerListener,
  cropFace,
  exportLastLiveFrame,
  faceDetection,
  getFeature,
  ingestLiveCameraFrame,
  prepareLiveCameraFrame,
  setLandmarkMode,
  similarity,
  startVideoWorker,
  stopVideoWorker,
  templateExtraction,
  type FaceBox,
} from 'face-recognition-sdk';
import {
  evaluateIdentity,
  parseVideoWorkerEvent,
  toCaptureSettings,
  workerFaceToBox,
  type CaptureState,
} from 'face-recognition-sdk/capture';
import {
  addPerson,
  autoPersonName,
  getIdentityHoldDurationMs,
  loadPeople,
  loadSettings,
  type AppSettings,
  type EnrolledPerson,
} from '../FaceDatabase';
import { FACE_MODES } from '../FaceMode';
import { analyzeMode } from '../modeAnalyzer';
import FaceOverlay from '../components/FaceOverlay';
import IdentityGuide, {
  identityHint,
  identityHintColor,
} from '../components/IdentityGuide';
import TileIcon from '../components/TileIcons';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ModeCamera'>;

function toast(msg: string) {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert('', msg);
}

function parseFeatureB64(json: string): string | null {
  try {
    const root = JSON.parse(json);
    const fromResults =
      root?.features?.[0]?.features?.[0]?.feature ??
      root?.result?.features?.[0]?.features?.[0]?.feature ??
      root?.features?.[0]?.feature ??
      root?.result?.features?.[0]?.feature ??
      root?.feature ??
      root?.data ??
      root?.featureBase64;
    if (typeof fromResults === 'string' && fromResults.trim()) {
      return fromResults.trim();
    }
    if (
      fromResults &&
      typeof fromResults === 'object' &&
      typeof (fromResults as { data?: string }).data === 'string'
    ) {
      return (fromResults as { data: string }).data.trim() || null;
    }
  } catch {
    // ignore
  }
  return null;
}

async function probeFeature(
  uri: string,
  box: FaceBox | null
): Promise<string | null> {
  try {
    const json = await getFeature(uri);
    const b64 = parseFeatureB64(json);
    if (b64) return b64;
  } catch {
    // fall through
  }
  if (box) {
    try {
      return await templateExtraction(uri, box);
    } catch {
      return null;
    }
  }
  return null;
}

async function bestEnrolledMatch(
  featureB64: string,
  threshold: number
): Promise<{ person: EnrolledPerson; score: number } | null> {
  const people = await loadPeople();
  let best: { person: EnrolledPerson; score: number } | null = null;
  for (const person of people) {
    if (!person.featureB64) continue;
    try {
      const score = await similarity(featureB64, person.featureB64);
      if (score >= threshold && (!best || score > best.score)) {
        best = { person, score };
      }
    } catch {
      // skip
    }
  }
  return best;
}

export default function ModeCameraScreen({ navigation, route }: Props) {
  const modeId = route.params.mode;
  const mode = FACE_MODES[modeId];
  const isIdentity = modeId === 'IDENTITY';
  const { width, height } = useWindowDimensions();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [lens, setLens] = useState<'front' | 'back'>('front');
  const [landmarkMode, setLm] = useState(68);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState(
    modeId === 'MATCH' ? 'Capture or pick face 1' : 'Align face, then capture'
  );
  const [boxes, setBoxes] = useState<FaceBox[]>([]);
  const [frameSize, setFrameSize] = useState({ w: 480, h: 640 });
  const [identityState, setIdentityState] =
    useState<CaptureState>('NO_FACE');
  const [identityProgress, setIdentityProgress] = useState(0);

  const oddUriRef = useRef<string | null>(null);
  const cameraRef = useRef<Camera>(null);
  const settingsRef = useRef<AppSettings | null>(null);
  const lensRef = useRef<'front' | 'back'>('front');
  const frameSizeRef = useRef({ w: 480, h: 640 });
  const lastUriRef = useRef<string | null>(null);
  const boxesRef = useRef<FaceBox[]>([]);
  const busyRef = useRef(false);
  const resultOpenedRef = useRef(false);
  const confirmingRef = useRef(false);
  const identityOkSinceMsRef = useRef(0);
  const lastIdentityStateRef = useRef<CaptureState>('NO_FACE');
  const ingestBusyRef = useRef(false);
  lensRef.current = lens;

  const device = useCameraDevice(lens);
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      settingsRef.current = s;
      setLens(s.camera_lens);
      setLm(s.landmark_mode);
      void setLandmarkMode(s.landmark_mode).catch(() => {});
      if (isIdentity) {
        setHint(identityHint('NO_FACE'));
      }
    });
  }, [isIdentity]);

  const openResult = useCallback(
    (json: string, thumbUri?: string | null, thumb2Uri?: string | null) => {
      if (resultOpenedRef.current) return;
      resultOpenedRef.current = true;
      navigation.replace('ModeResult', {
        mode: modeId,
        title: mode.title,
        json,
        thumbUri: thumbUri ?? null,
        thumb2Uri: thumb2Uri ?? null,
      });
    },
    [mode.title, modeId, navigation]
  );

  const finishIdentity = useCallback(
    async (uri: string, faceBoxes: FaceBox[]) => {
      if (resultOpenedRef.current) return;
      confirmingRef.current = true;
      setBusy(true);
      setHint('Capturing…');
      setIdentityProgress(1);
      setIdentityState('CAPTURE_OK');
      try {
        const s = settingsRef.current;
        const threshold = s?.identify_threshold ?? 0.67;
        const bestBox =
          faceBoxes.length > 0
            ? faceBoxes.reduce((a, b) =>
                (b.x2 - b.x1) * (b.y2 - b.y1) >
                (a.x2 - a.x1) * (a.y2 - a.y1)
                  ? b
                  : a
              )
            : null;
        const feature = await probeFeature(uri, bestBox);
        const best = feature
          ? await bestEnrolledMatch(feature, threshold)
          : null;
        let thumbUri = uri;
        if (bestBox) {
          try {
            const cropB64 = await cropFace(uri, bestBox);
            if (cropB64) thumbUri = `data:image/jpeg;base64,${cropB64}`;
          } catch {
            // keep full frame
          }
        }
        const enrolledThumb = best?.person.thumbB64
          ? `data:image/jpeg;base64,${best.person.thumbB64}`
          : null;
        const json = JSON.stringify({
          success: best != null,
          mode: 'IDENTITY',
          matched: best != null,
          ...(best
            ? {
                name: best.person.name,
                id: best.person.id,
                score: best.score,
              }
            : {}),
        });
        openResult(json, thumbUri, enrolledThumb);
      } catch (e: any) {
        confirmingRef.current = false;
        identityOkSinceMsRef.current = 0;
        setBusy(false);
        toast(e?.message ?? 'Identity failed');
      }
    },
    [openResult]
  );

  const enrollFromUri = useCallback(
    async (uri: string) => {
      const detected = await faceDetection(uri, { allAttributes: false });
      if (detected.length !== 1) {
        toast(
          detected.length === 0
            ? 'No face detected!'
            : 'Multiple face detected!'
        );
        return;
      }
      const name = autoPersonName();
      const box = detected[0]!;
      const feat = await templateExtraction(uri, box);
      let thumb: string | null = null;
      try {
        thumb = await cropFace(uri, box);
      } catch {
        thumb = null;
      }
      await addPerson(name, feat, thumb);
      openResult(JSON.stringify({ success: true, mode: 'ENROLL', name }), uri);
      toast('Person enrolled!');
    },
    [openResult]
  );

  const processUri = useCallback(
    async (uri: string) => {
      if (busy || resultOpenedRef.current) return;
      setBusy(true);
      try {
        if (modeId === 'IDENTITY') {
          const detected = await faceDetection(uri, { allAttributes: false });
          await finishIdentity(uri, detected);
          return;
        }
        if (modeId === 'ENROLL') {
          await enrollFromUri(uri);
          return;
        }
        if (modeId === 'MATCH') {
          if (!oddUriRef.current) {
            oddUriRef.current = uri;
            setHint('Capture or pick face 2');
            toast('Face 1 saved — capture face 2');
            return;
          }
          const json = await analyzeMode(
            'MATCH',
            uri,
            oddUriRef.current,
            landmarkMode
          );
          openResult(json ?? '{}', oddUriRef.current, uri);
          return;
        }
        const json = await analyzeMode(modeId, uri, null, landmarkMode);
        openResult(json ?? '{}', uri);
      } catch (e: any) {
        toast(e?.message ?? 'Analysis failed');
      } finally {
        setBusy(false);
      }
    },
    [busy, enrollFromUri, finishIdentity, landmarkMode, modeId, openResult]
  );

  // VideoWorker live tracking (FaceCapture / IdentifyScreen pattern).
  useEffect(() => {
    if (!settings || !hasPermission || !device) return;
    let cancelled = false;
    const workerReady = { current: false };

    const sub = addVideoWorkerListener((json) => {
      if (cancelled || resultOpenedRef.current) return;
      const ev = parseVideoWorkerEvent(json);
      if (ev?.type !== 'tracking') return;

      if (ev.frameWidth > 0 && ev.frameHeight > 0) {
        frameSizeRef.current = { w: ev.frameWidth, h: ev.frameHeight };
        setFrameSize(frameSizeRef.current);
      }

      const next = ev.faces.filter((f) => !f.weak).map(workerFaceToBox);
      boxesRef.current = next;
      setBoxes(next);

      if (!isIdentity || confirmingRef.current) return;

      const s = settingsRef.current;
      if (!s) return;
      const captureSettings = toCaptureSettings(s);
      const state = evaluateIdentity(next, captureSettings, frameSizeRef.current);
      const now = Date.now();
      const holdMs = getIdentityHoldDurationMs(s);

      let progress = 0;
      let shouldCapture = false;
      if (state === 'CAPTURE_OK') {
        if (
          identityOkSinceMsRef.current === 0 ||
          lastIdentityStateRef.current !== 'CAPTURE_OK'
        ) {
          identityOkSinceMsRef.current = now;
        }
        const elapsed = now - identityOkSinceMsRef.current;
        progress = Math.min(1, elapsed / holdMs);
        if (elapsed >= holdMs) shouldCapture = true;
      } else {
        identityOkSinceMsRef.current = 0;
        progress = 1;
      }
      lastIdentityStateRef.current = state;
      setIdentityState(state);
      setIdentityProgress(progress);
      setHint(identityHint(state));

      if (shouldCapture && !confirmingRef.current) {
        confirmingRef.current = true;
        void (async () => {
          try {
            const exported = await exportLastLiveFrame();
            const uri = exported.uri || lastUriRef.current;
            if (!uri) {
              confirmingRef.current = false;
              identityOkSinceMsRef.current = 0;
              return;
            }
            if (exported.width > 0 && exported.height > 0) {
              frameSizeRef.current = {
                w: exported.width,
                h: exported.height,
              };
              setFrameSize(frameSizeRef.current);
            }
            await finishIdentity(uri, boxesRef.current);
          } catch {
            confirmingRef.current = false;
            identityOkSinceMsRef.current = 0;
          }
        })();
      }
    });

    (async () => {
      try {
        const code = await startVideoWorker({
          matchThreshold: settings.identify_threshold,
        });
        if (!cancelled) workerReady.current = code === 0;
      } catch {
        workerReady.current = false;
      }
    })();

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    (async () => {
      while (!cancelled) {
        if (
          !workerReady.current ||
          busyRef.current ||
          resultOpenedRef.current ||
          confirmingRef.current ||
          ingestBusyRef.current ||
          !cameraRef.current
        ) {
          await sleep(80);
          continue;
        }
        ingestBusyRef.current = true;
        try {
          const photo = await cameraRef.current.takeSnapshot({ quality: 85 });
          const live = await ingestLiveCameraFrame(photo, {
            frontCamera: lensRef.current !== 'back',
          });
          if (live.ingested && live.width > 0 && live.height > 0) {
            frameSizeRef.current = { w: live.width, h: live.height };
            setFrameSize(frameSizeRef.current);
          }
          if (live.ingested) {
            try {
              const exported = await exportLastLiveFrame();
              if (exported.uri) lastUriRef.current = exported.uri;
            } catch {
              // optional
            }
          }
        } catch {
          // camera warming up
        } finally {
          ingestBusyRef.current = false;
        }
        await sleep(100);
      }
    })();

    return () => {
      cancelled = true;
      workerReady.current = false;
      sub.remove();
      void stopVideoWorker();
    };
  }, [settings, hasPermission, device, isIdentity, finishIdentity]);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  const onCapture = async () => {
    if (isIdentity || !cameraRef.current || busy || resultOpenedRef.current) {
      return;
    }
    setBusy(true);
    try {
      const photo = await cameraRef.current.takeSnapshot({ quality: 90 });
      const uri = await prepareLiveCameraFrame(photo, {
        frontCamera: lens === 'front',
      });
      setBusy(false);
      await processUri(uri);
    } catch (e: any) {
      setBusy(false);
      toast(e?.message ?? 'Capture failed');
    }
  };

  const onGallery = async () => {
    if (isIdentity || busy || resultOpenedRef.current) return;
    const picked = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 1,
    });
    const uri = picked.assets?.[0]?.uri;
    if (uri) await processUri(uri);
  };

  const front = lens === 'front';
  const mirrorOverlay = front && Platform.OS === 'ios';

  if (!settings || !hasPermission || !device) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.permHint}>Camera permission required</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!resultOpenedRef.current}
        photo
        video
        audio={false}
        isMirrored={false}
        resizeMode="cover"
      />

      {isIdentity ? (
        <IdentityGuide
          width={width}
          height={height}
          frameW={frameSize.w}
          frameH={frameSize.h}
          mirror={mirrorOverlay}
          state={identityState}
          progress={identityProgress}
        />
      ) : (
        <FaceOverlay
          width={width}
          height={height}
          frameW={frameSize.w}
          frameH={frameSize.h}
          mirror={mirrorOverlay}
          boxes={boxes}
          settings={settings}
        />
      )}

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{mode.title}</Text>
        <TouchableOpacity
          onPress={() => {
            identityOkSinceMsRef.current = 0;
            setLens((l) => (l === 'front' ? 'back' : 'front'));
          }}
          hitSlop={12}
        >
          <TileIcon name="camera" size={28} color="#F4FFFC" />
        </TouchableOpacity>
      </View>

      <Text
        style={[
          styles.hintBanner,
          isIdentity
            ? {
                color: identityHintColor(identityState),
                backgroundColor: 'rgba(244, 255, 252, 0.92)',
              }
            : null,
        ]}
      >
        {hint}
      </Text>

      {!isIdentity ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.sideBtn} onPress={onGallery}>
            <TileIcon name="gallery" size={28} color="#F4FFFC" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shutter, busy && styles.disabled]}
            disabled={busy}
            onPress={onCapture}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>
          <View style={styles.sideBtn} />
        </View>
      ) : null}

      {busy ? (
        <View style={styles.busyOverlay}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  close: { color: '#fff', fontSize: 22, fontWeight: '600' },
  title: { color: '#fff', fontSize: 17, fontWeight: '600' },
  hintBanner: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 2,
  },
  permHint: { color: colors.muted, marginTop: 12 },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  sideBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  disabled: { opacity: 0.5 },
});
