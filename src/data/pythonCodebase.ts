/**
 * Complete Modular Python Desktop Application Codebase
 * Ready for local development, pytest verification, and PyInstaller Windows .exe packaging
 */

import { PythonCodeFile } from '../types';

export const PYTHON_CODEBASE: PythonCodeFile[] = [
  {
    name: 'run.py',
    category: 'core',
    description: 'Main application entry point with background worker threading and safe exit hooks.',
    content: `"""
AI EyeCare - Real-Time Eye Monitoring & Screen Break Assistant
Main Application Entry Point
"""

import sys
import logging
from settings import SettingsManager
from ui_dashboard import EyeCareApp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger("AIEyeCare")

def main():
    """Initialize settings and launch the CustomTkinter desktop interface."""
    logger.info("Initializing AI EyeCare Desktop Assistant...")
    
    # Load and validate settings
    settings_mgr = SettingsManager()
    settings = settings_mgr.load()
    
    # Launch Desktop Application
    app = EyeCareApp(settings_manager=settings_mgr)
    
    try:
        app.mainloop()
    except KeyboardInterrupt:
        logger.info("Received interrupt signal, shutting down...")
    finally:
        logger.info("AI EyeCare terminated safely.")

if __name__ == "__main__":
    main()
`,
  },
  {
    name: 'camera.py',
    category: 'core',
    description: 'Thread-safe OpenCV webcam capture with background thread loop and safe device release.',
    content: `"""
Camera Module: Thread-safe OpenCV video capture
Runs in a background thread to prevent GUI freezing.
"""

import cv2
import threading
import time
import logging

logger = logging.getLogger(__name__)

class CameraCapture:
    """Manages webcam capture in a dedicated background worker thread."""
    
    def __init__(self, camera_index=0, width=640, height=480):
        self.camera_index = camera_index
        self.width = width
        self.height = height
        
        self.cap = None
        self.running = False
        self.thread = None
        self.lock = threading.Lock()
        
        self.current_frame = None
        self.is_opened = False
        self.fps = 0.0
        self._last_frame_time = time.time()
        
    def start(self) -> bool:
        """Open the camera and spawn background reader thread."""
        with self.lock:
            if self.running:
                return True
                
            logger.info(f"Connecting to webcam device index {self.camera_index}...")
            self.cap = cv2.VideoCapture(self.camera_index)
            
            if not self.cap.isOpened():
                logger.error(f"Could not open camera with index {self.camera_index}.")
                self.is_opened = False
                return False
                
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            
            self.is_opened = True
            self.running = True
            self.thread = threading.Thread(target=self._capture_loop, daemon=True)
            self.thread.start()
            logger.info("Webcam background thread successfully started.")
            return True

    def _capture_loop(self):
        """Continuously grab frames from webcam safely."""
        frame_count = 0
        fps_timer = time.time()
        
        while self.running:
            if not self.cap or not self.cap.isOpened():
                time.sleep(0.05)
                continue
                
            ret, frame = self.cap.read()
            if ret and frame is not None:
                # Mirror frame for intuitive user feedback
                frame = cv2.flip(frame, 1)
                
                with self.lock:
                    self.current_frame = frame
                    
                frame_count += 1
                now = time.time()
                if now - fps_timer >= 1.0:
                    self.fps = frame_count / (now - fps_timer)
                    frame_count = 0
                    fps_timer = now
            else:
                time.sleep(0.01)

    def get_frame(self):
        """Thread-safe retrieval of the most recent frame."""
        with self.lock:
            if self.current_frame is not None:
                return self.current_frame.copy()
            return None

    def stop(self):
        """Safely release the camera and terminate background thread."""
        logger.info("Releasing camera hardware...")
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)
            
        with self.lock:
            if self.cap and self.cap.isOpened():
                self.cap.release()
            self.cap = None
            self.current_frame = None
            self.is_opened = False
        logger.info("Camera successfully released.")
`,
  },
  {
    name: 'detector.py',
    category: 'core',
    description: 'MediaPipe FaceMesh / Face Landmarker wrapper for extracting 468 facial landmark coordinates.',
    content: `"""
Detector Module: MediaPipe Face Landmark Detection
Extracts canonical left and right eye coordinates from camera frames.
"""

import cv2
import mediapipe as mp
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Canonical MediaPipe FaceMesh eye landmark indices
LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]

class FaceDetector:
    """Wraps MediaPipe FaceMesh to extract eye landmarks efficiently."""
    
    def __init__(self, max_num_faces=1, min_detection_confidence=0.5, min_tracking_confidence=0.5):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=max_num_faces,
            refine_landmarks=True,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        
    def process(self, frame_bgr: np.ndarray):
        """
        Process a BGR frame and return left eye landmarks, right eye landmarks,
        and face presence flag.
        """
        if frame_bgr is None:
            return None, None, False
            
        # Convert BGR to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        rgb_frame.flags.writeable = False
        results = self.face_mesh.process(rgb_frame)
        
        if not results.multi_face_landmarks:
            return None, None, False
            
        face_landmarks = results.multi_face_landmarks[0]
        h, w, _ = frame_bgr.shape
        
        # Extract pixel coordinates
        left_eye = []
        for idx in LEFT_EYE_INDICES:
            lm = face_landmarks.landmark[idx]
            left_eye.append(np.array([lm.x * w, lm.y * h], dtype=np.float32))
            
        right_eye = []
        for idx in RIGHT_EYE_INDICES:
            lm = face_landmarks.landmark[idx]
            right_eye.append(np.array([lm.x * w, lm.y * h], dtype=np.float32))
            
        return left_eye, right_eye, True

    def close(self):
        """Release MediaPipe resources."""
        if self.face_mesh:
            self.face_mesh.close()
`,
  },
  {
    name: 'blink_tracker.py',
    category: 'core',
    description: 'Dual-Eye Aspect Ratio (EAR) calculator, adaptive thresholding, blink counter, and prolonged eye closure detector.',
    content: `"""
Blink Tracker Module:
Dual-eye EAR computation, rolling baseline calibration,
blink state machine, and prolonged closure detection.
"""

import numpy as np
import time
from collections import deque
from typing import List, Dict, Any, Optional

def compute_ear(eye_points: List[np.ndarray]) -> float:
    """
    Compute Eye Aspect Ratio (EAR) given 6 landmark coordinates:
    EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
    """
    if eye_points is None or len(eye_points) < 6:
        return 0.0
        
    p1, p2, p3, p4, p5, p6 = eye_points
    
    vertical_1 = np.linalg.norm(p2 - p6)
    vertical_2 = np.linalg.norm(p3 - p5)
    horizontal = np.linalg.norm(p1 - p4)
    
    if horizontal <= 1e-6:
        return 0.0
        
    ear = (vertical_1 + vertical_2) / (2.0 * horizontal)
    return float(ear)


class BlinkTracker:
    """
    State machine that processes EAR frame-by-frame.
    Applies adaptive baseline calibration and filters micro-naps.
    """
    
    def __init__(self, sensitivity: str = "medium"):
        self.sensitivity = sensitivity
        self.baseline_buffer = deque(maxlen=90) # ~3s at 30 FPS
        self.current_baseline = 0.28
        
        self.is_eye_closed = False
        self.closure_start_time: Optional[float] = None
        self.prolonged_threshold_sec = 1.2 # Micro-sleep / extended closure
        
        self.total_blinks = 0
        self.blink_timestamps = deque()
        self.last_blink_time = 0.0
        self.start_time = time.time()
        
    def reset(self):
        """Reset counters and baseline buffer."""
        self.baseline_buffer.clear()
        self.current_baseline = 0.28
        self.is_eye_closed = False
        self.closure_start_time = None
        self.total_blinks = 0
        self.blink_timestamps.clear()
        self.last_blink_time = 0.0
        self.start_time = time.time()

    def get_sensitivity_multiplier(self) -> float:
        """Returns the EAR threshold multiplier based on sensitivity setting."""
        mapping = {
            "low": 0.70,     # Requires deeper closure
            "medium": 0.76,  # Balanced
            "high": 0.82     # Sensitive to partial blinks
        }
        return mapping.get(self.sensitivity, 0.76)

    @property
    def dynamic_threshold(self) -> float:
        """Adaptive eye closure threshold calculated from open-eye baseline."""
        return self.current_baseline * self.get_sensitivity_multiplier()

    def update(self, left_eye: Optional[List[np.ndarray]], right_eye: Optional[List[np.ndarray]], now: Optional[float] = None) -> Dict[str, Any]:
        """
        Process a single video frame. Returns tracking metrics dictionary.
        """
        if now is None:
            now = time.time()
            
        left_ear = compute_ear(left_eye) if left_eye else 0.0
        right_ear = compute_ear(right_eye) if right_eye else 0.0
        
        # Average EAR across both eyes
        if left_ear > 0.0 and right_ear > 0.0:
            avg_ear = (left_ear + right_ear) / 2.0
        elif left_ear > 0.0:
            avg_ear = left_ear
        elif right_ear > 0.0:
            avg_ear = right_ear
        else:
            avg_ear = 0.0
            
        threshold = self.dynamic_threshold
        blink_detected = False
        prolonged_closure = False
        closure_duration = 0.0
        
        if avg_ear > 0.0:
            if avg_ear < threshold:
                # Eye is currently closed
                if not self.is_eye_closed:
                    self.is_eye_closed = True
                    self.closure_start_time = now
                else:
                    closure_duration = now - (self.closure_start_time or now)
                    if closure_duration >= self.prolonged_threshold_sec:
                        prolonged_closure = True
            else:
                # Eye is currently open
                if self.is_eye_closed and self.closure_start_time is not None:
                    duration = now - self.closure_start_time
                    # Normal blink duration: 0.06s to 0.45s
                    if 0.06 <= duration <= 0.45:
                        if now - self.last_blink_time > 0.16:
                            self.total_blinks += 1
                            self.blink_timestamps.append(now)
                            self.last_blink_time = now
                            blink_detected = True
                            
                    self.is_eye_closed = False
                    self.closure_start_time = None
                    
                # Update adaptive baseline when eyes are comfortably open
                if 0.16 < avg_ear < 0.48:
                    self.baseline_buffer.append(avg_ear)
                    if len(self.baseline_buffer) >= 15:
                        # Take upper 60% of open-eye samples to avoid transition contamination
                        sorted_samples = sorted(list(self.baseline_buffer))
                        slice_idx = int(len(sorted_samples) * 0.4)
                        self.current_baseline = float(np.mean(sorted_samples[slice_idx:]))

        # Purge timestamps older than 60 seconds
        cutoff = now - 60.0
        while self.blink_timestamps and self.blink_timestamps[0] < cutoff:
            self.blink_timestamps.popleft()
            
        # Calculate rolling Blink Rate (blinks per minute)
        elapsed = now - self.start_time
        if elapsed < 30.0:
            bpm = int(round((self.total_blinks / max(elapsed, 5.0)) * 60.0))
        else:
            bpm = len(self.blink_timestamps)

        return {
            "left_ear": round(left_ear, 3),
            "right_ear": round(right_ear, 3),
            "average_ear": round(avg_ear, 3),
            "baseline_ear": round(self.current_baseline, 3),
            "threshold": round(threshold, 3),
            "blink_detected": blink_detected,
            "prolonged_closure": prolonged_closure,
            "closure_duration": round(closure_duration, 2),
            "total_blinks": self.total_blinks,
            "blink_rate_bpm": bpm
        }
`,
  },
  {
    name: 'timer_manager.py',
    category: 'core',
    description: 'Screen session timer, 20-20-20 countdown controller, absence-aware pause, and snooze logic.',
    content: `"""
Timer Manager Module:
Tracks continuous screen session duration, manages 20-20-20 break intervals,
pauses automatically on webcam absence, and handles snooze actions.
"""

import time
from typing import Dict, Any, Optional

class SessionTimerManager:
    """Manages active screen focus duration and 20-20-20 break countdowns."""
    
    def __init__(self, break_interval_min: int = 20, break_duration_sec: int = 20, absence_threshold_sec: int = 30):
        self.break_interval_min = break_interval_min
        self.break_duration_sec = break_duration_sec
        self.absence_threshold_sec = absence_threshold_sec
        
        self.is_monitoring = False
        self.is_paused = False
        self.session_active_seconds = 0.0
        self.last_tick_time = time.time()
        
        self.is_break_active = False
        self.break_countdown_sec = 0.0
        
        # Absence tracking
        self.last_face_seen_time = time.time()
        self.absence_detected = False
        
        # Statistics
        self.breaks_triggered_today = 0
        self.breaks_completed_today = 0
        self.breaks_snoozed_today = 0

    def start(self):
        """Start or resume screen monitoring."""
        self.is_monitoring = True
        self.is_paused = False
        self.last_tick_time = time.time()
        self.last_face_seen_time = time.time()

    def pause(self):
        """Manually pause the screen session timer."""
        self.is_paused = True

    def resume(self):
        """Resume screen session timer."""
        self.is_paused = False
        self.last_tick_time = time.time()
        self.last_face_seen_time = time.time()

    def update(self, face_detected: bool, now: Optional[float] = None) -> Dict[str, Any]:
        """
        Advance timer state based on face presence.
        Returns dictionary with session status and break flags.
        """
        if now is None:
            now = time.time()
            
        dt = now - self.last_tick_time
        self.last_tick_time = now
        
        trigger_break_alert = False
        
        if not self.is_monitoring or self.is_paused:
            return self._build_status(trigger_break_alert)
            
        # Manage active break countdown
        if self.is_break_active:
            self.break_countdown_sec = max(0.0, self.break_countdown_sec - dt)
            if self.break_countdown_sec <= 0.0:
                self.complete_break()
            return self._build_status(trigger_break_alert)
            
        # Absence detection heuristic
        if face_detected:
            self.last_face_seen_time = now
            self.absence_detected = False
            # Accumulate active screen time only when face is present
            self.session_active_seconds += dt
        else:
            time_since_face = now - self.last_face_seen_time
            if time_since_face >= self.absence_threshold_sec:
                self.absence_detected = True
                # Pause accumulation while user is absent
                
        # Check if screen interval reached
        target_seconds = self.break_interval_min * 60
        if self.session_active_seconds >= target_seconds:
            self.is_break_active = True
            self.break_countdown_sec = float(self.break_duration_sec)
            self.breaks_triggered_today += 1
            trigger_break_alert = True
            
        return self._build_status(trigger_break_alert)

    def complete_break(self):
        """User finishes or timer completes the 20-second break."""
        self.is_break_active = False
        self.break_countdown_sec = 0.0
        self.session_active_seconds = 0.0
        self.breaks_completed_today += 1
        self.last_tick_time = time.time()

    def snooze(self, snooze_minutes: int = 5):
        """Snooze break alert by postponing interval."""
        self.is_break_active = False
        self.break_countdown_sec = 0.0
        # Postpone target: subtract 5 mins from threshold
        target_seconds = self.break_interval_min * 60
        self.session_active_seconds = max(0.0, target_seconds - (snooze_minutes * 60))
        self.breaks_snoozed_today += 1
        self.last_tick_time = time.time()

    def dismiss(self):
        """Dismiss current break reminder and reset interval."""
        self.is_break_active = False
        self.break_countdown_sec = 0.0
        self.session_active_seconds = 0.0
        self.last_tick_time = time.time()

    def _build_status(self, trigger_break_alert: bool) -> Dict[str, Any]:
        target_seconds = self.break_interval_min * 60
        remaining_sec = max(0.0, target_seconds - self.session_active_seconds)
        
        return {
            "is_monitoring": self.is_monitoring,
            "is_paused": self.is_paused,
            "session_active_sec": int(self.session_active_seconds),
            "remaining_sec": int(remaining_sec),
            "is_break_active": self.is_break_active,
            "break_countdown_sec": int(self.break_countdown_sec),
            "absence_detected": self.absence_detected,
            "trigger_break_alert": trigger_break_alert,
            "breaks_triggered_today": self.breaks_triggered_today,
            "breaks_completed_today": self.breaks_completed_today,
            "breaks_snoozed_today": self.breaks_snoozed_today
        }
`,
  },
  {
    name: 'notifier.py',
    category: 'core',
    description: 'Cross-platform desktop notifications (Plyer/Windows Toast) and gentle acoustic chime sound generation.',
    content: `"""
Notifier Module:
Delivers desktop notifications and acoustic sound cues for screen breaks.
Uses winsound on Windows or cross-platform fallback tones.
"""

import sys
import threading
import logging

logger = logging.getLogger(__name__)

class AlertNotifier:
    """Delivers visual desktop notifications and calming audio chimes."""
    
    def __init__(self, sound_enabled: bool = True):
        self.sound_enabled = sound_enabled
        
    def notify_break(self, title: str = "AI EyeCare — Screen Break", message: str = "Time for the 20-20-20 rule! Look 20 feet away for 20 seconds."):
        """Trigger desktop notification and gentle chime."""
        threading.Thread(target=self._send_desktop_notification, args=(title, message), daemon=True).start()
        if self.sound_enabled:
            threading.Thread(target=self.play_chime, daemon=True).start()

    def notify_low_blink(self, bpm: int):
        """Gentle reminder when blink rate drops below comfortable threshold."""
        title = "AI EyeCare — Blink Reminder"
        message = f"Estimated blink rate is {bpm} blinks/min. Remember to blink gently to keep eyes lubricated."
        threading.Thread(target=self._send_desktop_notification, args=(title, message), daemon=True).start()
        if self.sound_enabled:
            threading.Thread(target=self.play_soft_ping, daemon=True).start()

    def _send_desktop_notification(self, title: str, message: str):
        """Invoke plyer notification if installed, otherwise log gracefully."""
        try:
            from plyer import notification
            notification.notify(
                title=title,
                message=message,
                app_name="AI EyeCare",
                timeout=8
            )
        except Exception as e:
            logger.info(f"[Desktop Notification] {title}: {message} ({e})")

    def play_chime(self):
        """Play a calming 3-note harmonic chime sequence."""
        if not self.sound_enabled:
            return
            
        if sys.platform == "win32":
            try:
                import winsound
                # C5 (523Hz), E5 (659Hz), G5 (784Hz) harmonic triad
                winsound.Beep(523, 200)
                winsound.Beep(659, 200)
                winsound.Beep(784, 400)
                return
            except Exception as e:
                logger.debug(f"winsound failed: {e}")
                
        # Terminal bell fallback
        print("\\a", end="", flush=True)

    def play_soft_ping(self):
        """Play a single subtle reminder tone."""
        if not self.sound_enabled:
            return
            
        if sys.platform == "win32":
            try:
                import winsound
                winsound.Beep(587, 180) # D5
                return
            except Exception:
                pass
                
        print("\\a", end="", flush=True)
`,
  },
  {
    name: 'settings.py',
    category: 'config',
    description: 'Persistent JSON configuration manager with input sanitization and default fallbacks.',
    content: `"""
Settings Module:
Manages persistent JSON configuration with validation and safe defaults.
"""

import os
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

DEFAULT_CONFIG: Dict[str, Any] = {
    "break_interval_min": 20,
    "break_duration_sec": 20,
    "low_blink_rate_threshold": 12,
    "blink_sensitivity": "medium",
    "sound_enabled": True,
    "show_mesh_overlay": True,
    "auto_pause_on_absence": True,
    "absence_threshold_sec": 30
}

class SettingsManager:
    """Loads, validates, and persists user settings in a local JSON file."""
    
    def __init__(self, filepath: str = "eyecare_settings.json"):
        self.filepath = filepath
        self.config = DEFAULT_CONFIG.copy()
        
    def load(self) -> Dict[str, Any]:
        """Load configuration from disk with schema fallback."""
        if not os.path.exists(self.filepath):
            self.save(DEFAULT_CONFIG)
            return self.config
            
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.config = {**DEFAULT_CONFIG, **data}
        except Exception as e:
            logger.warning(f"Failed to load settings file, using defaults: {e}")
            self.config = DEFAULT_CONFIG.copy()
            
        return self.config

    def save(self, updated_config: Dict[str, Any]) -> bool:
        """Validate and write updated settings to disk."""
        # Input validation
        self.config["break_interval_min"] = max(5, min(120, int(updated_config.get("break_interval_min", 20))))
        self.config["break_duration_sec"] = max(10, min(60, int(updated_config.get("break_duration_sec", 20))))
        self.config["low_blink_rate_threshold"] = max(5, min(30, int(updated_config.get("low_blink_rate_threshold", 12))))
        
        sensitivity = str(updated_config.get("blink_sensitivity", "medium")).lower()
        self.config["blink_sensitivity"] = sensitivity if sensitivity in ["low", "medium", "high"] else "medium"
        
        self.config["sound_enabled"] = bool(updated_config.get("sound_enabled", True))
        self.config["show_mesh_overlay"] = bool(updated_config.get("show_mesh_overlay", True))
        self.config["auto_pause_on_absence"] = bool(updated_config.get("auto_pause_on_absence", True))
        self.config["absence_threshold_sec"] = max(10, min(300, int(updated_config.get("absence_threshold_sec", 30))))

        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=4)
            return True
        except Exception as e:
            logger.error(f"Failed to save settings: {e}")
            return False
`,
  },
  {
    name: 'ui_dashboard.py',
    category: 'ui',
    description: 'CustomTkinter modern desktop UI with live OpenCV camera canvas, telemetry meters, and rest countdown modal.',
    content: `"""
UI Dashboard Module:
Modern dark desktop interface built with CustomTkinter.
Displays live webcam feed, blink metrics, 20-20-20 rest countdown, and settings.
"""

import cv2
import time
from PIL import Image, ImageTk
import customtkinter as ctk

from camera import CameraCapture
from detector import FaceDetector
from blink_tracker import BlinkTracker
from timer_manager import SessionTimerManager
from notifier import AlertNotifier
from settings import SettingsManager

ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

class EyeCareApp(ctk.CTk):
    """Main desktop window for AI EyeCare."""
    
    def __init__(self, settings_manager: SettingsManager):
        super().__init__()
        self.settings_manager = settings_manager
        self.settings = self.settings_manager.load()
        
        self.title("AI EyeCare — Real-Time Eye Monitoring & Screen Break Assistant")
        self.geometry("1100x720")
        self.minsize(980, 640)
        
        # Modules
        self.camera = CameraCapture(camera_index=0, width=640, height=480)
        self.detector = FaceDetector()
        self.tracker = BlinkTracker(sensitivity=self.settings.get("blink_sensitivity", "medium"))
        self.timer_mgr = SessionTimerManager(
            break_interval_min=self.settings.get("break_interval_min", 20),
            break_duration_sec=self.settings.get("break_duration_sec", 20)
        )
        self.notifier = AlertNotifier(sound_enabled=self.settings.get("sound_enabled", True))
        
        self.is_monitoring = False
        self._build_ui()
        self.protocol("WM_DELETE_WINDOW", self.on_close)
        
    def _build_ui(self):
        """Construct the layout with top bar, video area, and stats sidebar."""
        self.grid_columnconfigure(0, weight=3)
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(1, weight=1)
        
        # Top Header Bar
        header = ctk.CTkFrame(self, height=60, corner_radius=0)
        header.grid(row=0, column=0, columnspan=2, sticky="ew", padx=16, pady=(12, 6))
        
        title_lbl = ctk.CTkLabel(header, text="AI EyeCare", font=ctk.CTkFont(size=20, weight="bold"))
        title_lbl.pack(side="left", padx=16)
        
        sub_lbl = ctk.CTkLabel(header, text="Privacy-Focused Desktop Screen Assistant · 100% Local CV", text_color="gray")
        sub_lbl.pack(side="left", padx=8)
        
        self.status_badge = ctk.CTkLabel(header, text="IDLE", fg_color="#334155", corner_radius=6, padx=12, pady=4)
        self.status_badge.pack(side="right", padx=16)
        
        # Main Video Preview Area
        video_frame = ctk.CTkFrame(self, corner_radius=10)
        video_frame.grid(row=1, column=0, sticky="nsew", padx=(16, 8), pady=8)
        
        self.video_canvas = ctk.CTkLabel(video_frame, text="Camera Offline\\nClick 'Start Monitoring' below")
        self.video_canvas.pack(fill="both", expand=True, padx=8, pady=8)
        
        # Bottom Controls
        controls = ctk.CTkFrame(self, height=50)
        controls.grid(row=2, column=0, sticky="ew", padx=(16, 8), pady=(4, 16))
        
        self.btn_start = ctk.CTkButton(controls, text="Start Monitoring", command=self.toggle_monitoring, fg_color="#4F46E5", hover_color="#4338CA")
        self.btn_start.pack(side="left", padx=12, pady=8)
        
        self.btn_break_now = ctk.CTkButton(controls, text="Take Break Now (20s)", command=self.manual_break, fg_color="#0D9488", hover_color="#0F766E")
        self.btn_break_now.pack(side="left", padx=6, pady=8)

        # Right Telemetry Sidebar
        sidebar = ctk.CTkFrame(self, corner_radius=10)
        sidebar.grid(row=1, column=1, rowspan=2, sticky="nsew", padx=(8, 16), pady=(8, 16))
        
        ctk.CTkLabel(sidebar, text="Live Telemetry", font=ctk.CTkFont(size=16, weight="bold")).pack(anchor="w", padx=16, pady=(16, 8))
        
        # Blink Rate Dial
        self.card_bpm = ctk.CTkFrame(sidebar)
        self.card_bpm.pack(fill="x", padx=12, pady=6)
        ctk.CTkLabel(self.card_bpm, text="ESTIMATED BLINK RATE").pack(anchor="w", padx=12, pady=(8, 2))
        self.lbl_bpm = ctk.CTkLabel(self.card_bpm, text="0 BPM", font=ctk.CTkFont(size=24, weight="bold"))
        self.lbl_bpm.pack(anchor="w", padx=12, pady=(0, 4))
        self.lbl_bpm_status = ctk.CTkLabel(self.card_bpm, text="Nominal (12-20 bpm)", text_color="#10B981")
        self.lbl_bpm_status.pack(anchor="w", padx=12, pady=(0, 8))
        
        # EAR Metrics Card
        self.card_ear = ctk.CTkFrame(sidebar)
        self.card_ear.pack(fill="x", padx=12, pady=6)
        ctk.CTkLabel(self.card_ear, text="EYE ASPECT RATIO (EAR)").pack(anchor="w", padx=12, pady=(8, 2))
        self.lbl_ear = ctk.CTkLabel(self.card_ear, text="0.000", font=ctk.CTkFont(size=20, weight="bold"))
        self.lbl_ear.pack(anchor="w", padx=12, pady=(0, 8))

        # Screen Session & Next Break
        self.card_timer = ctk.CTkFrame(sidebar)
        self.card_timer.pack(fill="x", padx=12, pady=6)
        ctk.CTkLabel(self.card_timer, text="NEXT 20-20-20 BREAK").pack(anchor="w", padx=12, pady=(8, 2))
        self.lbl_countdown = ctk.CTkLabel(self.card_timer, text="20:00", font=ctk.CTkFont(size=24, weight="bold"), text_color="#38BDF8")
        self.lbl_countdown.pack(anchor="w", padx=12, pady=(0, 8))
        
        # Medical Disclaimer Footnote
        disclaimer = ctk.CTkLabel(
            sidebar, 
            text="*AI EyeCare estimates blink activity to encourage wellness habits. Not a medical diagnostic tool.",
            wraplength=220,
            font=ctk.CTkFont(size=11),
            text_color="gray"
        )
        disclaimer.pack(side="bottom", padx=12, pady=16)

    def toggle_monitoring(self):
        """Toggle camera monitoring on and off."""
        if not self.is_monitoring:
            if self.camera.start():
                self.is_monitoring = True
                self.btn_start.configure(text="Stop Monitoring", fg_color="#DC2626", hover_color="#B91C1C")
                self.status_badge.configure(text="ACTIVE", fg_color="#10B981")
                self.timer_mgr.start()
                self._update_loop()
        else:
            self.is_monitoring = False
            self.camera.stop()
            self.timer_mgr.pause()
            self.btn_start.configure(text="Start Monitoring", fg_color="#4F46E5", hover_color="#4338CA")
            self.status_badge.configure(text="STOPPED", fg_color="#334155")
            self.video_canvas.configure(image="", text="Camera Released")

    def manual_break(self):
        """Trigger an instant 20-second rest break."""
        self.timer_mgr.session_active_seconds = self.timer_mgr.break_interval_min * 60

    def _update_loop(self):
        """Main UI update loop running at ~30 FPS."""
        if not self.is_monitoring:
            return
            
        frame = self.camera.get_frame()
        if frame is not None:
            left_eye, right_eye, face_detected = self.detector.process(frame)
            
            # Update blink tracker
            metrics = self.tracker.update(left_eye, right_eye)
            
            # Update session timers
            timer_status = self.timer_mgr.update(face_detected)
            
            # Handle alert trigger
            if timer_status["trigger_break_alert"]:
                self.notifier.notify_break()
                
            # Draw eye landmarks on frame if enabled
            if self.settings.get("show_mesh_overlay", True) and face_detected:
                if left_eye:
                    pts = np.array(left_eye, np.int32).reshape((-1, 1, 2))
                    cv2.polylines(frame, [pts], True, (0, 255, 255), 1)
                if right_eye:
                    pts = np.array(right_eye, np.int32).reshape((-1, 1, 2))
                    cv2.polylines(frame, [pts], True, (0, 255, 255), 1)
                    
            # Render frame to Tkinter Label
            img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img_pil = Image.fromarray(img_rgb)
            img_pil = img_pil.resize((640, 480))
            img_tk = ImageTk.PhotoImage(image=img_pil)
            self.video_canvas.configure(image=img_tk, text="")
            self.video_canvas.image = img_tk
            
            # Update metric widgets
            self.lbl_bpm.configure(text=f"{metrics['blink_rate_bpm']} BPM")
            self.lbl_ear.configure(text=f"{metrics['average_ear']} (Thresh: {metrics['threshold']})")
            
            rem_sec = timer_status["remaining_sec"]
            mins, secs = divmod(rem_sec, 60)
            self.lbl_countdown.configure(text=f"{mins:02d}:{secs:02d}")
            
        self.after(33, self._update_loop)

    def on_close(self):
        """Clean shutdown hook."""
        self.is_monitoring = False
        self.camera.stop()
        self.detector.close()
        self.destroy()
`,
  },
  {
    name: 'tests/test_blink_tracker.py',
    category: 'tests',
    description: 'Pytest test suite verifying EAR calculation, blink counting, adaptive thresholding, and micro-nap discrimination.',
    content: `"""
Unit tests for BlinkTracker module
Runs headless with synthetic landmark coordinates (no webcam hardware required).
"""

import pytest
import numpy as np
from blink_tracker import compute_ear, BlinkTracker

def test_compute_ear_open_eye():
    """Verify EAR calculation on representative open eye coordinates."""
    # Canonical 6 landmarks for open eye
    p1 = np.array([10.0, 50.0]) # outer
    p2 = np.array([25.0, 35.0]) # top 1
    p3 = np.array([40.0, 35.0]) # top 2
    p4 = np.array([55.0, 50.0]) # inner
    p5 = np.array([40.0, 65.0]) # bottom 2
    p6 = np.array([25.0, 65.0]) # bottom 1
    
    ear = compute_ear([p1, p2, p3, p4, p5, p6])
    assert ear > 0.25, f"Open eye EAR should be above 0.25, got {ear}"

def test_compute_ear_closed_eye():
    """Verify EAR calculation drops significantly when eye lids meet."""
    # Canonical landmarks when eyelids are closed
    p1 = np.array([10.0, 50.0])
    p2 = np.array([25.0, 49.0])
    p3 = np.array([40.0, 49.0])
    p4 = np.array([55.0, 50.0])
    p5 = np.array([40.0, 51.0])
    p6 = np.array([25.0, 51.0])
    
    ear = compute_ear([p1, p2, p3, p4, p5, p6])
    assert ear < 0.15, f"Closed eye EAR should be below 0.15, got {ear}"

def test_blink_counting_state_machine():
    """Verify a complete open -> close -> open sequence increments blink counter."""
    tracker = BlinkTracker(sensitivity="medium")
    now = 1000.0
    
    # Establish baseline open eye
    open_pts = [
        np.array([10.0, 50.0]), np.array([25.0, 38.0]), np.array([40.0, 38.0]),
        np.array([55.0, 50.0]), np.array([40.0, 62.0]), np.array([25.0, 62.0])
    ]
    for _ in range(20):
        tracker.update(open_pts, open_pts, now=now)
        now += 0.033
        
    initial_blinks = tracker.total_blinks
    
    # Simulate a 120ms eye blink closure
    closed_pts = [
        np.array([10.0, 50.0]), np.array([25.0, 49.5]), np.array([40.0, 49.5]),
        np.array([55.0, 50.0]), np.array([40.0, 50.5]), np.array([25.0, 50.5])
    ]
    
    # Frame 1: Closed
    tracker.update(closed_pts, closed_pts, now=now)
    now += 0.05
    # Frame 2: Closed
    tracker.update(closed_pts, closed_pts, now=now)
    now += 0.05
    # Frame 3: Re-open
    tracker.update(open_pts, open_pts, now=now)
    
    assert tracker.total_blinks == initial_blinks + 1, "Blink counter should increment by exactly 1"

def test_prolonged_closure_does_not_count_as_blink():
    """Prolonged eye closure (>1.2s) should trigger fatigue flag, not count as standard blink."""
    tracker = BlinkTracker(sensitivity="medium")
    now = 1000.0
    
    open_pts = [
        np.array([10.0, 50.0]), np.array([25.0, 38.0]), np.array([40.0, 38.0]),
        np.array([55.0, 50.0]), np.array([40.0, 62.0]), np.array([25.0, 62.0])
    ]
    closed_pts = [
        np.array([10.0, 50.0]), np.array([25.0, 49.5]), np.array([40.0, 49.5]),
        np.array([55.0, 50.0]), np.array([40.0, 50.5]), np.array([25.0, 50.5])
    ]
    
    # Baseline
    for _ in range(15):
        tracker.update(open_pts, open_pts, now=now)
        now += 0.033
        
    start_blinks = tracker.total_blinks
    
    # Hold eyes closed for 2.0 seconds
    res = tracker.update(closed_pts, closed_pts, now=now)
    now += 2.0
    res = tracker.update(closed_pts, closed_pts, now=now)
    assert res["prolonged_closure"] is True
    
    # Open eyes
    now += 0.05
    tracker.update(open_pts, open_pts, now=now)
    assert tracker.total_blinks == start_blinks, "Prolonged closure must not increment blink counter"
`,
  },
  {
    name: 'tests/test_timer_manager.py',
    category: 'tests',
    description: 'Pytest test suite verifying screen session duration accumulation, absence pause, snooze, and break resets.',
    content: `"""
Unit tests for SessionTimerManager module
Verifies 20-20-20 interval tracking, absence pause heuristic, and snooze/dismiss actions.
"""

import pytest
from timer_manager import SessionTimerManager

def test_session_increments_when_face_detected():
    """Screen session seconds must increment when face is continuously detected."""
    mgr = SessionTimerManager(break_interval_min=20)
    mgr.start()
    
    now = 100.0
    mgr.update(face_detected=True, now=now)
    
    # Advance time by 10 seconds with face present
    now += 10.0
    status = mgr.update(face_detected=True, now=now)
    
    assert status["session_active_sec"] == 10
    assert status["remaining_sec"] == (20 * 60) - 10

def test_absence_pauses_screen_session():
    """When user is absent for >30s, screen session accumulator should pause."""
    mgr = SessionTimerManager(break_interval_min=20, absence_threshold_sec=30)
    mgr.start()
    
    now = 100.0
    mgr.update(face_detected=True, now=now)
    
    # User present for 15 seconds
    now += 15.0
    mgr.update(face_detected=True, now=now)
    
    # User leaves desk for 60 seconds
    now += 35.0
    status = mgr.update(face_detected=False, now=now)
    assert status["absence_detected"] is True
    
    # Advance another 30 seconds while absent
    now += 30.0
    status2 = mgr.update(face_detected=False, now=now)
    # Session time should not have accumulated during absence
    assert status2["session_active_sec"] == 15

def test_break_trigger_and_completion():
    """When session reaches configured interval, break alert activates and completes."""
    mgr = SessionTimerManager(break_interval_min=20, break_duration_sec=20)
    mgr.start()
    
    # Fast forward session to 20 minutes
    mgr.session_active_seconds = 20 * 60
    status = mgr.update(face_detected=True)
    
    assert status["is_break_active"] is True
    assert status["trigger_break_alert"] is True
    
    # Complete break
    mgr.complete_break()
    assert mgr.is_break_active is False
    assert mgr.session_active_seconds == 0.0
    assert mgr.breaks_completed_today == 1

def test_snooze_postpones_break():
    """Snoozing sets remaining time to snooze duration."""
    mgr = SessionTimerManager(break_interval_min=20)
    mgr.start()
    mgr.session_active_seconds = 20 * 60
    mgr.update(face_detected=True)
    
    # Snooze for 5 minutes
    mgr.snooze(snooze_minutes=5)
    assert mgr.is_break_active is False
    assert mgr.session_active_seconds == (15 * 60)
    assert mgr.breaks_snoozed_today == 1
`,
  },
  {
    name: 'requirements.txt',
    category: 'config',
    description: 'Python package dependencies with pinned versions compatible with Python 3.10 and 3.11.',
    content: `opencv-python>=4.8.0.76
mediapipe>=0.10.9
numpy>=1.24.0,<2.0.0
customtkinter>=5.2.0
pillow>=10.0.0
plyer>=2.1.0
pytest>=7.4.0
`,
  },
  {
    name: 'build_windows_exe.bat',
    category: 'config',
    description: 'Automated batch script to compile AI EyeCare into a standalone Windows .exe using PyInstaller.',
    content: `@echo off
echo ========================================================
echo   AI EyeCare - Windows Executable Packaging Script
echo ========================================================
echo.

REM 1. Activate virtual environment
if exist .venv\\Scripts\\activate (
    echo Activating virtual environment...
    call .venv\\Scripts\\activate
)

REM 2. Install PyInstaller
echo Installing PyInstaller...
pip install pyinstaller

REM 3. Compile standalone application
echo Compiling AI EyeCare into single-file Windows executable...
pyinstaller --noconfirm --onedir --windowed ^
    --add-data "eyecare_settings.json;." ^
    --name "AIEyeCare" ^
    --collect-all mediapipe ^
    --collect-all customtkinter ^
    run.py

echo.
echo ========================================================
echo Build complete! Executable located in: dist\\AIEyeCare\\AIEyeCare.exe
echo ========================================================
pause
`,
  },
  {
    name: 'README.md',
    category: 'docs',
    description: 'Comprehensive setup instructions, architecture breakdown, test guide, and privacy notice.',
    content: `# AI EyeCare — Real-Time Eye Monitoring & Screen Break Assistant

AI EyeCare is a privacy-first desktop application that monitors blinking activity via laptop webcam to detect prolonged screen strain and reinforce healthy eye habits using the clinical 20-20-20 rule.

---

## 1. Quick Start

### Prerequisites
- Python 3.10 or 3.11 (Python 3.12+ may have MediaPipe wheel limitations)
- Standard laptop webcam

### Installation Steps

1. **Clone or Extract Project**:
   \`\`\`bash
   cd ai-eyecare
   \`\`\`

2. **Create and Activate Virtual Environment**:
   \`\`\`bash
   # Windows
   python -m venv .venv
   .venv\\Scripts\\activate

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   \`\`\`

3. **Install Dependencies**:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

4. **Run AI EyeCare**:
   \`\`\`bash
   python run.py
   \`\`\`

---

## 2. Running Unit Tests

Run the headless Pytest test suite (verifies EAR math, blink counting state machine, absence pausing, and timers without webcam hardware):

\`\`\`bash
pytest -v tests/
\`\`\`

---

## 3. Project Architecture

| Module | Role |
| :--- | :--- |
| \`run.py\` | Main entrypoint and process supervisor |
| \`camera.py\` | Thread-safe OpenCV capture running in background thread |
| \`detector.py\` | MediaPipe FaceMesh landmark extractor for 6-point eye contours |
| \`blink_tracker.py\` | Dual-eye EAR calculation, adaptive baseline, blink counter, and prolonged closure |
| \`timer_manager.py\` | Active screen timer, 20-20-20 break countdown, absence pause heuristic |
| \`notifier.py\` | Plyer desktop alerts and acoustic triad chime |
| \`settings.py\` | JSON configuration persistence with schema validation |
| \`ui_dashboard.py\` | CustomTkinter dark-mode desktop interface |
| \`tests/\` | Headless unit tests for algorithmic and timing correctness |

---

## 4. Privacy & Ethical Boundaries

- **100% Local Computer Vision**: Video frames are processed entirely in memory on your CPU/GPU. No video, images, or biometric coordinates are ever saved or transmitted.
- **Hardware Indicator**: Camera LED illuminates only when monitoring is active and releases immediately when you click 'Stop Monitoring'.
- **Wellness Disclaimer**: AI EyeCare is an ergonomic habit reminder assistant, not a clinical diagnostic medical device.
`,
  },
];
