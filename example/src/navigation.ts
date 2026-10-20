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

export type RootStackParamList = {
  Home: undefined;
  /** Legacy continuous identify (IdentifySession) — Home Identity uses ModeCamera. */
  Identify: undefined;
  /** Enroll via oval FaceCapture — Android CaptureActivity parity */
  Capture: undefined;
  /** Mode camera — still modes + IDENTITY hold guide (Android ModeCameraActivity) */
  ModeCamera: { mode: FaceModeId };
  /** Mode result — Android ModeResultActivity */
  ModeResult: {
    mode: FaceModeId;
    title: string;
    json: string;
    thumbUri?: string | null;
    thumb2Uri?: string | null;
  };
  EnrolledList: undefined;
  /** Gallery attribute result — Android AttributeActivity */
  AttributeResult: {
    faceUri: string;
    box: import('face-recognition-sdk').FaceBox;
    cropLandmarks?: { x: number; y: number }[];
  };
  /** Identify match result — Android ResultActivity */
  Result: {
    identifiedUri: string;
    enrolledThumbB64: string | null;
    personName: string;
    similarity: number;
    box: import('face-recognition-sdk').FaceBox;
    cropLandmarks?: { x: number; y: number }[];
  };
  Settings: undefined;
  About: undefined;
};
