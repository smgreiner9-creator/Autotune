// Types for Jendrix Tune pitch correction state
import { App } from '#caller-utils';

export interface JendrixTuneState {
  // Connection state
  nodeId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Audio state
  isAudioRunning: boolean;

  // Pitch correction parameters
  key: App.Key;
  scale: App.Scale;
  retuneSpeed: number; // 0.0 - 1.0
  humanize: number; // 0.0 - 1.0
  mix: number; // 0.0 - 1.0
  formantPreserve: boolean;
  bypass: boolean;

  // Real-time pitch detection display
  detectedFrequency: number | null;
  detectedNote: string | null;
  detectedCents: number | null; // Deviation in cents
}
