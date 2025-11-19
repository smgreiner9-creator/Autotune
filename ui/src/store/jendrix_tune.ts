// Zustand store for Jendrix Tune pitch correction state management
import { create } from 'zustand';
import type { JendrixTuneState } from '../types/jendrix_tune';
import { getNodeId } from '../types/global';
import { App } from '#caller-utils';
import { AudioEngine } from '../audio/AudioEngine';

interface JendrixTuneStore extends JendrixTuneState {
  // Audio engine
  audioEngine: AudioEngine | null;

  // Actions - Initialization
  initialize: () => void;
  fetchStatus: () => Promise<void>;

  // Actions - Audio control
  startAudio: () => Promise<boolean>;
  stopAudio: () => void;
  destroyAudio: () => void;

  // Actions - Parameter updates
  setKey: (key: App.Key) => Promise<void>;
  setScale: (scale: App.Scale) => Promise<void>;
  setRetuneSpeed: (speed: number) => Promise<void>;
  setHumanize: (amount: number) => Promise<void>;
  setMix: (mix: number) => Promise<void>;
  setFormantPreserve: (enabled: boolean) => Promise<void>;
  setBypass: (bypass: boolean) => Promise<void>;

  // Actions - Real-time updates (no backend call)
  updateDetectedPitch: (frequency: number, note: string, cents: number) => void;

  // Error management
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Create the Zustand store
export const useJendrixTuneStore = create<JendrixTuneStore>((set, get) => ({
  // Initial state
  nodeId: null,
  isConnected: false,
  isLoading: false,
  error: null,

  // Audio state
  audioEngine: null,
  isAudioRunning: false,

  // Pitch correction parameters (will be fetched from backend)
  key: App.Key.C,
  scale: App.Scale.Major,
  retuneSpeed: 0.5,
  humanize: 0.1,
  mix: 1.0,
  formantPreserve: true,
  bypass: false,

  // Real-time pitch detection
  detectedFrequency: null,
  detectedNote: null,
  detectedCents: null,

  // Initialize the store and check connection
  initialize: () => {
    const nodeId = getNodeId();
    set({
      nodeId,
      isConnected: nodeId !== null,
    });

    // Fetch initial status if connected
    if (nodeId) {
      get().fetchStatus();
    }
  },

  // Fetch current status from backend
  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const status = await App.get_status();
      set({
        key: status.key,
        scale: status.scale,
        retuneSpeed: status.retune_speed,
        humanize: status.humanize,
        mix: status.mix,
        formantPreserve: status.formant_preserve,
        bypass: status.bypass,
        isLoading: false,
      });
      console.log('✅ Status fetched:', status);
    } catch (error) {
      set({
        error: getErrorMessage(error),
        isLoading: false,
      });
    }
  },

  // Start audio processing
  startAudio: async () => {
    const { audioEngine, updateDetectedPitch } = get();

    try {
      // Create audio engine if not exists
      if (!audioEngine) {
        const engine = new AudioEngine();
        const success = await engine.initialize();

        if (!success) {
          set({ error: 'Failed to initialize audio engine' });
          return false;
        }

        set({ audioEngine: engine });
        await engine.start();

        // Start pitch detection with callback to update state
        engine.startPitchDetection((frequency, note, cents) => {
          updateDetectedPitch(frequency, note, cents);
        });

        set({ isAudioRunning: true });
        console.log('✅ Audio started with pitch detection');
        return true;
      }

      // Resume existing engine
      await audioEngine.start();

      // Restart pitch detection
      audioEngine.startPitchDetection((frequency, note, cents) => {
        updateDetectedPitch(frequency, note, cents);
      });

      set({ isAudioRunning: true });
      console.log('✅ Audio resumed with pitch detection');
      return true;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      return false;
    }
  },

  // Stop audio processing
  stopAudio: () => {
    const { audioEngine } = get();
    if (audioEngine) {
      audioEngine.stop();
      set({ isAudioRunning: false });
      console.log('⏸️ Audio stopped');
    }
  },

  // Destroy audio engine
  destroyAudio: () => {
    const { audioEngine } = get();
    if (audioEngine) {
      audioEngine.destroy();
      set({
        audioEngine: null,
        isAudioRunning: false,
      });
      console.log('🗑️ Audio destroyed');
    }
  },

  // Parameter setters (update backend and local state)
  setKey: async (key: App.Key) => {
    try {
      await App.set_key(key);
      set({ key });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  setScale: async (scale: App.Scale) => {
    try {
      await App.set_scale(scale);
      set({ scale });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  setRetuneSpeed: async (speed: number) => {
    try {
      await App.set_retune_speed(speed);
      set({ retuneSpeed: speed });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  setHumanize: async (amount: number) => {
    try {
      await App.set_humanize(amount);
      set({ humanize: amount });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  setMix: async (mix: number) => {
    try {
      await App.set_mix(mix);
      set({ mix });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  setFormantPreserve: async (enabled: boolean) => {
    try {
      await App.set_formant_preserve(enabled);
      set({ formantPreserve: enabled });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  setBypass: async (bypass: boolean) => {
    try {
      await App.set_bypass(bypass);
      set({ bypass });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  // Update detected pitch (local only, for display)
  updateDetectedPitch: (frequency: number, note: string, cents: number) => {
    set({
      detectedFrequency: frequency,
      detectedNote: note,
      detectedCents: cents,
    });
  },

  // Error management
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unknown error occurred';
}

// Selector hooks for common use cases
export const useNodeId = () => useJendrixTuneStore((state) => state.nodeId);
export const useIsConnected = () => useJendrixTuneStore((state) => state.isConnected);
export const useIsAudioRunning = () => useJendrixTuneStore((state) => state.isAudioRunning);
export const useError = () => useJendrixTuneStore((state) => state.error);
export const useDetectedPitch = () =>
  useJendrixTuneStore((state) => ({
    frequency: state.detectedFrequency,
    note: state.detectedNote,
    cents: state.detectedCents,
  }));
