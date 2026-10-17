import React, { useEffect, useState } from 'react';
import { Eye, Bell, CheckCircle2, Clock, X, Volume2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../utils/audio';
import { UserSettings } from '../types';

interface RestModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onSnooze: (minutes: number) => void;
  onDismiss: () => void;
  settings: UserSettings;
}

export const RestModal: React.FC<RestModalProps> = ({
  isOpen,
  onComplete,
  onSnooze,
  onDismiss,
  settings,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(settings.breakDurationSec || 20);

  // Play audio chime upon modal opening
  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(settings.breakDurationSec || 20);
      if (settings.soundEnabled) {
        audioEngine.playRestChime(settings.volume);
      }
    }
  }, [isOpen, settings.breakDurationSec, settings.soundEnabled, settings.volume]);

  // Rest countdown ticker
  useEffect(() => {
    if (!isOpen) return;

    if (secondsLeft <= 0) {
      // Completed automatically
      handleCompleteAction();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, secondsLeft]);

  const handleCompleteAction = () => {
    if (settings.soundEnabled) {
      audioEngine.playBreakCompleteSound(settings.volume);
    }
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#06B6D4', '#6366F1', '#10B981'],
      });
    } catch (e) {
      // Ignore if confetti unavailable
    }
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-indigo-500/30 bg-slate-900 p-6 md:p-8 shadow-2xl text-center flex flex-col items-center">
        {/* Close / Dismiss Icon Button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Dismiss reminder"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pulsing Visual Focus Target */}
        <div className="relative w-28 h-28 my-3 flex items-center justify-center">
          {/* Animated concentric breathing ripples */}
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping opacity-30" />
          <div className="absolute inset-2 rounded-full bg-indigo-500/20 animate-pulse" />
          
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 p-1 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-full flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
                {secondsLeft}s
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase">rest</span>
            </div>
          </div>
        </div>

        {/* Heading & Guidance */}
        <h2 className="text-xl font-bold text-white mb-2">
          Time for Your 20-20-20 Break
        </h2>

        <p className="text-sm text-slate-300 max-w-md leading-relaxed mb-4">
          Shift your gaze away from your screen and look at an object at least{' '}
          <strong className="text-cyan-400 font-semibold">20 feet (6 meters) away</strong> for{' '}
          <strong className="text-cyan-400 font-semibold">20 seconds</strong>.
        </p>

        {/* Relaxation Ergonomic Tips Box */}
        <div className="w-full p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 text-left text-xs text-slate-400 mb-6 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Relaxation Suggestions</span>
          </div>
          <p>· Blink gently and naturally several times to replenish tear film.</p>
          <p>· Relax facial muscles around your forehead, eyebrows, and temples.</p>
          <p>· Take one deep diaphragmatic breath in through your nose and out your mouth.</p>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handleCompleteAction}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Break</span>
          </button>

          <button
            onClick={() => onSnooze(5)}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Snooze (5 min)</span>
          </button>

          <button
            onClick={onDismiss}
            className="w-full sm:w-auto py-2.5 px-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-semibold text-xs transition-colors"
          >
            Dismiss
          </button>
        </div>

        {/* Non-Medical Habit Disclaimer */}
        <p className="text-[11px] text-slate-500 mt-4 leading-normal">
          *The 20-20-20 rule encourages natural habit resets and ocular muscle relaxation. It does not medically guarantee prevention or cure of digital eye strain.
        </p>
      </div>
    </div>
  );
};
