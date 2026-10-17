/**
 * Eye Aspect Ratio (EAR) Math and Blink Tracking State Machine
 */

import { Point2D } from '../types';

export const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144] as const;
export const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380] as const;

/**
 * Calculate Euclidean distance between two 2D points
 */
export function euclideanDistance(p1: Point2D, p2: Point2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate Eye Aspect Ratio (EAR) from 6 canonical eye landmarks
 * EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
 */
export function calculateEAR(landmarks: Point2D[]): number {
  if (!landmarks || landmarks.length < 6) return 0;

  const [p1, p2, p3, p4, p5, p6] = landmarks;

  const vertical1 = euclideanDistance(p2, p6);
  const vertical2 = euclideanDistance(p3, p5);
  const horizontal = euclideanDistance(p1, p4);

  if (horizontal <= 0.0001) return 0;

  return (vertical1 + vertical2) / (2.0 * horizontal);
}

export class BlinkTracker {
  private baselineBuffer: number[] = [];
  private readonly maxBufferSize = 90; // ~3 seconds at 30fps
  private currentBaseline = 0.28;
  
  private isEyeClosed = false;
  private closureStartTime: number | null = null;
  private prolongedClosureThresholdMs = 1200; // Prolonged rest / micro-sleep
  
  private blinkTimestamps: number[] = [];
  private totalBlinks = 0;
  private startTime = Date.now();
  private lastBlinkTime = 0;

  public sensitivity: 'low' | 'medium' | 'high' = 'medium';

  public reset(): void {
    this.baselineBuffer = [];
    this.currentBaseline = 0.28;
    this.isEyeClosed = false;
    this.closureStartTime = null;
    this.blinkTimestamps = [];
    this.totalBlinks = 0;
    this.startTime = Date.now();
    this.lastBlinkTime = 0;
  }

  public getSensitivityFactor(): number {
    switch (this.sensitivity) {
      case 'low': return 0.70;
      case 'high': return 0.82;
      case 'medium':
      default: return 0.76;
    }
  }

  public getDynamicThreshold(): number {
    return this.currentBaseline * this.getSensitivityFactor();
  }

  public getBaseline(): number {
    return this.currentBaseline;
  }

  public getTotalBlinks(): number {
    return this.totalBlinks;
  }

  /**
   * Process a new EAR measurement from both eyes
   */
  public processFrame(
    leftEar: number,
    rightEar: number,
    now: number = Date.now()
  ): {
    averageEar: number;
    threshold: number;
    baseline: number;
    isBlinkTriggered: boolean;
    isProlongedClosure: boolean;
    prolongedDurationMs: number;
    totalBlinks: number;
    blinkRateBpm: number;
  } {
    // Graceful handling for single-eye occlusion or extreme head angle
    let avgEar = 0;
    if (leftEar > 0 && rightEar > 0) {
      avgEar = (leftEar + rightEar) / 2.0;
    } else if (leftEar > 0) {
      avgEar = leftEar;
    } else if (rightEar > 0) {
      avgEar = rightEar;
    }

    const threshold = this.getDynamicThreshold();
    let isBlinkTriggered = false;
    let isProlongedClosure = false;
    let prolongedDurationMs = 0;

    // Check eye closure state
    if (avgEar > 0 && avgEar < threshold) {
      // Eyes are closed in current frame
      if (!this.isEyeClosed) {
        this.isEyeClosed = true;
        this.closureStartTime = now;
      } else if (this.closureStartTime !== null) {
        prolongedDurationMs = now - this.closureStartTime;
        if (prolongedDurationMs >= this.prolongedClosureThresholdMs) {
          isProlongedClosure = true;
        }
      }
    } else if (avgEar >= threshold) {
      // Eyes are open in current frame
      if (this.isEyeClosed && this.closureStartTime !== null) {
        const closureDuration = now - this.closureStartTime;
        // Natural human blink lasts 60ms to 450ms
        // Avoid counting prolonged micro-naps (>1000ms) or camera jitter (<50ms) as standard blinks
        if (closureDuration >= 60 && closureDuration <= 500) {
          // Debounce: prevent duplicate blinks within 160ms
          if (now - this.lastBlinkTime > 160) {
            this.totalBlinks += 1;
            this.blinkTimestamps.push(now);
            this.lastBlinkTime = now;
            isBlinkTriggered = true;
          }
        }
        this.isEyeClosed = false;
        this.closureStartTime = null;
      }

      // Update open-eye baseline adaptively
      if (avgEar > 0.15 && avgEar < 0.48) {
        this.baselineBuffer.push(avgEar);
        if (this.baselineBuffer.length > this.maxBufferSize) {
          this.baselineBuffer.shift();
        }
        // Compute moving average of highest 60% of open-eye samples to avoid biasing from transitions
        const sorted = [...this.baselineBuffer].sort((a, b) => a - b);
        const topSlice = sorted.slice(Math.floor(sorted.length * 0.3));
        if (topSlice.length > 0) {
          const sum = topSlice.reduce((acc, v) => acc + v, 0);
          this.currentBaseline = sum / topSlice.length;
        }
      }
    }

    // Clean up timestamps older than 60 seconds
    const cutoff = now - 60000;
    this.blinkTimestamps = this.blinkTimestamps.filter((t) => t >= cutoff);

    // Calculate approximate Blink Rate per minute
    let blinkRateBpm = 0;
    const elapsedSec = (now - this.startTime) / 1000;
    if (elapsedSec < 30) {
      // Extrapolate gently during initial startup
      blinkRateBpm = elapsedSec > 5 ? Math.round((this.totalBlinks / elapsedSec) * 60) : 15;
    } else {
      blinkRateBpm = this.blinkTimestamps.length;
    }

    return {
      averageEar: Number(avgEar.toFixed(3)),
      threshold: Number(threshold.toFixed(3)),
      baseline: Number(this.currentBaseline.toFixed(3)),
      isBlinkTriggered,
      isProlongedClosure,
      prolongedDurationMs,
      totalBlinks: this.totalBlinks,
      blinkRateBpm,
    };
  }
}
