import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Mask,
  Path,
  Rect,
} from 'react-native-svg';
import {
  getROIRect1,
  mapFramePoint,
  type CaptureState,
} from 'face-recognition-sdk/capture';

/** Android IdentityGuideView / ModeCameraActivity identity colors. */
const COLOR_OK = '#15803D';
const COLOR_ACCENT = '#0F766E';
const COLOR_DANGER = '#B91C1C';
const COLOR_WARN = '#B45309';
const COLOR_TEXT = '#141A22';
const SCRIM = 'rgba(15, 26, 34, 0.40)';

export type IdentityGuideState = CaptureState;

export function identityHint(state: IdentityGuideState): string {
  switch (state) {
    case 'NO_FACE':
      return 'Center your face in the circle';
    case 'MULTIPLE_FACES':
      return 'One face only';
    case 'FIT_IN_CIRCLE':
      return 'Fit in circle';
    case 'MOVE_CLOSER':
      return 'Move closer';
    case 'NO_FRONT':
      return 'Face the camera';
    case 'FACE_OCCLUDED':
      return 'Remove obstruction';
    case 'EYE_CLOSED':
      return 'Open your eyes';
    case 'SPOOFED_FACE':
      return 'Live face required';
    case 'CAPTURE_OK':
      return 'Hold still';
    default:
      return 'Center your face in the circle';
  }
}

/** Hint text color — Android ModeCameraActivity identity hint palette. */
export function identityHintColor(state: IdentityGuideState): string {
  switch (state) {
    case 'CAPTURE_OK':
      return COLOR_OK;
    case 'NO_FACE':
      return COLOR_TEXT;
    case 'MULTIPLE_FACES':
    case 'FACE_OCCLUDED':
    case 'SPOOFED_FACE':
      return COLOR_DANGER;
    default:
      return COLOR_WARN;
  }
}

function ringColorFor(state: IdentityGuideState): string {
  switch (state) {
    case 'CAPTURE_OK':
      return COLOR_OK;
    case 'NO_FACE':
      return COLOR_ACCENT;
    case 'MULTIPLE_FACES':
    case 'FACE_OCCLUDED':
    case 'SPOOFED_FACE':
      return COLOR_DANGER;
    default:
      return COLOR_WARN;
  }
}

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  if (hex.length === 7 && hex.startsWith('#')) return `${hex}${a}`;
  return hex;
}

type Props = {
  width: number;
  height: number;
  frameW: number;
  frameH: number;
  mirror: boolean;
  state: IdentityGuideState;
  /** 0..1 hold progress when CAPTURE_OK; ignored otherwise. */
  progress: number;
};

/**
 * Android IdentityGuideView: scrim hole, tick ring, spin arcs, hold progress.
 */
export default function IdentityGuide({
  width,
  height,
  frameW,
  frameH,
  mirror,
  state,
  progress,
}: Props) {
  const [pulse, setPulse] = useState(0);
  const [spin, setSpin] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    let raf = 0;
    let last = Date.now();
    let pulseT = 0;
    let spinDeg = 0;
    let disp = 0;
    const tick = () => {
      const now = Date.now();
      const dt = Math.min(64, now - last);
      last = now;
      pulseT = (pulseT + dt / 1400) % 2;
      const pulseVal = pulseT < 1 ? pulseT : 2 - pulseT;
      spinDeg = (spinDeg + (dt / 4800) * 360) % 360;
      const target = Math.min(1, Math.max(0, progressRef.current));
      disp += (target - disp) * 0.22;
      setPulse(pulseVal);
      setSpin(spinDeg);
      setDisplayProgress(disp);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const circle = useMemo(() => {
    const fw = frameW > 0 ? frameW : 720;
    const fh = frameH > 0 ? frameH : 1280;
    const roi = getROIRect1({ w: fw, h: fh });
    const p1 = mapFramePoint(roi.left, roi.top, fw, fh, width, height, mirror);
    const p2 = mapFramePoint(
      roi.right,
      roi.bottom,
      fw,
      fh,
      width,
      height,
      mirror
    );
    const left = Math.min(p1.x, p2.x);
    const right = Math.max(p1.x, p2.x);
    const top = Math.min(p1.y, p2.y);
    const bottom = Math.max(p1.y, p2.y);
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;
    const baseR = Math.min(right - left, bottom - top) / 2;
    return { cx, cy, baseR };
  }, [frameW, frameH, width, height, mirror]);

  if (width <= 0 || height <= 0) return null;

  const searching = state === 'NO_FACE';
  const allowed = state === 'CAPTURE_OK';
  const pulseScale = searching
    ? 1 + 0.035 * pulse
    : !allowed
      ? 1 + 0.012 * pulse
      : 1;
  const radius = circle.baseR * pulseScale;
  const { cx, cy } = circle;
  const ringColor = ringColorFor(state);
  const maskId = 'identity-guide-hole';

  const ticks = Array.from({ length: 36 }, (_, i) => {
    const deg = ((i * (360 / 36) + spin * 0.15) * Math.PI) / 180;
    const cos = Math.cos(deg);
    const sin = Math.sin(deg);
    const major = i % 3 === 0;
    const inner = radius + (major ? 4 : 2);
    const outer = radius + (major ? 12 : 7);
    return {
      key: i,
      x1: cx + cos * inner,
      y1: cy + sin * inner,
      x2: cx + cos * outer,
      y2: cy + sin * outer,
    };
  });

  const bracketLen = radius * 1.08 * 0.28;
  const bracketInset = radius * 1.08 * (1 + 0.04 * pulse) * 0.72;
  const brackets = searching
    ? [
        { ox: -1, oy: -1, sx: 1, sy: 1 },
        { ox: 1, oy: -1, sx: -1, sy: 1 },
        { ox: -1, oy: 1, sx: 1, sy: -1 },
        { ox: 1, oy: 1, sx: -1, sy: -1 },
      ]
    : [];

  const arcPath = (startDeg: number, sweepDeg: number, r: number) => {
    const start = ((startDeg - 90) * Math.PI) / 180;
    const end = ((startDeg + sweepDeg - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = sweepDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const progressSweep = allowed ? 360 * displayProgress : 360;
  const glowAlpha = (55 + 50 * displayProgress) / 255;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id={maskId}>
            <Rect x={0} y={0} width={width} height={height} fill="#fff" />
            <Circle cx={cx} cy={cy} r={radius} fill="#000" />
          </Mask>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={SCRIM}
          mask={`url(#${maskId})`}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={withAlpha(ringColor, allowed ? 90 / 255 : 140 / 255)}
          strokeWidth={3}
          fill="none"
        />
        <G>
          {ticks.map((t) => (
            <Line
              key={t.key}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={withAlpha(ringColor, 160 / 255)}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}
        </G>
        {(searching || !allowed) && (
          <>
            <Path
              d={arcPath(spin, 54, radius)}
              stroke={withAlpha(ringColor, 180 / 255)}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d={arcPath(spin + 180, 40, radius)}
              stroke={withAlpha(ringColor, 90 / 255)}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
          </>
        )}
        {brackets.map((b, i) => {
          const x0 = cx + b.ox * bracketInset;
          const y0 = cy + b.oy * bracketInset;
          return (
            <Path
              key={`br-${i}`}
              d={`M ${x0} ${y0 + b.sy * bracketLen} L ${x0} ${y0} L ${x0 + b.sx * bracketLen} ${y0}`}
              stroke={withAlpha(ringColor, 220 / 255)}
              strokeWidth={3.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
        {allowed && displayProgress > 0.01 ? (
          <>
            <Path
              d={arcPath(0, progressSweep, radius)}
              stroke={withAlpha(ringColor, glowAlpha)}
              strokeWidth={12}
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d={arcPath(0, progressSweep, radius)}
              stroke={ringColor}
              strokeWidth={6}
              fill="none"
              strokeLinecap="round"
            />
          </>
        ) : !allowed ? (
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={ringColor}
            strokeWidth={6}
            fill="none"
          />
        ) : null}
      </Svg>
    </View>
  );
}
