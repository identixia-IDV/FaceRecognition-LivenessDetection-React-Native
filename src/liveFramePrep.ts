/**
 * Single live-frame geometry policy for Android + iOS.
 * JS owns all front/back / landscape branching; native only rotates + scales.
 *
 * `width` / `height` must be after EXIF / UIImage orientation bake (from probeLiveImage).
 * VisionCamera `orientation` is accepted for API completeness / future use; the
 * post-bake aspect ratio is what drives the rotation today.
 */

export const LIVE_FRAME_MAX_EDGE = 640;

export type LiveFramePrepInput = {
  frontCamera: boolean;
  /** VisionCamera takeSnapshot().orientation (e.g. portrait, landscape-left). */
  orientation?: string;
  width: number;
  height: number;
  maxEdge?: number;
  /** Host OS (accepted for API compatibility; portrait bake is upright on both). */
  platform?: 'ios' | 'android' | string;
};

export type LiveFramePrepPlan = {
  rotateDegrees: number;
  maxEdge: number;
};

/**
 * Decide rotateDegrees + maxEdge for VideoWorker / side-detect frames.
 *
 * 1. Landscape (w > h): front −90°, back +90° (CameraFrameUtils).
 * 2. Else: 0° — probe/bake already yields upright portrait (iOS + Android).
 *    Former iOS +180° after bake flipped X vs the mirrored front preview.
 */
export function planLiveFrame(input: LiveFramePrepInput): LiveFramePrepPlan {
  const maxEdge =
    input.maxEdge != null && input.maxEdge > 0
      ? Math.floor(input.maxEdge)
      : LIVE_FRAME_MAX_EDGE;
  const w = Number(input.width) || 0;
  const h = Number(input.height) || 0;

  let rotateDegrees = 0;
  if (w > h) {
    rotateDegrees = input.frontCamera ? -90 : 90;
  }

  return { rotateDegrees, maxEdge };
}
