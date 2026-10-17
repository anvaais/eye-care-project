/**
 * Core type definitions for AI EyeCare
 */

export interface Point2D {
  x: number;
  y: number;
  z?: number;
}

export interface EyeLandmarks {
  leftEye: Point2D[];
  rightEye: Point2D[];
}

export interface EyeMetrics {
  leftEar: number;
  rightEar: number;
  averageEar: number;
  baselineEar: number;
  thresholdEar: number;
  isBlinking: boolean;
  isProlongedClosure: boolean;
  prolongedDurationMs: number;
  blinkCount: number;
  blinkRateBpm: number;
  faceDetected: boolean;
  absenceDurationSec: number;
  fps: number;
}

export interface ScreenSessionState {
  isMonitoring: boolean;
  isPaused: boolean;
  sessionStartTime: number | null;
  activeScreenSec: number;
  remainingBreakSec: number;
  isBreakActive: boolean;
  breakCountdownSec: number;
  remindersTriggeredToday: number;
  breaksCompletedToday: number;
  breaksSnoozedToday: number;
  absenceDetected: boolean;
}

export interface UserSettings {
  breakIntervalMin: number; // default: 20
  breakDurationSec: number; // default: 20
  lowBlinkRateThreshold: number; // default: 12 bpm
  blinkSensitivity: 'low' | 'medium' | 'high';
  soundEnabled: boolean;
  volume: number; // 0 to 1
  showMeshOverlay: boolean;
  autoPauseOnAbsence: boolean;
  absenceThresholdSec: number; // default: 30
  notificationsEnabled: boolean;
}

export interface DailyStats {
  date: string;
  totalActiveMinutes: number;
  totalBlinks: number;
  averageBpm: number;
  breaksCompleted: number;
  breaksSnoozed: number;
  lowBlinkWarnings: number;
}

export interface PythonCodeFile {
  name: string;
  category: 'core' | 'ui' | 'tests' | 'config' | 'docs';
  description: string;
  content: string;
}
