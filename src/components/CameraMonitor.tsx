import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Eye, Sparkles, UserCheck, AlertTriangle } from 'lucide-react';
import { initializeFaceLandmarker, extractEyeLandmarks } from '../utils/faceLandmarker';
import { calculateEAR, BlinkTracker } from '../utils/ear';
import { EyeMetrics, UserSettings } from '../types';

interface CameraMonitorProps {
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  settings: UserSettings;
  onMetricsUpdate: (metrics: EyeMetrics) => void;
  onBlinkDetected: () => void;
  onProlongedClosure: () => void;
}

export const CameraMonitor: React.FC<CameraMonitorProps> = ({
  isMonitoring,
  onToggleMonitoring,
  settings,
  onMetricsUpdate,
  onBlinkDetected,
  onProlongedClosure,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [mirrored, setMirrored] = useState(true);
  const [simulationMode, setSimulationMode] = useState(false);
  const [fps, setFps] = useState(0);

  // Persistent instances
  const trackerRef = useRef<BlinkTracker>(new BlinkTracker());
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<any>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastFaceTimeRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);
  const fpsTimerRef = useRef<number>(Date.now());

  // Simulation state
  const simStateRef = useRef<{
    isClosed: boolean;
    nextBlinkTime: number;
    absenceActive: boolean;
  }>({
    isClosed: false,
    nextBlinkTime: Date.now() + 2500,
    absenceActive: false,
  });

  const lastVideoTimeRef = useRef<number>(-1);
  const lastTimestampRef = useRef<number>(0);
  const lastExtractedRef = useRef<{ leftEye: any[]; rightEye: any[]; detected: boolean }>({
    leftEye: [],
    rightEye: [],
    detected: false,
  });

  // Update sensitivity in tracker
  useEffect(() => {
    trackerRef.current.sensitivity = settings.blinkSensitivity;
  }, [settings.blinkSensitivity]);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    lastVideoTimeRef.current = -1;
    lastTimestampRef.current = 0;
  }, []);

  // Initialize webcam
  const startCamera = useCallback(async () => {
    setCameraError(null);

    // 1. Immediately request camera so feed displays with zero latency
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access failed:', err);
      let msg = 'Could not access laptop webcam. Please grant camera permissions.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in your browser address bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No webcam hardware detected on this device. You can test using Simulation Mode.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is currently in use by another application. Please close other camera apps.';
      }
      setCameraError(msg);
      return;
    }

    // 2. Initialize MediaPipe Face Landmarker concurrently
    if (!landmarkerRef.current) {
      setIsModelLoading(true);
      try {
        const landmarker = await initializeFaceLandmarker();
        landmarkerRef.current = landmarker;
      } catch (e) {
        console.warn('FaceLandmarker model setup warning:', e);
      } finally {
        setIsModelLoading(false);
      }
    }
  }, []);

  // React to isMonitoring state
  useEffect(() => {
    if (isMonitoring) {
      if (!simulationMode) {
        startCamera();
      }
      trackerRef.current.reset();
      lastFaceTimeRef.current = Date.now();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isMonitoring, simulationMode, startCamera, stopCameraStream]);

  // Main Detection Loop
  useEffect(() => {
    if (!isMonitoring) return;

    let isRunning = true;

    const renderLoop = () => {
      if (!isRunning) return;

      const now = Date.now();

      // FPS tracking
      frameCountRef.current += 1;
      if (now - fpsTimerRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        fpsTimerRef.current = now;
      }

      // Handle Simulation Mode
      if (simulationMode) {
        handleSimulationFrame(now);
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      // Handle Real Webcam Frame
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 2 && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;

          // Clear previous drawings
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          let leftEar = 0;
          let rightEar = 0;
          let faceDetected = false;

          if (landmarkerRef.current) {
            try {
              if (video.currentTime !== lastVideoTimeRef.current) {
                lastVideoTimeRef.current = video.currentTime;
                const nowMs = performance.now();
                if (nowMs > lastTimestampRef.current) {
                  lastTimestampRef.current = nowMs;
                  const results = landmarkerRef.current.detectForVideo(video, nowMs);
                  const extracted = extractEyeLandmarks(results);
                  lastExtractedRef.current = {
                    leftEye: extracted.leftEyeLandmarks,
                    rightEye: extracted.rightEyeLandmarks,
                    detected: extracted.faceDetected,
                  };
                }
              }

              const cached = lastExtractedRef.current;
              if (cached.detected && cached.leftEye.length >= 6) {
                faceDetected = true;
                lastFaceTimeRef.current = now;

                leftEar = calculateEAR(cached.leftEye);
                rightEar = calculateEAR(cached.rightEye);

                // Draw wireframe around eyes if enabled
                if (settings.showMeshOverlay) {
                  drawEyeWireframe(ctx, cached.leftEye, canvas.width, canvas.height, mirrored);
                  drawEyeWireframe(ctx, cached.rightEye, canvas.width, canvas.height, mirrored);
                }
              }
            } catch (err) {
              console.debug('Landmark detection pass skipped', err);
            }
          }

          // Compute absence duration
          const absenceDurationSec = faceDetected ? 0 : Math.round((now - lastFaceTimeRef.current) / 1000);

          // Update Blink Tracker state machine
          const trackerResult = trackerRef.current.processFrame(leftEar, rightEar, now);

          if (trackerResult.isBlinkTriggered) {
            onBlinkDetected();
          }
          if (trackerResult.isProlongedClosure) {
            onProlongedClosure();
          }

          onMetricsUpdate({
            leftEar: Number(leftEar.toFixed(3)),
            rightEar: Number(rightEar.toFixed(3)),
            averageEar: trackerResult.averageEar,
            baselineEar: trackerResult.baseline,
            thresholdEar: trackerResult.threshold,
            isBlinking: trackerResult.isBlinkTriggered,
            isProlongedClosure: trackerResult.isProlongedClosure,
            prolongedDurationMs: trackerResult.prolongedDurationMs,
            blinkCount: trackerResult.totalBlinks,
            blinkRateBpm: trackerResult.blinkRateBpm,
            faceDetected,
            absenceDurationSec,
            fps,
          });
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isMonitoring, simulationMode, settings.showMeshOverlay, mirrored, fps, onBlinkDetected, onProlongedClosure, onMetricsUpdate]);

  // Helper: Draw subtle eye contour on canvas
  const drawEyeWireframe = (
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number }[],
    width: number,
    height: number,
    isMirrored: boolean
  ) => {
    if (points.length < 6) return;

    ctx.save();
    ctx.strokeStyle = '#06B6D4'; // cyan
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    points.forEach((p, idx) => {
      const px = isMirrored ? (1 - p.x) * width : p.x * width;
      const py = p.y * height;
      if (idx === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Draw landmark vertices
    ctx.fillStyle = '#67E8F9';
    points.forEach((p) => {
      const px = isMirrored ? (1 - p.x) * width : p.x * width;
      const py = p.y * height;
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  };

  // Helper: Simulate realistic eye dynamics when camera unavailable
  const handleSimulationFrame = (now: number) => {
    const sim = simStateRef.current;
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render stylized synthetic test eyes
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cx1 = canvas.width * 0.4;
        const cx2 = canvas.width * 0.6;
        const cy = canvas.height * 0.5;

        // Scheduled blink state machine
        if (now >= sim.nextBlinkTime) {
          sim.isClosed = true;
          // Hold blink for 140ms
          if (now >= sim.nextBlinkTime + 140) {
            sim.isClosed = false;
            // Schedule next blink in 2.5 to 5.0 seconds (healthy human rate)
            sim.nextBlinkTime = now + 2500 + Math.random() * 2500;
          }
        }

        const eyeHeight = sim.absenceActive ? 0 : sim.isClosed ? 3 : 24;
        const eyeWidth = 50;

        // Draw left synthetic eye
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx1, cy, eyeWidth / 2, Math.max(1, eyeHeight / 2), 0, 0, Math.PI * 2);
        ctx.stroke();

        // Draw right synthetic eye
        ctx.beginPath();
        ctx.ellipse(cx2, cy, eyeWidth / 2, Math.max(1, eyeHeight / 2), 0, 0, Math.PI * 2);
        ctx.stroke();

        // Draw pupils if open
        if (!sim.isClosed && !sim.absenceActive) {
          ctx.fillStyle = '#6366F1';
          ctx.beginPath();
          ctx.arc(cx1, cy, 7, 0, Math.PI * 2);
          ctx.arc(cx2, cy, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    const faceDetected = !sim.absenceActive;
    const simEar = sim.absenceActive ? 0 : sim.isClosed ? 0.08 : 0.31 + (Math.sin(now / 500) * 0.01);

    const trackerResult = trackerRef.current.processFrame(simEar, simEar, now);

    if (trackerResult.isBlinkTriggered) {
      onBlinkDetected();
    }

    onMetricsUpdate({
      leftEar: Number(simEar.toFixed(3)),
      rightEar: Number(simEar.toFixed(3)),
      averageEar: trackerResult.averageEar,
      baselineEar: trackerResult.baseline,
      thresholdEar: trackerResult.threshold,
      isBlinking: trackerResult.isBlinkTriggered,
      isProlongedClosure: false,
      prolongedDurationMs: 0,
      blinkCount: trackerResult.totalBlinks,
      blinkRateBpm: trackerResult.blinkRateBpm,
      faceDetected,
      absenceDurationSec: sim.absenceActive ? 40 : 0,
      fps: 30,
    });
  };

  const triggerManualSimBlink = () => {
    simStateRef.current.nextBlinkTime = Date.now();
  };

  const toggleSimAbsence = () => {
    simStateRef.current.absenceActive = !simStateRef.current.absenceActive;
  };

  return (
    <div className="relative rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl flex flex-col">
      {/* Top Monitor Bar */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">Real-Time Camera Feed</span>
          <span className="text-xs text-slate-500 font-mono">
            {isMonitoring ? `${fps} FPS` : 'Inactive'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Simulation Toggle */}
          <button
            onClick={() => {
              setSimulationMode(!simulationMode);
              if (!simulationMode) stopCameraStream();
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              simulationMode
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle simulation mode to test without a physical webcam"
          >
            {simulationMode ? 'Simulation Active' : 'Test Mode'}
          </button>

          {/* Mirror toggle */}
          <button
            onClick={() => setMirrored(!mirrored)}
            className={`p-1.5 rounded text-xs transition-colors ${
              mirrored ? 'text-cyan-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mirror webcam preview horizontally"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video & Canvas Viewport */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {isMonitoring ? (
          <>
            {/* Real Webcam Element */}
            {!simulationMode && (
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover transition-transform duration-200 ${
                  mirrored ? 'scale-x-[-1]' : ''
                }`}
              />
            )}

            {/* Canvas Landmark Overlay */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full pointer-events-none object-cover"
            />

            {/* Model Loading Spinner */}
            {isModelLoading && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-slate-300 gap-2 z-10">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Initializing MediaPipe Vision Model...</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500 shadow-inner">
              <CameraOff className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-200 mb-1">Camera Is Offline</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Click &quot;Start Monitoring&quot; to begin privacy-focused on-device eye tracking and screen-break reminders.
            </p>
            <button
              onClick={onToggleMonitoring}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              Start Monitoring
            </button>
          </div>
        )}

        {/* Camera Error Message */}
        {cameraError && isMonitoring && (
          <div className="absolute inset-x-4 bottom-4 p-3 rounded-lg bg-rose-950/90 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5 backdrop-blur-md shadow-lg z-20">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{cameraError}</p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => setSimulationMode(true)}
                  className="px-2 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded font-medium text-[11px]"
                >
                  Switch to Test Simulation
                </button>
                <button
                  onClick={startCamera}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px]"
                >
                  Retry Camera
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simulation Controls Strip */}
        {simulationMode && isMonitoring && (
          <div className="absolute bottom-3 inset-x-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2 flex items-center justify-between text-xs backdrop-blur-md">
            <span className="text-indigo-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Test Simulation Active
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={triggerManualSimBlink}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-[11px]"
              >
                Force Blink
              </button>
              <button
                onClick={toggleSimAbsence}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px]"
              >
                {simStateRef.current.absenceActive ? 'Simulate Return' : 'Simulate Absence'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Privacy Assurance Footer */}
      <div className="px-4 py-2.5 bg-slate-900/40 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local on-device inference</span>
        </span>
        <span className="text-slate-500">No recordings or network transmissions</span>
      </div>
    </div>
  );
};
