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
    case 'IMAGE_QUALITY': {
      const quality = await imageQuality(uri, false);
      if (!isNoFaceResult(quality)) return quality;
      return faceDetect(uri, false);
    }
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

function isNoFaceResult(json: string | null | undefined): boolean {
  if (!json || !String(json).trim()) return true;
  try {
    const root = JSON.parse(json);
    if (root && typeof root === 'object') {
      if (root.status === 2) return true;
      if (String(root.message || '').toUpperCase() === 'NO_FACE') return true;
      if (Array.isArray(root.data) && root.data.length === 0) return true;
    }
    return false;
  } catch {
    return true;
  }
}
