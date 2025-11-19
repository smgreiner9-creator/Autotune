// Jendrix Tune - Real-time Vocal Pitch Correction
import { useEffect } from 'react';
import './App.css';
import { useJendrixTuneStore } from './store/jendrix_tune';
import { App as AppAPI } from '#caller-utils';
import { formatKey, formatScale } from './audio/MusicTheory';

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
    mix,
    formantPreserve,
    bypass,
    setKey,
    setScale,
    setRetuneSpeed,
    setHumanize,
    setMix,
    setFormantPreserve,
    setBypass,
    // Detected pitch
    detectedFrequency,
    detectedNote,
    detectedCents,
  } = useJendrixTuneStore();

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
        <h1 className="app-title">🎵 Jendrix Tune</h1>
        <p className="app-subtitle">Real-time Vocal Pitch Correction</p>
        <div className="node-info">
          {isConnected ? (
            <>
              Connected as <span className="node-id">{nodeId}</span>
            </>
          ) : (
            <span className="not-connected">Not connected to Hyperware</span>
          )}
        </div>
      </header>

      {/* Error display */}
      {error && (
        <div className="error error-message">
          {error}
          <button onClick={clearError} style={{ marginLeft: '1rem' }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Main content */}
      {isConnected && (
        <>
          {/* Audio Control Section */}
          <section className="section">
            <h2 className="section-title">Audio Control</h2>
            <p className="section-description">
              Start audio processing to enable real-time pitch correction
            </p>

            <div className="audio-control">
              <button
                className={`audio-toggle ${isAudioRunning ? 'running' : ''}`}
                onClick={handleAudioToggle}
                disabled={isLoading}
              >
                {isAudioRunning ? '⏸ Stop Audio' : '▶ Start Audio'}
              </button>

              {isAudioRunning && (
                <div className="audio-status">
                  <span className="status-indicator">● </span>
                  Audio Running - Speak or sing into your microphone
                </div>
              )}
            </div>

            {/* Pitch Detection Display */}
            {isAudioRunning && (
              <div className="pitch-display">
                <div className="pitch-info">
                  <div className="pitch-label">Detected:</div>
                  <div className="pitch-value">
                    {detectedNote || '--'}{' '}
                    {detectedFrequency ? `(${detectedFrequency.toFixed(1)} Hz)` : ''}
                  </div>
                  {detectedCents !== null && (
                    <div className="pitch-cents">
                      {detectedCents > 0 ? '+' : ''}
                      {detectedCents.toFixed(0)}¢
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Key & Scale Section */}
          <section className="section">
            <h2 className="section-title">Key & Scale</h2>
            <p className="section-description">
              Select the musical key and scale for pitch correction
            </p>

            <div className="param-group">
              <div className="param-control">
                <label htmlFor="key-select">Key</label>
                <select
                  id="key-select"
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

              <div className="param-control">
                <label htmlFor="scale-select">Scale</label>
                <select
                  id="scale-select"
                  value={scale}
                  onChange={(e) => setScale(e.target.value as AppAPI.Scale)}
                  disabled={isLoading}
                >
                  <option value={AppAPI.Scale.Major}>Major</option>
                  <option value={AppAPI.Scale.Minor}>Minor</option>
                </select>
              </div>
            </div>

            <div className="current-scale-display">
              Current: {formatKey(key)} {formatScale(scale)}
            </div>
          </section>

          {/* Retune Parameters Section */}
          <section className="section">
            <h2 className="section-title">Tuning Parameters</h2>

            <div className="param-control">
              <label htmlFor="retune-speed">
                Retune Speed: {(retuneSpeed * 100).toFixed(0)}%
                <span className="param-hint">
                  {retuneSpeed < 0.3
                    ? ' (Fast/Robotic)'
                    : retuneSpeed > 0.7
                      ? ' (Slow/Natural)'
                      : ' (Balanced)'}
                </span>
              </label>
              <input
                id="retune-speed"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={retuneSpeed}
                onChange={(e) => setRetuneSpeed(parseFloat(e.target.value))}
                disabled={isLoading}
              />
              <div className="param-description">
                Controls how quickly pitch snaps to the target note
              </div>
            </div>

            <div className="param-control">
              <label htmlFor="humanize">
                Humanize: {(humanize * 100).toFixed(0)}%
              </label>
              <input
                id="humanize"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={humanize}
                onChange={(e) => setHumanize(parseFloat(e.target.value))}
                disabled={isLoading}
              />
              <div className="param-description">
                Adds natural pitch variations for a more organic sound
              </div>
            </div>

            <div className="param-control">
              <label htmlFor="mix">Wet/Dry Mix: {(mix * 100).toFixed(0)}%</label>
              <input
                id="mix"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={mix}
                onChange={(e) => setMix(parseFloat(e.target.value))}
                disabled={isLoading}
              />
              <div className="param-description">
                Blend between dry (original) and wet (processed) signal
              </div>
            </div>
          </section>

          {/* Advanced Options */}
          <section className="section">
            <h2 className="section-title">Advanced Options</h2>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formantPreserve}
                  onChange={(e) => setFormantPreserve(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Formant Preservation</span>
                <div className="param-description">
                  Preserves vocal character during pitch shifting (Coming soon)
                </div>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={bypass}
                  onChange={(e) => setBypass(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Bypass (Pass-through)</span>
                <div className="param-description">
                  Disables processing, passes audio through unchanged
                </div>
              </label>
            </div>
          </section>

          {/* Info Section */}
          <section className="section info-section">
            <h2 className="section-title">About</h2>
            <p>
              <strong>Jendrix Tune</strong> is a real-time vocal pitch correction plugin
              built with Hyperware and Web Audio API.
            </p>
            <p className="feature-note">
              <strong>Current Phase:</strong> Pitch Detection (Phase 2/6)
            </p>
            <ul className="feature-list">
              <li>✅ Microphone input and audio routing</li>
              <li>✅ Pitch detection (YIN algorithm)</li>
              <li>⏳ Scale-based pitch correction - Coming next</li>
              <li>⏳ Pitch shifting</li>
              <li>⏳ Formant preservation</li>
            </ul>
            <div style={{ marginTop: '1.5rem', fontSize: '0.9em', color: '#666' }}>
              <strong>How it works:</strong> Sing or speak into your microphone to see real-time
              pitch detection. The detected note and cents deviation will appear above.
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default App;
