# AI EyeCare — Real-Time Eye Monitoring & Screen Break Assistant

AI EyeCare is a privacy-first computer vision wellness assistant that tracks blink dynamics and screen duration to prevent digital eye strain following the 20-20-20 rule. It provides an immediate, zero-install in-browser interactive monitoring experience powered by client-side facial landmark detection, paired with a complete, production-structured Python desktop application suite ready for local deployment and Windows executable packaging.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX choices have been established based on your preferences:
> - **Execution Mode**: Dual-delivery model — immediate interactive browser dashboard with real-time webcam tracking + downloadable modular Python desktop suite (`.zip` and individual code explorer).
> - **Blink Detection Algorithm**: Dual-eye Eye Aspect Ratio (EAR) with adaptive rolling calibration for tolerance against glasses, lighting fluctuations, and head posture changes.
> - **Reminder System**: Synthesized gentle acoustic chime, non-intrusive 20-second visual countdown modal, snooze/dismiss actions, and absence-aware screen session pauses.
> - **Privacy & Ethics Guarantee**: 100% on-device local frame processing (zero server upload or recording), clear camera active indicator, and explicit medical disclaimer confirming it is a wellness reminder, not a medical diagnostic device.

---

## 1. Overview & Core Concept

- **What It Does**: AI EyeCare monitors blink frequency and continuous screen focus via webcam feed. When screen engagement reaches the configured interval (e.g. 20 minutes) or blink rates fall below comfortable thresholds, it sounds a gentle chime and presents a 20-second resting countdown ("Look 20 feet away for 20 seconds").
- **Target Audience / Persona**: Knowledge workers, developers, students, and writers who spend 6+ hours daily facing displays and suffer from dry eyes, asthenopia (digital eye strain), or unconscious stare-lock.
- **Key Value**: Preserves ocular tear film stability through proactive blink awareness and habit reinforcement, operating entirely on-device without exposing camera data.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Consent & Activation Flow**:
   - Zero-state hero introduces privacy safeguards (local processing badge, no recordings).
   - User clicks **"Start Monitoring"** $\rightarrow$ browser requests camera permission $\rightarrow$ real-time video stream initializes with face landmark wireframe overlay.
2. **Active Monitoring & Metric Telemetry**:
   - Live video preview renders landmarks around the eyes with dynamic EAR metric gauge (Left EAR, Right EAR, Average EAR).
   - Rolling Blink Rate meter (blinks/min) updates dynamically, categorizing rate into *Nominal (12–20 bpm)*, *Sub-optimal (<12 bpm)*, or *Elevated*.
   - Prolonged Eye Closure detector flags micro-naps or resting states without falsely inflating the blink count.
3. **Screen Session & 20-20-20 Rest Flow**:
   - Screen timer increments only while a face is detected in the frame; if the user steps away for $>30$ seconds, timer automatically pauses.
   - When the 20-minute screen threshold is reached, an unobtrusive alert overlay activates with a calming acoustic chime and a 20-second relaxation timer.
   - The user can **Complete Break** (resets timer), **Snooze (5 min)**, or **Dismiss**.
4. **Desktop Python Project Center**:
   - Dedicated tab displays the full 9-phase Python project architecture (`camera.py`, `detector.py`, `blink_tracker.py`, `timer_manager.py`, `notifier.py`, `settings.py`, `ui_dashboard.py`, and test suites).
   - One-click **"Download Python Project (.zip)"** button exports a complete, self-contained Python project with virtualenv instructions, dependencies, and PyInstaller configuration.

### Visual Identity & Theme
- **Aesthetic Direction**: Utilitarian, calm medical-grade ergonomics. Clean slate surfaces, crisp typography, and restrained ocular indigo accents.
- **Color Palette**:
  - Dominant Neutral: Deep slate/zinc canvas (`#090D16` / `#0F172A`) with subtle cool hairline borders (`border-slate-800`).
  - Structural Surfaces: Elevated panels (`#131D31`) with single-elevation depth.
  - Accent / Focus: Ocular Cyan & Soft Indigo (`#06B6D4` / `#6366F1`) for live iris indicators and active states.
  - Health Status: Emerald (`#10B981`) for nominal blink rate, Amber (`#F59E0B`) for low blink rate warnings, Coral (`#F43F5E`) for break prompts.
- **Typography**: Display headings set in `Plus Jakarta Sans`, scannable body in `DM Sans`, and telemetry counters strictly formatted with tabular numerals (`JetBrains Mono`, `tabular-nums`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual-Eye EAR with Rolling Adaptive Calibration**
  - *Approach*: Continuously compute EAR on both eyes:
    $$\text{EAR} = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2 \cdot \|p_1 - p_4\|}$$
    Calibrate a dynamic baseline per session to accommodate varied eyelid geometry, resting aperture, head pitch, and glasses reflections.
  - *Why*: Fixed thresholds (e.g. static 0.21) cause severe false positives for users with deep-set eyes or glasses. Adaptive baselines ensure accurate blink classification across diverse users.
- **Decision 2: Absence-Aware Inactivity Heuristic**
  - *Approach*: Monitor face presence bounding box. If no face is detected for 30 consecutive seconds, the screen session pauses; if absent for 5 minutes, session automatically resets.
  - *Why*: Prevents users from returning from lunch to find an erroneous 60-minute strain alert.
- **Decision 3: Synthesized Web Audio Chime**
  - *Approach*: Use the browser's native `AudioContext` to generate harmonic crystalline bell chords (root, fifth, octave with smooth exponential decay), eliminating reliance on external MP3 assets that could fail to load.
- **Decision 4: Python Project Export Hub**
  - *Approach*: Include both the fully functional web application AND the production-ready modular Python desktop codebase files inside the project, with live source preview, copyable snippets, and zip packaging.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                               AI EyeCare                               │
│  ┌────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │   Navigation & State   │  │  Privacy Bar & Camera Feed Status    │  │
│  └───────────┬────────────┘  └──────────────────┬───────────────────┘  │
│              │                                  │                      │
│  ┌───────────▼──────────────────────────────────▼───────────────────┐  │
│  │             Client-Side Computer Vision Engine                   │  │
│  │  - MediaPipe FaceMesh / Vision Landmarker Pipeline               │  │
│  │  - 468/478 Landmark Extraction (Left Eye & Right Eye Polygons)  │  │
│  │  - Dual-Eye Aspect Ratio (EAR) Calculator                        │  │
│  │  - Dynamic Baseline Calibrator & Blink State Machine             │  │
│  │  - Absence & Prolonged Eye Closure Detection                     │  │
│  └───────────────────────────┬──────────────────────────────────────┘  │
│                              │                                         │
│  ┌───────────────────────────▼──────────────────────────────────────┐  │
│  │                     Screen & Habit Controller                    │  │
│  │  - Active Screen Session Stopwatch (Absence-Paused)              │  │
│  │  - 20-20-20 Countdown Engine & Snooze Manager                    │  │
│  │  - Web Audio Acoustic Chime Synthesizer                          │  │
│  │  - Session Telemetry & Daily Statistics Store (localStorage)     │  │
│  └───────────────┬──────────────────────────────┬───────────────────┘  │
│                  │                              │                      │
│  ┌───────────────▼──────────────┐  ┌────────────▼───────────────────┐  │
│  │     Interactive Dashboard    │  │   Python Desktop Suite Hub     │  │
│  │  - Live Video & Mesh Canvas  │  │   - Complete 9-Phase Codebase  │  │
│  │  - Real-time Blink & EAR Gauges││   - Pytest Test Suite Runner   │  │
│  │  - Break Modal & Controls    │  │   - One-Click .ZIP Exporter    │  │
│  └──────────────────────────────┘  └────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Local State
```typescript
interface EyeMetrics {
  leftEar: number;
  rightEar: number;
  averageEar: number;
  baselineEar: number;
  isBlinking: boolean;
  isProlongedClosure: boolean;
  blinkCount: number;
  blinkRateBpm: number;
  faceDetected: boolean;
  absenceDurationSec: number;
}

interface ScreenSessionState {
  isActive: boolean;
  elapsedSessionSec: number;
  remainingBreakSec: number;
  isBreakActive: boolean;
  breakCountdownSec: number;
  remindersTriggeredToday: number;
  breaksCompletedToday: number;
}

interface UserSettings {
  breakIntervalMin: number; // default 20
  breakDurationSec: number; // default 20
  lowBlinkRateThreshold: number; // default 12 bpm
  blinkSensitivity: 'low' | 'medium' | 'high';
  soundEnabled: boolean;
  volume: number;
  showMeshOverlay: boolean;
  autoPauseOnAbsence: boolean;
}
```

### Interactive Components Mapping
- `WebcamMonitor`: Handles `navigator.mediaDevices.getUserMedia`, canvas landmark wireframes, frame loop, and video track lifecycle.
- `BlinkTelemetry`: Real-time EAR chart, instantaneous blink counter, and rolling 60s/5m rate gauges.
- `BreakTimerCard`: Circular progress ring displaying countdown to next 20-20-20 rest, pause/resume, and manual break trigger.
- `RestReminderModal`: 20-second breathing & focal relaxation guidance overlay with countdown and soothing audio chime.
- `PythonCodeHub`: Interactive explorer of all modular Python files (`camera.py`, `detector.py`, `blink_tracker.py`, `timer_manager.py`, `notifier.py`, `settings.py`, `ui_dashboard.py`, `tests/test_tracker.py`), test runner simulator, and ZIP downloader.
- `PrivacySettingsModal`: Explains local zero-transmission data policy, with one-click data reset.
