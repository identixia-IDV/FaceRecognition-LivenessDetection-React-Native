import type { FaceBox } from '../index';
import type { CaptureSettings } from './types';

export type FrameSize = { w: number; h: number };

export type CaptureState =
  | 'NO_FACE'
  | 'MULTIPLE_FACES'
  | 'FIT_IN_CIRCLE'
  | 'MOVE_CLOSER'
  | 'MOVE_FURTHER'
  | 'NO_FRONT'
  | 'FACE_OCCLUDED'
  | 'EYE_CLOSED'
  | 'SPOOFED_FACE'
  | 'CAPTURE_OK';

/** Android CaptureView.getROIRect — used by checkFace fit/size tests. */
export function getROIRect(frame: FrameSize): {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
} {
  const margin = frame.w / 6;
  const rectHeight = ((frame.w - 2 * margin) * 6) / 5;
  const top = (frame.h - rectHeight) / 2;
  return {
    left: margin,
    top,
    right: frame.w - margin,
    bottom: top + rectHeight,
    width: frame.w - 2 * margin,
    height: rectHeight,
  };
}

/** Android CaptureView.getROIRect1 — circular guide in the overlay. */
export function getROIRect1(frame: FrameSize): {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} {
  const margin = frame.w / 6;
  const rectHeight = frame.w - 2 * margin;
  const top = (frame.h - rectHeight) / 2;
  const left = margin;
  const right = frame.w - margin;
  const bottom = top + rectHeight;
  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
  };
}

/** Map frame ROI into view coords — same FILL_CENTER math as mapFramePoint. */
export function mapRoiToView(
  frame: FrameSize,
  viewW: number,
  viewH: number
): {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} {
  const roi = getROIRect1(frame);
  const p1 = mapFramePoint(roi.left, roi.top, frame.w, frame.h, viewW, viewH, false);
  const p2 = mapFramePoint(roi.right, roi.bottom, frame.w, frame.h, viewW, viewH, false);
  const left = Math.min(p1.x, p2.x);
  const top = Math.min(p1.y, p2.y);
  const right = Math.max(p1.x, p2.x);
  const bottom = Math.max(p1.y, p2.y);
  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
  };
}

/** Preview FILL_CENTER mapping (Android FaceView). */
export function mapFramePoint(
  x: number,
  y: number,
  fw: number,
  fh: number,
  vw: number,
  vh: number,
  mirror: boolean
): { x: number; y: number } {
  const scale = Math.max(vw / fw, vh / fh);
  const dx = (vw - fw * scale) / 2;
  const dy = (vh - fh * scale) / 2;
  let vx = x * scale + dx;
  const vy = y * scale + dy;
  if (mirror) vx = vw - vx;
  return { x: vx, y: vy };
}

export function warningFor(state: CaptureState): string {
  switch (state) {
    case 'MULTIPLE_FACES':
      return 'Multiple face detected!';
    case 'FIT_IN_CIRCLE':
      return 'Fit in circle!';
    case 'MOVE_CLOSER':
      return 'Move closer!';
    case 'MOVE_FURTHER':
      return 'Move further!';
    case 'NO_FRONT':
      return 'Not fronted face!';
    case 'FACE_OCCLUDED':
      return 'Face occluded!';
    case 'EYE_CLOSED':
      return 'Eye closed!';
    case 'SPOOFED_FACE':
      return 'Spoof face';
    default:
      return '';
  }
}

/** Android EyeOpenness + IdentityCapture.evaluateBoxes eye gates. */

/** Android IdentityCapture.evaluateFace mask gate (yes / masked). */
export function faceIsMasked(faceBox: FaceBox): boolean {
  const label = (faceBox.maskLabel ?? '').toLowerCase();
  if (label.includes('yes') || label.includes('masked')) return true;
  const attrs = faceBox.attributes;
  if (attrs && typeof attrs === 'object') {
    for (const [key, raw] of Object.entries(attrs)) {
      const k = key.toLowerCase();
      if (!k.includes('mask') && !k.includes('medical')) continue;
      const v = String(raw ?? '').toLowerCase();
      if (v.includes('yes') || v.includes('masked')) return true;
    }
  }
  return false;
}

export function eyesAreClosed(
  faceBox: FaceBox,
  eyecloseThreshold: number
): boolean {
  const left = (faceBox.eyesLeftLabel ?? '').toLowerCase();
  const right = (faceBox.eyesRightLabel ?? '').toLowerCase();
  const labelClosed = (s: string) =>
    s.includes('closed') || (s.includes('close') && !s.includes('closer'));
  if (labelClosed(left) || labelClosed(right)) return true;
  // Open → 0 (EyeOpenness); otherwise always threshold scores (Android evaluateBoxes).
  const leftScore = left.includes('open') ? 0 : (faceBox.left_eye_closed ?? 0);
  const rightScore = right.includes('open') ? 0 : (faceBox.right_eye_closed ?? 0);
  return leftScore > eyecloseThreshold || rightScore > eyecloseThreshold;
}

/** Android CaptureActivity.checkFace */
export function checkFace(
  boxes: FaceBox[],
  settings: CaptureSettings,
  frame: FrameSize
): CaptureState {
  if (!boxes.length) return 'NO_FACE';
  if (boxes.length > 1) return 'MULTIPLE_FACES';

  const faceBox = boxes[0]!;
  let faceLeft = Number.MAX_VALUE;
  let faceRight = 0;
  let faceBottom = 0;
  const lm = faceBox.landmarks ?? [];
  const nMarks = Math.max(
    0,
    Math.min(faceBox.landmarkCount ?? lm.length / 2, Math.floor(lm.length / 2))
  );
  if (nMarks >= 5) {
    for (let i = 0; i < nMarks; i++) {
      const lx = lm[i * 2] ?? 0;
      const ly = lm[i * 2 + 1] ?? 0;
      faceLeft = Math.min(faceLeft, lx);
      faceRight = Math.max(faceRight, lx);
      faceBottom = Math.max(faceBottom, ly);
    }
  } else {
    faceLeft = faceBox.x1;
    faceRight = faceBox.x2;
    faceBottom = faceBox.y2;
  }

  const sizeRate = 0.3;
  const interRate = 0.03;
  const fw = frame.w > 0 ? frame.w : 720;
  const fh = frame.h > 0 ? frame.h : 1280;
  const roiRect = getROIRect({ w: fw, h: fh });
  const centerY = (faceBox.y2 + faceBox.y1) / 2;
  const topY = centerY - ((faceBox.y2 - faceBox.y1) * 2) / 3;
  const interX =
    Math.max(0, roiRect.left - faceLeft) + Math.max(0, faceRight - roiRect.right);
  const interY =
    Math.max(0, roiRect.top - topY) + Math.max(0, faceBottom - roiRect.bottom);
  const faceW = faceBox.x2 - faceBox.x1;
  const faceH = faceBox.y2 - faceBox.y1;
  const faceArea = faceW * faceH;
  const roiArea = roiRect.width * roiRect.height;
  // Too close → move further; FIT_IN_CIRCLE is for off-center / partial overflow.
  if (
    faceArea > roiArea * 0.9 ||
    faceW > roiRect.width * 0.98 ||
    faceH > roiRect.height * 0.98
  ) {
    return 'MOVE_FURTHER';
  }
  if (
    interX / roiRect.width > interRate ||
    interY / roiRect.height > interRate
  ) {
    return 'FIT_IN_CIRCLE';
  }
  if (faceArea < roiArea * sizeRate) {
    return 'MOVE_CLOSER';
  }
  if (
    Math.abs(faceBox.yaw ?? 0) > settings.yaw_threshold ||
    Math.abs(faceBox.roll ?? 0) > settings.roll_threshold ||
    Math.abs(faceBox.pitch ?? 0) > settings.pitch_threshold
  ) {
    return 'NO_FRONT';
  }
  if (faceIsMasked(faceBox)) return 'FACE_OCCLUDED';
  if (eyesAreClosed(faceBox, settings.eyeclose_threshold)) return 'EYE_CLOSED';
  return 'CAPTURE_OK';
}

/** Android IdentityCapture.evaluateBoxes — square ROI (IdentityGuideView.roiInFrame). */
export function evaluateIdentity(
  boxes: FaceBox[],
  settings: CaptureSettings,
  frame: FrameSize
): CaptureState {
  if (!boxes.length) return 'NO_FACE';
  if (boxes.length > 1) return 'MULTIPLE_FACES';

  const faceBox = boxes[0]!;
  const fw = frame.w > 0 ? frame.w : 720;
  const fh = frame.h > 0 ? frame.h : 1280;

  // Prefer landmarks (Android evaluateFace) but fall back to the face box when
  // landmarks are missing or clearly outside the prepared frame.
  let faceLeft = faceBox.x1;
  let faceRight = faceBox.x2;
  let faceBottom = faceBox.y2;
  const lm = faceBox.landmarks ?? [];
  const nMarks = Math.max(
    0,
    Math.min(faceBox.landmarkCount ?? lm.length / 2, Math.floor(lm.length / 2))
  );
  if (nMarks >= 5) {
    let lmLeft = Number.MAX_VALUE;
    let lmRight = 0;
    let lmBottom = 0;
    for (let i = 0; i < nMarks; i++) {
      lmLeft = Math.min(lmLeft, lm[i * 2] ?? 0);
      lmRight = Math.max(lmRight, lm[i * 2] ?? 0);
      lmBottom = Math.max(lmBottom, lm[i * 2 + 1] ?? 0);
    }
    const landmarksInFrame =
      lmRight > lmLeft &&
      lmLeft >= -fw * 0.05 &&
      lmRight <= fw * 1.05 &&
      lmBottom >= 0 &&
      lmBottom <= fh * 1.05;
    if (landmarksInFrame) {
      faceLeft = lmLeft;
      faceRight = lmRight;
      faceBottom = lmBottom;
    }
  }

  const roiRect = getROIRect1({ w: fw, h: fh });
  const centerY = (faceBox.y2 + faceBox.y1) / 2;
  const topY = centerY - ((faceBox.y2 - faceBox.y1) * 2) / 3;
  const interX =
    Math.max(0, roiRect.left - faceLeft) + Math.max(0, faceRight - roiRect.right);
  const interY =
    Math.max(0, roiRect.top - topY) + Math.max(0, faceBottom - roiRect.bottom);
  const faceW = faceBox.x2 - faceBox.x1;
  const faceH = faceBox.y2 - faceBox.y1;
  const faceArea = faceW * faceH;
  const roiArea = roiRect.width * roiRect.height;
  // Too close → move further; FIT_IN_CIRCLE is for off-center / partial overflow.
  if (
    faceArea > roiArea * 0.9 ||
    faceW > roiRect.width * 0.98 ||
    faceH > roiRect.height * 0.98
  ) {
    return 'MOVE_FURTHER';
  }
  if (interX / roiRect.width > 0.03 || interY / roiRect.height > 0.03) {
    return 'FIT_IN_CIRCLE';
  }
  if (faceArea < roiArea * 0.3) {
    return 'MOVE_CLOSER';
  }
  if (
    Math.abs(faceBox.yaw ?? 0) > settings.yaw_threshold ||
    Math.abs(faceBox.roll ?? 0) > settings.roll_threshold ||
    Math.abs(faceBox.pitch ?? 0) > settings.pitch_threshold
  ) {
    return 'NO_FRONT';
  }
  if (faceIsMasked(faceBox)) return 'FACE_OCCLUDED';
  if (eyesAreClosed(faceBox, settings.eyeclose_threshold)) return 'EYE_CLOSED';
  return 'CAPTURE_OK';
}

/**
 * Landmark xy in cropFace bitmap pixels — matches Android Utils.mapLandmarksToCrop
 * (1.4× square window scaled to outW×outH).
 */
export function mapLandmarksToCrop(
  faceBox: FaceBox,
  srcW: number,
  srcH: number,
  outW: number,
  outH: number
): { x: number; y: number }[] {
  const lm = faceBox.landmarks ?? [];
  const n = Math.max(
    0,
    Math.min(faceBox.landmarkCount ?? lm.length / 2, Math.floor(lm.length / 2))
  );
  if (n === 0 || srcW <= 0 || srcH <= 0 || outW <= 0 || outH <= 0) return [];
  const centerX = (faceBox.x1 + faceBox.x2) / 2;
  const centerY = (faceBox.y1 + faceBox.y2) / 2;
  let cropWidth = Math.round((faceBox.x2 - faceBox.x1) * 1.4);
  if (cropWidth < 2) {
    cropWidth = Math.max(
      2,
      Math.max(faceBox.x2 - faceBox.x1, faceBox.y2 - faceBox.y1)
    );
  }
  const cropX1 = Math.max(0, centerX - cropWidth / 2);
  const cropY1 = Math.max(0, centerY - cropWidth / 2);
  const cropX2 = Math.min(srcW - 1, centerX + cropWidth / 2);
  const cropY2 = Math.min(srcH - 1, centerY + cropWidth / 2);
  const cropSrcW = cropX2 - cropX1 + 1;
  const cropSrcH = cropY2 - cropY1 + 1;
  if (cropSrcW < 1 || cropSrcH < 1) return [];
  const sx = outW / cropSrcW;
  const sy = outH / cropSrcH;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      x: ((lm[i * 2] ?? 0) - cropX1) * sx,
      y: ((lm[i * 2 + 1] ?? 0) - cropY1) * sy,
    });
  }
  return out;
}

export function hasLiveness(box: FaceBox): boolean {
  if (box.livenessLabel && box.livenessLabel.length > 0) return true;
  return (box.liveness ?? 0) > 0.001;
}

export function mergeLiveness(track: FaceBox[], pb: FaceBox[]): FaceBox[] {
  if (!pb.length) return track;
  return track.map((dst) => {
    const src = bestMatch(dst, pb);
    if (!src) return dst;
    const attrs = { ...(dst.attributes ?? {}) };
    const srcAttrs = src.attributes ?? {};
    for (const key of ['Liveness2D', 'liveness', 'Deepfake', 'deepfake'] as const) {
      const value = srcAttrs[key];
      if (value != null && String(value).trim()) {
        attrs[key] = value;
      }
    }
    return {
      ...dst,
      liveness: src.liveness,
      livenessLabel: src.livenessLabel,
      attributes: attrs,
    };
  });
}

export function mergeEyes(
  track: FaceBox[],
  pb: FaceBox[],
  swapLeftRight: boolean
): FaceBox[] {
  if (!pb.length) return track;
  return track.map((dst) => {
    const src = bestMatch(dst, pb);
    if (!src) return dst;
    if (swapLeftRight) {
      return {
        ...dst,
        eyesLeftLabel: src.eyesRightLabel,
        eyesRightLabel: src.eyesLeftLabel,
        left_eye_closed: src.right_eye_closed,
        right_eye_closed: src.left_eye_closed,
      };
    }
    return {
      ...dst,
      eyesLeftLabel: src.eyesLeftLabel,
      eyesRightLabel: src.eyesRightLabel,
      left_eye_closed: src.left_eye_closed,
      right_eye_closed: src.right_eye_closed,
    };
  });
}

function bestMatch(dst: FaceBox, pb: FaceBox[]): FaceBox | null {
  if (pb.length === 1) return pb[0] ?? null;
  let best: FaceBox | null = null;
  let bestIou = 0.1;
  for (const src of pb) {
    const v = iou(dst, src);
    if (v > bestIou) {
      bestIou = v;
      best = src;
    }
  }
  return best ?? pb[0] ?? null;
}

function iou(a: FaceBox, b: FaceBox): number {
  const left = Math.max(a.x1, b.x1);
  const top = Math.max(a.y1, b.y1);
  const right = Math.min(a.x2, b.x2);
  const bottom = Math.min(a.y2, b.y2);
  const inter = Math.max(0, right - left) * Math.max(0, bottom - top);
  const areaA = Math.max(0, a.x2 - a.x1) * Math.max(0, a.y2 - a.y1);
  const areaB = Math.max(0, b.x2 - b.x1) * Math.max(0, b.y2 - b.y1);
  const union = areaA + areaB - inter;
  if (union <= 0) return 0;
  return inter / union;
}
