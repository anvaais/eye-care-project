/**
 * Face Landmarker pipeline using @mediapipe/tasks-vision
 * with robust client-side fallback
 */

import { FilesetResolver, FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { LEFT_EYE_INDICES, RIGHT_EYE_INDICES } from './ear';
import { Point2D } from '../types';

let faceLandmarker: FaceLandmarker | null = null;
let isLoading = false;
let initFailed = false;

export async function initializeFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (faceLandmarker) return faceLandmarker;
  if (isLoading) return null;
  if (initFailed) return null;

  isLoading = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      outputFaceBlendshapes: false,
      runningMode: 'VIDEO',
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    return faceLandmarker;
  } catch (err) {
    console.warn('Primary MediaPipe GPU init failed, trying CPU fallback...', err);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'CPU',
        },
        outputFaceBlendshapes: false,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      return faceLandmarker;
    } catch (fallbackErr) {
      console.warn('MediaPipe WASM unavailable, operating in optical fallback mode', fallbackErr);
      initFailed = true;
      return null;
    }
  } finally {
    isLoading = false;
  }
}

export interface LandmarkExtractionResult {
  faceDetected: boolean;
  leftEyeLandmarks: Point2D[];
  rightEyeLandmarks: Point2D[];
  rawLandmarks?: Point2D[];
}

export function extractEyeLandmarks(
  result: FaceLandmarkerResult | null
): LandmarkExtractionResult {
  if (!result || !result.faceLandmarks || result.faceLandmarks.length === 0) {
    return {
      faceDetected: false,
      leftEyeLandmarks: [],
      rightEyeLandmarks: [],
    };
  }

  const face = result.faceLandmarks[0];
  const leftEyeLandmarks: Point2D[] = LEFT_EYE_INDICES.map((idx) => ({
    x: face[idx].x,
    y: face[idx].y,
    z: face[idx].z,
  }));

  const rightEyeLandmarks: Point2D[] = RIGHT_EYE_INDICES.map((idx) => ({
    x: face[idx].x,
    y: face[idx].y,
    z: face[idx].z,
  }));

  return {
    faceDetected: true,
    leftEyeLandmarks,
    rightEyeLandmarks,
    rawLandmarks: face.map((p) => ({ x: p.x, y: p.y, z: p.z })),
  };
}
