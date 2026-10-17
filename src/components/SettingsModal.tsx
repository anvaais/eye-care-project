import React from 'react';
import {
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Clock,
  Shield,
  Trash2,
  Sliders,
  Check,
  Eye,
  UserCheck,
} from 'lucide-react';
import { UserSettings } from '../types';
import { audioEngine } from '../utils/audio';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClearAllData,
}) => {
  const handleTestChime = () => {
    audioEngine.playRestChime(settings.volume);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-cyan-400" />
          <span>Application Settings & Privacy Configuration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Customize break frequencies, computer vision sensitivity, and review on-device data storage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: 20-20-20 Break Schedule */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Screen Rest Intervals</span>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2">
              Continuous Screen Interval (Minutes)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 20, 30, 45].map((mins) => (
                <button
                  key={mins}
                  onClick={() => onUpdateSettings({ ...settings, breakIntervalMin: mins })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold font-mono tabular-nums transition-colors ${
                    settings.breakIntervalMin === mins
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-500 mt-1.5 block">
              Default is 20 minutes in adherence with the standard 20-20-20 clinical habit rule.
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2">
              Break Countdown Duration
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[20, 30].map((secs) => (
                <button
                  key={secs}
                  onClick={() => onUpdateSettings({ ...settings, breakDurationSec: secs })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold font-mono tabular-nums transition-colors ${
                    settings.breakDurationSec === secs
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {secs} Seconds
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
            <div>
              <span className="text-xs font-medium text-slate-200 block">Absence Auto-Pause</span>
              <span className="text-[11px] text-slate-500 block">
                Pause screen session when you step away for &gt;30s
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoPauseOnAbsence}
              onChange={(e) => onUpdateSettings({ ...settings, autoPauseOnAbsence: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
            />
          </div>
        </div>

        {/* Section 2: Blink Detection & Computer Vision Sensitivity */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Blink Detection Sensitivity</span>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2">
              Detection Sensitivity Profile
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => onUpdateSettings({ ...settings, blinkSensitivity: level })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    settings.blinkSensitivity === level
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-500 mt-1.5 block">
              &quot;Medium&quot; provides balanced dual-eye EAR thresholding for eyeglasses and normal head movement.
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
              <span>Low Blink Rate Warning Threshold</span>
              <span className="font-mono font-bold text-amber-400">
                {settings.lowBlinkRateThreshold} BPM
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="18"
              value={settings.lowBlinkRateThreshold}
              onChange={(e) =>
                onUpdateSettings({ ...settings, lowBlinkRateThreshold: Number(e.target.value) })
              }
              className="w-full accent-indigo-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Triggers a gentle reminder if rolling blink rate stays below this threshold.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
            <div>
              <span className="text-xs font-medium text-slate-200 block">Eye Mesh Wireframe</span>
              <span className="text-[11px] text-slate-500 block">
                Render facial landmarks on live camera preview
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.showMeshOverlay}
              onChange={(e) => onUpdateSettings({ ...settings, showMeshOverlay: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
            />
          </div>
        </div>

        {/* Section 3: Audio & Chime Feedback */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>Audio & Gentle Reminders</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-200 block">Chime Sounds</span>
              <span className="text-[11px] text-slate-500 block">
                Play synthesized acoustic chord when a 20-20-20 rest triggers
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
            />
          </div>

          {settings.soundEnabled && (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                <span>Chime Volume</span>
                <span className="font-mono font-bold text-cyan-400">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={settings.volume}
                onChange={(e) => onUpdateSettings({ ...settings, volume: Number(e.target.value) })}
                className="w-full accent-cyan-500"
              />
              <div className="mt-3">
                <button
                  onClick={handleTestChime}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Test Gentle Acoustic Chime</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Privacy & Data Retention */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Local Privacy & Storage</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 leading-relaxed flex flex-col gap-2">
            <p className="flex items-center gap-1.5 text-slate-300 font-medium">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Camera Security Protocol</span>
            </p>
            <p>
              Camera video frames are computed purely inside memory using client-side WebAssembly / GPU shaders.
              No video, image captures, audio, or biometric landmark vectors ever leave your computer.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onClearAllData}
              className="w-full py-2 px-3 rounded-lg border border-rose-800/80 bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All Saved Statistics & Reset App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
