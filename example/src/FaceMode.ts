/**
 * Demo modes — React Native edition of FaceRecognitionSDK-Android FaceMode.
 */
export type FaceModeId =
  | 'FACE_DETECT'
  | 'FACE_ATTRIBUTE'
  | 'IMAGE_QUALITY'
  | 'LANDMARKS'
  | 'MATCH'
  | 'LIVENESS'
  | 'ENROLL'
  | 'IDENTITY'
  | 'ENROLLED_LIST';

export type FaceModeMeta = {
  id: FaceModeId;
  title: string;
  needsRecognition: boolean;
  needsLiveness: boolean;
  usesVideoWorker: boolean;
};

export const FACE_MODES: Record<FaceModeId, FaceModeMeta> = {
  FACE_DETECT: {
    id: 'FACE_DETECT',
    title: 'Face detect',
    needsRecognition: true,
    needsLiveness: false,
    usesVideoWorker: false,
  },
  FACE_ATTRIBUTE: {
    id: 'FACE_ATTRIBUTE',
    title: 'Face attribute',
    needsRecognition: true,
    needsLiveness: false,
    usesVideoWorker: false,
  },
  IMAGE_QUALITY: {
    id: 'IMAGE_QUALITY',
    title: 'Image quality',
    needsRecognition: true,
    needsLiveness: false,
    usesVideoWorker: false,
  },
  LANDMARKS: {
    id: 'LANDMARKS',
    title: 'Landmarks',
    needsRecognition: true,
    needsLiveness: false,
    usesVideoWorker: false,
  },
  MATCH: {
    id: 'MATCH',
    title: 'Match',
    needsRecognition: true,
    needsLiveness: false,
    usesVideoWorker: false,
  },
  LIVENESS: {
    id: 'LIVENESS',
    title: 'Liveness',
    needsRecognition: false,
    needsLiveness: true,
    usesVideoWorker: false,
  },
  ENROLL: {
    id: 'ENROLL',
    title: 'Enroll',
    needsRecognition: true,
    needsLiveness: false,
    usesVideoWorker: false,
  },
  IDENTITY: {
    id: 'IDENTITY',
    title: 'Identity',
    needsRecognition: true,
    needsLiveness: false,
    usesVideoWorker: true,
  },
  ENROLLED_LIST: {
    id: 'ENROLLED_LIST',
    title: 'Enrolled list',
    needsRecognition: true,
    needsLiveness: false,
    usesVideoWorker: false,
  },
};

export function faceModeFromId(id?: string | null): FaceModeMeta {
  if (id && id in FACE_MODES) return FACE_MODES[id as FaceModeId];
  return FACE_MODES.FACE_DETECT;
}
