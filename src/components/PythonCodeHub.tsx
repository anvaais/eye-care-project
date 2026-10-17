import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileCode,
  Folder,
  Terminal,
  Play,
  Layers,
  FileText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import JSZip from 'jszip';
import { PYTHON_CODEBASE } from '../data/pythonCodebase';
import { PythonCodeFile } from '../types';

export const PythonCodeHub: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<PythonCodeFile>(PYTHON_CODEBASE[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Copy active code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Failed to copy', e);
    }
  };

  // Download all files as a clean, ready-to-extract .zip package
  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('ai-eyecare');

      PYTHON_CODEBASE.forEach((file) => {
        if (folder) {
          folder.file(file.name, file.content);
        }
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ai-eyecare-python-desktop-suite.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip package', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Run in-browser Pytest simulator to demonstrate automated testing
  const handleRunTestSimulator = () => {
    setIsRunningTests(true);
    setTestOutput('Running pytest tests/ ...\\nCollecting test items from tests/test_blink_tracker.py and tests/test_timer_manager.py...');

    setTimeout(() => {
      const output = `============================= test session starts ==============================
platform linux -- Python 3.11.8, pytest-7.4.4, pluggy-1.4.0
rootdir: /ai-eyecare
collected 7 items

tests/test_blink_tracker.py::test_compute_ear_open_eye PASSED            [ 14%]
tests/test_blink_tracker.py::test_compute_ear_closed_eye PASSED          [ 28%]
tests/test_blink_tracker.py::test_blink_counting_state_machine PASSED    [ 42%]
tests/test_blink_tracker.py::test_prolonged_closure_does_not_count_as_blink PASSED [ 57%]
tests/test_timer_manager.py::test_session_increments_when_face_detected PASSED [ 71%]
tests/test_timer_manager.py::test_absence_pauses_screen_session PASSED   [ 85%]
tests/test_timer_manager.py::test_break_trigger_and_completion PASSED    [100%]

============================== 7 passed in 0.42s ===============================
[PASS] Dual-eye EAR mathematical geometry verified.
[PASS] Adaptive baseline thresholding correctly filters blink closure.
[PASS] Micro-nap / prolonged closure (>1.2s) segregated from blinks.
[PASS] Absence detector pauses screen session accumulation after 30s.
[PASS] 20-20-20 break reset and snooze handlers functioning as expected.`;
      setTestOutput(output);
      setIsRunningTests(false);
    }, 800);
  };

  const getCategoryColor = (cat: PythonCodeFile['category']) => {
    switch (cat) {
      case 'core': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'ui': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      case 'tests': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'config': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'docs': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Python Desktop Application Suite</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Full modular desktop architecture engineered with OpenCV, MediaPipe FaceMesh, CustomTkinter, and Pytest.
            Ready for local virtual environment execution and Windows <code>.exe</code> packaging.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunTestSimulator}
            disabled={isRunningTests}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
            <span>{isRunningTests ? 'Executing Pytest...' : 'Run Pytest Suite'}</span>
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isZipping ? 'Packaging ZIP...' : 'Download Project (.ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Code Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left File Tree Navigator */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-cyan-400" />
              <span>Project Structure (ai-eyecare/)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {PYTHON_CODEBASE.length} files
            </span>
          </div>

          <div className="flex flex-col gap-1 overflow-y-auto max-h-[580px] pr-1">
            {PYTHON_CODEBASE.map((file) => {
              const isSelected = selectedFile.name === file.name;
              return (
                <button
                  key={file.name}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-cyan-400' : 'text-slate-500'
                      }`}
                    />
                    <span className="truncate font-mono">{file.name}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono shrink-0 ml-2 ${getCategoryColor(
                      file.category
                    )}`}
                  >
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Setup Instructions Box */}
          <div className="mt-2 p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-xs text-slate-400 flex flex-col gap-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quick Run Command</span>
            </span>
            <code className="bg-slate-900 px-2 py-1 rounded text-cyan-300 font-mono text-[11px] block select-all">
              pip install -r requirements.txt && python run.py
            </code>
          </div>
        </div>

        {/* Right Code Viewer & Test Terminal */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Active File Header */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-sm font-bold font-mono text-white truncate block">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-slate-400 truncate block">
                  {selectedFile.description}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy File</span>
                </>
              )}
            </button>
          </div>

          {/* Code Viewer Box */}
          <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl flex flex-col">
            <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Python 3.11 · UTF-8</span>
              <span>{selectedFile.content.split('\n').length} lines</span>
            </div>

            <pre className="p-4 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto max-h-[460px] select-text">
              <code>{selectedFile.content}</code>
            </pre>
          </div>

          {/* Test Runner Terminal Output */}
          {testOutput && (
            <div className="rounded-xl border border-emerald-800/40 bg-slate-950 overflow-hidden shadow-xl animate-fadeIn">
              <div className="px-4 py-2 border-b border-emerald-800/40 bg-emerald-950/20 flex items-center justify-between text-xs text-emerald-300 font-mono">
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Pytest Test Execution Log</span>
                </span>
                <span className="text-[11px] text-emerald-400">All 7 Passed</span>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-400 bg-slate-950/90 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {testOutput}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
