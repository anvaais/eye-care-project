import React from 'react';
import { BarChart3, Calendar, CheckCircle2, Clock, Trash2, Shield, Eye, Flame, AlertCircle } from 'lucide-react';
import { DailyStats, ScreenSessionState, EyeMetrics } from '../types';

interface StatsPanelProps {
  stats: Record<string, DailyStats>;
  session: ScreenSessionState;
  metrics: EyeMetrics;
  onClearStats: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  session,
  metrics,
  onClearStats,
}) => {
  const statEntries = Object.values(stats).sort((a, b) => b.date.localeCompare(a.date));
  const todayEntry = statEntries[0];

  // Aggregate stats across stored history
  const totalBreaksTaken = statEntries.reduce((acc, curr) => acc + curr.breaksCompleted, 0);
  const totalBlinksLogged = statEntries.reduce((acc, curr) => acc + curr.totalBlinks, 0);
  const totalMinutesTracked = statEntries.reduce((acc, curr) => acc + curr.totalActiveMinutes, 0);
  const avgBpmAllTime = totalMinutesTracked > 0 ? Math.round(totalBlinksLogged / totalMinutesTracked) : 15;

  // Calculate habit adherence score
  const totalRemindersTriggered = session.remindersTriggeredToday + (todayEntry ? todayEntry.breaksCompleted + todayEntry.breaksSnoozed : 0);
  const adherenceScore = totalRemindersTriggered > 0
    ? Math.min(100, Math.round(((session.breaksCompletedToday + (todayEntry?.breaksCompleted || 0)) / Math.max(1, totalRemindersTriggered)) * 100))
    : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Screen Habit & Blink Telemetry Statistics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated locally on your browser. Zero telemetry is sent to any external server.
          </p>
        </div>

        <button
          onClick={onClearStats}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-rose-950/40 hover:border-rose-800 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All Stats</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Focus Time */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Active Screen Time</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {Math.floor(session.activeScreenSec / 60)}m {session.activeScreenSec % 60}s
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {todayEntry ? `+ ${Math.round(todayEntry.totalActiveMinutes)}m previous today` : 'First session today'}
          </span>
        </div>

        {/* Card 2: Estimated Blinks */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Blinks Recorded</span>
            <Eye className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
            {metrics.blinkCount + (todayEntry ? todayEntry.totalBlinks : 0)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Current Rate: {metrics.blinkRateBpm} BPM
          </span>
        </div>

        {/* Card 3: Breaks Completed */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>20-20-20 Breaks Taken</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {session.breaksCompletedToday + (todayEntry ? todayEntry.breaksCompleted : 0)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {totalBreaksTaken} all-time completed
          </span>
        </div>

        {/* Card 4: Habit Adherence Score */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Habit Adherence</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
            {adherenceScore}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Based on completed vs snoozed rests
          </span>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200">Daily Session History</h2>
          </div>
          <span className="text-xs text-slate-400">Past 7 days</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Active Focus</th>
                <th className="py-3 px-4 text-right">Estimated Blinks</th>
                <th className="py-3 px-4 text-right">Avg Rate</th>
                <th className="py-3 px-4 text-right">Breaks Completed</th>
                <th className="py-3 px-4 text-right">Breaks Snoozed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {statEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No sessions logged yet. Begin monitoring to record daily screen habits.
                  </td>
                </tr>
              ) : (
                statEntries.map((row) => (
                  <tr key={row.date} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">{row.date}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{row.totalActiveMinutes} mins</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-cyan-400">{row.totalBlinks}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{row.averageBpm} bpm</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-400">
                      {row.breaksCompleted}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-400">
                      {row.breaksSnoozed}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Privacy Notice Box */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex items-start gap-3 text-xs text-slate-400">
        <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-semibold text-slate-300">Zero Data Retention Policy</p>
          <p>
            AI EyeCare only retains simple counters (daily minutes and blink counts) in your browser’s localStorage. It never records, captures, or transmits camera frames, facial landmark coordinates, or network telemetry.
          </p>
        </div>
      </div>
    </div>
  );
};
