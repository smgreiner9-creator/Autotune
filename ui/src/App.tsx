// Jendrix Tune - Real-time Vocal Pitch Correction
import { useEffect, useState } from 'react';
import './App.css';
import { useJendrixTuneStore } from './store/jendrix_tune';
import { App as AppAPI } from '#caller-utils';
import { formatKey } from './audio/MusicTheory';
import { CircularPitchMeter } from './components/CircularPitchMeter';
import { RotaryKnob } from './components/RotaryKnob';
import { PianoKeyboard } from './components/PianoKeyboard';

function App() {
  // Store state and actions
  const {
    nodeId,
    isConnected,
    isAudioRunning,
    isLoading,
    error,
    initialize,
    startAudio,
    stopAudio,
    destroyAudio,
    clearError,
    // Parameters
    key,
    scale,
    retuneSpeed,
    humanize,
    setKey,
    setScale,
    setRetuneSpeed,
    setHumanize,
    // Detected pitch
    detectedNote,
    detectedCents,
  } = useJendrixTuneStore();

  // Mode state (Natural vs Extreme)
  const [mode, setMode] = useState<'natural' | 'extreme'>('natural');

  // Initialize on mount
  useEffect(() => {
    initialize();

    // Cleanup on unmount
    return () => {
      destroyAudio();
    };
  }, [initialize, destroyAudio]);

  // Handle audio start/stop
  const handleAudioToggle = async () => {
    if (isAudioRunning) {
      stopAudio();
    } else {
      const success = await startAudio();
      if (!success) {
        console.error('Failed to start audio');
      }
    }
  };

  // All keys for selector
  const allKeys = [
    AppAPI.Key.C,
    AppAPI.Key.CSharp,
    AppAPI.Key.D,
    AppAPI.Key.DSharp,
    AppAPI.Key.E,
    AppAPI.Key.F,
    AppAPI.Key.FSharp,
    AppAPI.Key.G,
    AppAPI.Key.GSharp,
    AppAPI.Key.A,
    AppAPI.Key.ASharp,
    AppAPI.Key.B,
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon">🎵</div>
            <div className="logo-text">Jendrix</div>
          </div>
        </div>
        <div className="header-center">
          <h1 className="app-title">AUTO-TUNE <span className="title-accent">ACCESS</span></h1>
        </div>
        <div className="header-right">
          <button className="icon-button" title="Refresh">
            ↻
          </button>
          <button className="icon-button" title="Settings">
            ⚙
          </button>
          <button
            className={`icon-button power-button ${isAudioRunning ? 'active' : ''}`}
            onClick={handleAudioToggle}
            disabled={isLoading}
            title={isAudioRunning ? 'Stop Audio' : 'Start Audio'}
          >
            ⏻
          </button>
        </div>
      </header>

      {/* Error display */}
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={clearError} className="error-dismiss">✕</button>
        </div>
      )}

      {/* Main content */}
      {isConnected ? (
        <div className="main-content">
          {/* Top Controls Row */}
          <div className="top-controls">
            {/* Mode Buttons */}
            <div className="mode-buttons">
              <button
                className={`mode-button ${mode === 'natural' ? 'active' : ''}`}
                onClick={() => setMode('natural')}
              >
                Natural
              </button>
              <button
                className={`mode-button ${mode === 'extreme' ? 'active' : ''}`}
                onClick={() => setMode('extreme')}
              >
                Extreme
              </button>
            </div>

            {/* Key & Scale Selectors */}
            <div className="key-scale-selectors">
              <div className="selector-group">
                <label>Key</label>
                <select
                  className="key-select"
                  value={key}
                  onChange={(e) => setKey(e.target.value as AppAPI.Key)}
                  disabled={isLoading}
                >
                  {allKeys.map((k) => (
                    <option key={k} value={k}>
                      {formatKey(k)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="selector-group">
                <label>Scale</label>
                <select
                  className="scale-select"
                  value={scale}
                  onChange={(e) => setScale(e.target.value as AppAPI.Scale)}
                  disabled={isLoading}
                >
                  <option value={AppAPI.Scale.Major}>Major</option>
                  <option value={AppAPI.Scale.Minor}>Minor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Controls Area */}
          <div className="controls-area">
            {/* Left Knob - Retune Speed */}
            <div className="control-knob">
              <RotaryKnob
                label="Retune Speed"
                value={retuneSpeed}
                onChange={setRetuneSpeed}
                minLabel="Slow"
                maxLabel="Fast"
                middleLabel="Medium"
                disabled={isLoading}
              />
            </div>

            {/* Center - Circular Pitch Meter */}
            <div className="center-meter">
              <CircularPitchMeter
                detectedNote={detectedNote}
                detectedCents={detectedCents}
                isActive={isAudioRunning}
              />
            </div>

            {/* Right Knob - Humanize */}
            <div className="control-knob">
              <RotaryKnob
                label="Humanize"
                value={humanize}
                onChange={setHumanize}
                minLabel="Off"
                maxLabel="Max"
                middleLabel="Min"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Note Mode Buttons */}
          <div className="note-mode-controls">
            <label className="radio-button">
              <input type="radio" name="note-mode" defaultChecked />
              <span className="radio-label">Remove Notes</span>
            </label>
            <label className="radio-button">
              <input type="radio" name="note-mode" />
              <span className="radio-label">Play Notes</span>
            </label>
          </div>

          {/* Piano Keyboard */}
          <PianoKeyboard keySignature={key} scale={scale} />
        </div>
      ) : (
        <div className="connection-error">
          <p>Not connected to Hyperware</p>
          <p className="error-detail">Node ID: {nodeId || 'Unknown'}</p>
        </div>
      )}
    </div>
  );
}

export default App;
