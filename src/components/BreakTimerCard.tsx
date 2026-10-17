import React from 'react';
import { Clock, Pause, Play, RotateCcw, Coffee, UserX } from 'lucide-react';
import { ScreenSessionState, UserSettings } from '../types';

interface BreakTimerCardProps {
  session: ScreenSessionState;
  settings: UserSettings;
  onPauseResume: () => void;
  onResetSession: () => void;
  onTriggerBreak: () => void;
}

export const BreakTimerCard: React.FC<BreakTimerCardProps> = ({
  session,
  settings,
  onPauseResume,
  onResetSession,
  onTriggerBreak,
}) => {
  // Format seconds into MM:SS or HH:MM:SS
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hrs}h ${remainingMins}m ${secs}s`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const targetSec = settings.breakIntervalMin * 60;
  const progressRatio = Math.min(1, Math.max(0, session.activeScreenSec / targetSec));
  const strokeDashoffset = 283 - 283 * progressRatio; // Circle circumference ~ 2 * PI * 45 ≈ 283

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-200">Screen-Time & 20-20-20 Rule</h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Interval: {settings.breakIntervalMin} mins
        </span>
      </div>

      {/* Main Countdown Centerpiece */}
      <div className="flex items-center justify-center py-2">
        <div className="relative w-44 h-44 flex items-center justify-center">
          {/* Circular SVG Gauge */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              className="text-slate-800"
              strokeWidth="7"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Dynamic progress ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              className={
                session.remainingBreakSec <= 60
                  ? 'text-rose-500'
                  : session.remainingBreakSec <= 300
                  ? 'text-amber-400'
                  : 'text-indigo-500'
              }
              strokeWidth="7"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            />
          </svg>

          {/* Central Counter Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
              Next Rest In
            </span>
            <span className="text-3xl font-bold font-mono tabular-nums text-white">
              {formatTime(session.remainingBreakSec)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              {session.isPaused
                ? 'Session Paused'
                : session.absenceDetected
                ? 'Absence Paused'
                : 'Session Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Absence Alert Notification Strip */}
      {session.absenceDetected && !session.isPaused && (
        <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-300 flex items-center gap-2">
          <UserX className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>No face detected for &gt;30s. Screen-time timer paused automatically.</span>
        </div>
      )}

      {/* Active Session Info Stats */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40">
          <span className="text-slate-400 block mb-1">Continuous Focus</span>
          <span className="text-base font-bold font-mono tabular-nums text-slate-200">
            {formatTime(session.activeScreenSec)}
          </span>
        </div>
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40">
          <span className="text-slate-400 block mb-1">Breaks Taken Today</span>
          <span className="text-base font-bold font-mono tabular-nums text-emerald-400">
            {session.breaksCompletedToday}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onPauseResume}
          className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          {session.isPaused ? (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume Timer</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause Timer</span>
            </>
          )}
        </button>

        <button
          onClick={onTriggerBreak}
          className="py-2 px-3 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          title="Take a 20-second break now"
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>Rest Now</span>
        </button>

        <button
          onClick={onResetSession}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          title="Reset screen-time accumulator"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
