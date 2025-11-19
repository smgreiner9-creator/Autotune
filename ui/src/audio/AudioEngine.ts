/**
 * AudioEngine.ts
 *
 * Core audio processing engine using Web Audio API
 * Manages microphone input, audio context, and output routing
 */

import { PitchDetector, isSilent } from './PitchDetector';
import { frequencyToMidi, midiToNoteName, getCentsDeviation } from './MusicTheory';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Pitch detection
  private pitchDetector: PitchDetector | null = null;
  private pitchDetectionActive: boolean = false;
  private pitchDetectionInterval: number | null = null;
  private onPitchDetected: ((frequency: number, note: string, cents: number) => void) | null = null;

  /**
   * Initialize the audio engine and request microphone access
   * Returns true if successful, false otherwise
   */
  async initialize(): Promise<boolean> {
    try {
      // Create audio context (use webkitAudioContext for Safari compatibility)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Request microphone access
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false, // Disable for music/vocal processing
          noiseSuppression: false,  // We want raw audio
          autoGainControl: false,   // Manual gain control
        },
      });

      // Create audio source from microphone
      this.micSource = this.audioContext.createMediaStreamSource(this.micStream);

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;

      // Create analyser for visualization and pitch detection
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 4096; // Higher FFT size for better pitch accuracy
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Audio routing: Mic → Analyser → Gain → Output
      this.micSource.connect(this.analyserNode);
      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Initialize pitch detector
      this.pitchDetector = new PitchDetector(this.audioContext.sampleRate, 2048);

      console.log('🎵 Audio engine initialized:', {
        sampleRate: this.audioContext.sampleRate,
        state: this.audioContext.state,
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize audio engine:', error);
      return false;
    }
  }

  /**
   * Start audio processing
   */
  async start(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('🎵 Audio context resumed');
    }
  }

  /**
   * Stop audio processing
   */
  stop(): void {
    this.stopPitchDetection();
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
      console.log('🎵 Audio context suspended');
    }
  }

  /**
   * Start real-time pitch detection
   * Calls the callback with detected frequency, note name, and cents deviation
   */
  startPitchDetection(callback: (frequency: number, note: string, cents: number) => void): void {
    if (!this.analyserNode || !this.pitchDetector) {
      console.error('❌ Cannot start pitch detection: engine not initialized');
      return;
    }

    this.onPitchDetected = callback;
    this.pitchDetectionActive = true;

    // Run pitch detection loop at ~60 FPS
    const detectPitch = () => {
      if (!this.pitchDetectionActive || !this.analyserNode || !this.pitchDetector) {
        return;
      }

      // Get time-domain audio data
      const bufferLength = this.analyserNode.fftSize;
      const dataArray = new Float32Array(bufferLength);
      this.analyserNode.getFloatTimeDomainData(dataArray);

      // Check if signal is too quiet (silence detection)
      if (!isSilent(dataArray, 0.01)) {
        // Detect pitch using YIN algorithm
        const frequency = this.pitchDetector.detectPitch(dataArray);

        if (frequency && this.onPitchDetected) {
          // Convert frequency to note name and cents
          const midi = frequencyToMidi(frequency);
          const note = midiToNoteName(midi);
          const cents = getCentsDeviation(frequency);

          // Call callback with results
          this.onPitchDetected(frequency, note, cents);
        }
      }

      // Schedule next detection
      this.pitchDetectionInterval = window.setTimeout(detectPitch, 16); // ~60 FPS
    };

    // Start detection loop
    detectPitch();
    console.log('🎵 Pitch detection started');
  }

  /**
   * Stop pitch detection
   */
  stopPitchDetection(): void {
    this.pitchDetectionActive = false;
    if (this.pitchDetectionInterval !== null) {
      clearTimeout(this.pitchDetectionInterval);
      this.pitchDetectionInterval = null;
    }
    console.log('🎵 Pitch detection stopped');
  }

  /**
   * Clean up and release resources
   */
  destroy(): void {
    // Stop pitch detection
    this.stopPitchDetection();

    // Disconnect all nodes
    if (this.micSource) {
      this.micSource.disconnect();
    }
    if (this.analyserNode) {
      this.analyserNode.disconnect();
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
    }

    // Stop microphone stream
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
    }

    console.log('🎵 Audio engine destroyed');
  }

  /**
   * Set output volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get current audio context sample rate
   */
  getSampleRate(): number {
    return this.audioContext?.sampleRate ?? 44100;
  }

  /**
   * Get analyser node for visualization
   */
  getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  /**
   * Get audio context for advanced processing
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Check if audio engine is running
   */
  isRunning(): boolean {
    return this.audioContext?.state === 'running';
  }

  /**
   * Get time domain data for waveform visualization
   */
  getTimeDomainData(): Float32Array | null {
    if (!this.analyserNode) return null;

    const bufferLength = this.analyserNode.fftSize;
    const dataArray = new Float32Array(bufferLength);
    this.analyserNode.getFloatTimeDomainData(dataArray);

    return dataArray;
  }

  /**
   * Get frequency domain data for spectrum visualization
   */
  getFrequencyData(): Uint8Array | null {
    if (!this.analyserNode) return null;

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);

    return dataArray;
  }
}
