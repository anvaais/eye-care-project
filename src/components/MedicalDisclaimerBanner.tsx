import React, { useState } from 'react';
import { ShieldCheck, Info, X } from 'lucide-react';

export const MedicalDisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 text-xs text-slate-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <p className="truncate">
            <span className="font-semibold text-slate-200">Wellness Habit Assistant:</span>{' '}
            AI EyeCare provides habit reinforcement and estimated blink activity. It is not a clinical or diagnostic medical tool. All camera processing runs 100% locally on your device.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors shrink-0"
          title="Dismiss notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
