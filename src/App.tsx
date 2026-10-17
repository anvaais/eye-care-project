import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { MedicalDisclaimerBanner } from './components/MedicalDisclaimerBanner';
import { CameraMonitor } from './components/CameraMonitor';
import { BlinkTelemetryCard } from './components/BlinkTelemetryCard';
import { BreakTimerCard } from './components/BreakTimerCard';
import { RestModal } from './components/RestModal';
import { StatsPanel } from './components/StatsPanel';
import { PythonCodeHub } from './components/PythonCodeHub';
import { SettingsModal } from './components/SettingsModal';
import { WellnessTipsCard } from './components/WellnessTipsCard';
import { audioEngine } from './utils/audio';
import {
  loadSettings,
  saveSettings,
  loadDailyStats,
  recordSessionStats,
  clearAllUserData,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { EyeMetrics, ScreenSessionState, UserSettings, DailyStats } from './types';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'monitor' | 'stats' | 'python' | 'settings'>('monitor');

  // Settings
  const [settings, setSettings] = useState<UserSettings>(loadSettings);

  // Daily statistics
  const [dailyStats, setDailyStats] = useState<Record<string, DailyStats>>(loadDailyStats);

  // Live Eye Metrics
  const [metrics, setMetrics] = useState<EyeMetrics>({
    leftEar: 0,
    rightEar: 0,
    averageEar: 0,
    baselineEar: 0.28,
    thresholdEar: 0.21,
    isBlinking: false,
    isProlongedClosure: false,
    prolongedDurationMs: 0,
    blinkCount: 0,
    blinkRateBpm: 0,
    faceDetected: false,
    absenceDurationSec: 0,
    fps: 0,
  });

  // Screen Session State
  const [session, setSession] = useState<ScreenSessionState>({
    isMonitoring: false,
    isPaused: false,
    sessionStartTime: null,
    activeScreenSec: 0,
    remainingBreakSec: settings.breakIntervalMin * 60,
    isBreakActive: false,
    breakCountdownSec: settings.breakDurationSec,
    remindersTriggeredToday: 0,
    breaksCompletedToday: 0,
    breaksSnoozedToday: 0,
    absenceDetected: false,
  });

  // Low blink rate reminder debounce
  const lastLowBlinkReminderRef = useRef<number>(0);
  const lowBlinkSustainedSecRef = useRef<number>(0);

  // Sync remainingBreakSec if break interval setting changes
  useEffect(() => {
    setSession((prev) => {
      const target = settings.breakIntervalMin * 60;
      return {
        ...prev,
        remainingBreakSec: Math.max(0, target - prev.activeScreenSec),
      };
    });
  }, [settings.breakIntervalMin]);

  // Save settings on update
  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Main 1-Second Session Stopwatch Ticker
  useEffect(() => {
    if (!session.isMonitoring || session.isPaused || session.isBreakActive) {
      return;
    }

    const interval = setInterval(() => {
      setSession((prev) => {
        // Absence check
        const isAbsent =
          settings.autoPauseOnAbsence &&
          !metrics.faceDetected &&
          metrics.absenceDurationSec >= settings.absenceThresholdSec;

        // If user is absent from webcam, pause screen session accumulation
        if (isAbsent) {
          return {
            ...prev,
            absenceDetected: true,
          };
        }

        const newActiveSec = prev.activeScreenSec + 1;
        const targetSec = settings.breakIntervalMin * 60;
        const remaining = Math.max(0, targetSec - newActiveSec);

        // Check if interval reached for 20-20-20 rest
        if (remaining <= 0) {
          return {
            ...prev,
            absenceDetected: false,
            isBreakActive: true,
            breakCountdownSec: settings.breakDurationSec,
            remindersTriggeredToday: prev.remindersTriggeredToday + 1,
            remainingBreakSec: 0,
          };
        }

        return {
          ...prev,
          absenceDetected: false,
          activeScreenSec: newActiveSec,
          remainingBreakSec: remaining,
        };
      });

      // Low blink rate sustained check (screen strain warning)
      if (
        metrics.faceDetected &&
        metrics.blinkCount > 3 &&
        metrics.blinkRateBpm < settings.lowBlinkRateThreshold
      ) {
        lowBlinkSustainedSecRef.current += 1;
        const now = Date.now();
        // If low blink rate persists for >= 120s and cooldown of 5 mins passed
        if (
          lowBlinkSustainedSecRef.current >= 120 &&
          now - lastLowBlinkReminderRef.current > 300000
        ) {
          lastLowBlinkReminderRef.current = now;
          lowBlinkSustainedSecRef.current = 0;
          if (settings.soundEnabled) {
            audioEngine.playSoftPing(settings.volume);
          }
        }
      } else {
        lowBlinkSustainedSecRef.current = 0;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    session.isMonitoring,
    session.isPaused,
    session.isBreakActive,
    metrics.faceDetected,
    metrics.absenceDurationSec,
    metrics.blinkCount,
    metrics.blinkRateBpm,
    settings.autoPauseOnAbsence,
    settings.absenceThresholdSec,
    settings.breakIntervalMin,
    settings.breakDurationSec,
    settings.lowBlinkRateThreshold,
    settings.soundEnabled,
    settings.volume,
  ]);

  // Start / Stop Monitoring Handler
  const handleToggleMonitoring = useCallback(() => {
    setSession((prev) => {
      const willMonitor = !prev.isMonitoring;
      return {
        ...prev,
        isMonitoring: willMonitor,
        isPaused: false,
        sessionStartTime: willMonitor ? Date.now() : prev.sessionStartTime,
      };
    });
  }, []);

  // Pause / Resume Session Handler
  const handlePauseResume = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  // Manual Instant Break Trigger
  const handleTriggerBreak = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      isBreakActive: true,
      breakCountdownSec: settings.breakDurationSec,
      remindersTriggeredToday: prev.remindersTriggeredToday + 1,
    }));
  }, [settings.breakDurationSec]);

  // Complete Break Handler
  const handleCompleteBreak = useCallback(() => {
    const target = settings.breakIntervalMin * 60;
    setSession((prev) => ({
      ...prev,
      isBreakActive: false,
      activeScreenSec: 0,
      remainingBreakSec: target,
      breaksCompletedToday: prev.breaksCompletedToday + 1,
    }));

    // Record stats to local storage
    recordSessionStats(
      settings.breakIntervalMin,
      metrics.blinkCount,
      1,
      0,
      0
    );
    setDailyStats(loadDailyStats());
  }, [settings.breakIntervalMin, metrics.blinkCount]);

  // Snooze Break Handler (5 minutes)
  const handleSnooze = useCallback((minutes: number = 5) => {
    const target = settings.breakIntervalMin * 60;
    const snoozeSec = minutes * 60;
    const newActive = Math.max(0, target - snoozeSec);

    setSession((prev) => ({
      ...prev,
      isBreakActive: false,
      activeScreenSec: newActive,
      remainingBreakSec: snoozeSec,
      breaksSnoozedToday: prev.breaksSnoozedToday + 1,
    }));

    recordSessionStats(0, 0, 0, 1, 0);
    setDailyStats(loadDailyStats());
  }, [settings.breakIntervalMin]);

  // Dismiss Break Reminder
  const handleDismiss = useCallback(() => {
    const target = settings.breakIntervalMin * 60;
    setSession((prev) => ({
      ...prev,
      isBreakActive: false,
      activeScreenSec: 0,
      remainingBreakSec: target,
    }));
  }, [settings.breakIntervalMin]);

  // Reset Session Stopwatch
  const handleResetSession = useCallback(() => {
    const target = settings.breakIntervalMin * 60;
    setSession((prev) => ({
      ...prev,
      activeScreenSec: 0,
      remainingBreakSec: target,
    }));
  }, [settings.breakIntervalMin]);

  // Clear All Local Data
  const handleClearAllData = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all stored statistics and reset settings?')) {
      clearAllUserData();
      setSettings(DEFAULT_SETTINGS);
      setDailyStats({});
      setSession((prev) => ({
        ...prev,
        breaksCompletedToday: 0,
        breaksSnoozedToday: 0,
        remindersTriggeredToday: 0,
        activeScreenSec: 0,
        remainingBreakSec: DEFAULT_SETTINGS.breakIntervalMin * 60,
      }));
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Navigation Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMonitoring={session.isMonitoring}
        onToggleMonitoring={handleToggleMonitoring}
        faceDetected={metrics.faceDetected}
      />

      {/* Non-Medical Wellness Disclaimer Notice */}
      <MedicalDisclaimerBanner />

      {/* Main Content Area based on Active Tab */}
      <main className="flex-1">
        {activeTab === 'monitor' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Live Webcam Feed & Vision Canvas */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <CameraMonitor
                  isMonitoring={session.isMonitoring}
                  onToggleMonitoring={handleToggleMonitoring}
                  settings={settings}
                  onMetricsUpdate={setMetrics}
                  onBlinkDetected={() => {}}
                  onProlongedClosure={() => {}}
                />

                <WellnessTipsCard />
              </div>

              {/* Right Column: Screen Timer & Live Telemetry Gauges */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <BreakTimerCard
                  session={session}
                  settings={settings}
                  onPauseResume={handlePauseResume}
                  onResetSession={handleResetSession}
                  onTriggerBreak={handleTriggerBreak}
                />

                <BlinkTelemetryCard metrics={metrics} settings={settings} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <StatsPanel
            stats={dailyStats}
            session={session}
            metrics={metrics}
            onClearStats={handleClearAllData}
          />
        )}

        {activeTab === 'python' && <PythonCodeHub />}

        {activeTab === 'settings' && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onClearAllData={handleClearAllData}
          />
        )}
      </main>

      {/* 20-20-20 Screen Rest Reminder Modal */}
      <RestModal
        isOpen={session.isBreakActive}
        onComplete={handleCompleteBreak}
        onSnooze={handleSnooze}
        onDismiss={handleDismiss}
        settings={settings}
      />
    </div>
  );
}
