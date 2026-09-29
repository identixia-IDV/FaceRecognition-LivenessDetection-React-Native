/**
 * Per-mode still analysis — mirrors Android ModeAnalyzer.
 */
import {
  faceAttribute,
  faceDetect,
  getFeature,
  imageQuality,
  landmarks,
  livenessAll,
  match,
} from 'face-recognition-sdk';
import type { FaceModeId } from './FaceMode';

export async function analyzeMode(
  mode: FaceModeId,
  uri: string,
  oddUri?: string | null,
  landmarkMode: number = 68
): Promise<string | null> {
  switch (mode) {
    case 'FACE_DETECT':
      return faceDetect(uri, false);
    case 'FACE_ATTRIBUTE':
      return faceAttribute(uri, false);
    case 'IMAGE_QUALITY':
      return imageQuality(uri, false);
    case 'LANDMARKS':
      return landmarks(uri, landmarkMode);
    case 'MATCH': {
      if (!oddUri) return null;
      return match(oddUri, uri, false);
    }
    case 'LIVENESS':
      return livenessAll(uri);
    case 'ENROLL':
      return getFeature(uri);
    case 'IDENTITY':
    case 'ENROLLED_LIST':
      return faceDetect(uri, false);
    default:
      return faceDetect(uri, false);
  }
}
