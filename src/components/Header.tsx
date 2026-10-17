import React from 'react';
import { Eye, Shield, Activity, Laptop, Play, Square, Settings as SettingsIcon } from 'lucide-react';

interface HeaderProps {
  activeTab: 'monitor' | 'stats' | 'python' | 'settings';
  setActiveTab: (tab: 'monitor' | 'stats' | 'python' | 'settings') => void;
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  faceDetected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isMonitoring,
  onToggleMonitoring,
  faceDetected,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5 shadow-md shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <Eye className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            AI EyeCare
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'monitor'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Monitor
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'stats'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Daily Telemetry
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'python'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Python Desktop Suite
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'settings'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Settings & Privacy
          </button>
        </nav>

        {/* Zone 3: Primary Action & Camera Status */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Real hardware status label */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono tabular-nums text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                !isMonitoring
                  ? 'bg-slate-600'
                  : faceDetected
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <span>
              {!isMonitoring ? 'Camera Off' : faceDetected ? 'Face Tracking' : 'Searching Face'}
            </span>
          </div>

          <button
            onClick={onToggleMonitoring}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all shadow-sm whitespace-nowrap shrink-0 ${
              isMonitoring
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
            }`}
          >
            {isMonitoring ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Monitoring</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Monitoring</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
