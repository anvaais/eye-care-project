import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle, Moon, Zap } from 'lucide-react';
import { EyeMetrics, UserSettings } from '../types';

interface BlinkTelemetryCardProps {
  metrics: EyeMetrics;
  settings: UserSettings;
}

export const BlinkTelemetryCard: React.FC<BlinkTelemetryCardProps> = ({
  metrics,
  settings,
}) => {
  // Rolling sparkline history of average EAR values
  const [earHistory, setEarHistory] = useState<number[]>(new Array(30).fill(0.28));

  useEffect(() => {
    if (metrics.averageEar > 0) {
      setEarHistory((prev) => [...prev.slice(1), metrics.averageEar]);
    }
  }, [metrics.averageEar]);

  // Determine blink rate health band
  const isLowBlinkRate = metrics.blinkRateBpm < settings.lowBlinkRateThreshold && metrics.blinkCount > 2;
  const isElevatedBlinkRate = metrics.blinkRateBpm > 26;

  // Status text and color
  let bpmLabel = 'Nominal (12-20 bpm)';
  let bpmColor = 'text-emerald-400';
  let bpmBg = 'bg-emerald-500/10 border-emerald-500/20';

  if (isLowBlinkRate) {
    bpmLabel = 'Low Blink Rate (Screen Strain Risk)';
    bpmColor = 'text-amber-400';
    bpmBg = 'bg-amber-500/10 border-amber-500/20';
  } else if (isElevatedBlinkRate) {
    bpmLabel = 'Elevated Frequency';
    bpmColor = 'text-indigo-400';
    bpmBg = 'bg-indigo-500/10 border-indigo-500/20';
  }

  // Calculate percentage of EAR compared to baseline
  const earPercentage = Math.min(100, Math.max(0, Math.round((metrics.averageEar / 0.4) * 100)));
  const thresholdPercentage = Math.min(100, Math.max(0, Math.round((metrics.thresholdEar / 0.4) * 100)));

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-200">Live Blink Telemetry</h2>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Threshold: {metrics.thresholdEar.toFixed(3)}
        </span>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Metric 1: Estimated Blink Rate (BPM) */}
        <div className={`p-4 rounded-lg border ${bpmBg} flex flex-col justify-between transition-colors`}>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Estimated Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-white">
                {metrics.blinkRateBpm}
              </span>
              <span className="text-xs text-slate-400">blinks/min</span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
            {isLowBlinkRate ? (
              <AlertCircle className={`w-3.5 h-3.5 ${bpmColor} shrink-0`} />
            ) : (
              <CheckCircle className={`w-3.5 h-3.5 ${bpmColor} shrink-0`} />
            )}
            <span className={bpmColor}>{bpmLabel}</span>
          </div>
        </div>

        {/* Metric 2: Total Blinks Count */}
        <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/50 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Blinks Counted
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-cyan-400">
                {metrics.blinkCount}
              </span>
              <span className="text-xs text-slate-500">this session</span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sensitivity: {settings.blinkSensitivity}</span>
          </div>
        </div>
      </div>

      {/* Eye Aspect Ratio (EAR) Bar Gauge */}
      <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/30">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-300">Eye Aspect Ratio (EAR)</span>
          <div className="font-mono text-slate-400 flex items-center gap-2">
            <span>L: {metrics.leftEar.toFixed(2)}</span>
            <span>·</span>
            <span>R: {metrics.rightEar.toFixed(2)}</span>
            <span>·</span>
            <span className="text-white font-bold">Avg: {metrics.averageEar.toFixed(3)}</span>
          </div>
        </div>

        {/* Dynamic EAR Progress Meter with Threshold Marker */}
        <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          {/* Active Level */}
          <div
            className={`h-full transition-all duration-75 rounded-full ${
              metrics.averageEar < metrics.thresholdEar
                ? 'bg-rose-500 shadow-sm shadow-rose-500'
                : 'bg-cyan-500'
            }`}
            style={{ width: `${earPercentage}%` }}
          />

          {/* Closure Threshold Indicator Needle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
            style={{ left: `${thresholdPercentage}%` }}
            title={`Closure Threshold: ${metrics.thresholdEar}`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 font-mono">
          <span>0.00 (Closed)</span>
          <span className="text-amber-400">▲ Trigger Point</span>
          <span>0.40+ (Open)</span>
        </div>
      </div>

      {/* Real-time EAR Sparkline */}
      <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Real-Time Waveform (Past 30 frames)</span>
          <span className="text-[11px] font-mono text-slate-500">
            {metrics.isBlinking ? '⚡ Blink Event' : 'Monitoring'}
          </span>
        </div>

        <div className="h-10 flex items-end gap-1">
          {earHistory.map((val, idx) => {
            const h = Math.min(100, Math.max(8, Math.round((val / 0.4) * 100)));
            const isBelowThresh = val < metrics.thresholdEar;
            return (
              <div
                key={idx}
                className="flex-1 rounded-t transition-all duration-75"
                style={{
                  height: `${h}%`,
                  backgroundColor: isBelowThresh ? '#F43F5E' : '#06B6D4',
                  opacity: 0.3 + (idx / earHistory.length) * 0.7,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Prolonged Eye Closure Warning Banner */}
      {metrics.isProlongedClosure && (
        <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-700/80 text-amber-200 text-xs flex items-center gap-2.5 animate-pulse">
          <Moon className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <p className="font-semibold">Prolonged Eye Closure Detected ({Math.round(metrics.prolongedDurationMs / 1000)}s)</p>
            <p className="text-amber-300/80 text-[11px]">
              Micro-nap or extended resting recognized. This is not counted as an individual blink.
            </p>
          </div>
        </div>
      )}

      {/* Footnote Labeling Estimates */}
      <p className="text-[11px] text-slate-500 italic">
        *Blink rate and EAR calculations are algorithmic estimates based on facial landmarks and do not represent clinical ophthalmic measurements.
      </p>
    </div>
  );
};
