/**
 * MusicTheory.ts
 *
 * Musical theory utilities for pitch correction
 * Handles note/frequency conversions, scale calculations, and tuning
 */

import { App } from '#caller-utils';

// MIDI note number constants
const A4_MIDI = 69;
const A4_FREQUENCY = 440.0;

// Scale intervals (semitones from root)
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

// Note names for display
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Key to MIDI offset mapping (C = 0, C# = 1, etc.)
const KEY_TO_OFFSET: Record<App.Key, number> = {
  [App.Key.C]: 0,
  [App.Key.CSharp]: 1,
  [App.Key.D]: 2,
  [App.Key.DSharp]: 3,
  [App.Key.E]: 4,
  [App.Key.F]: 5,
  [App.Key.FSharp]: 6,
  [App.Key.G]: 7,
  [App.Key.GSharp]: 8,
  [App.Key.A]: 9,
  [App.Key.ASharp]: 10,
  [App.Key.B]: 11,
};

/**
 * Convert frequency to MIDI note number (fractional for microtones)
 */
export function frequencyToMidi(frequency: number): number {
  if (frequency <= 0) return 0;
  return 12 * Math.log2(frequency / A4_FREQUENCY) + A4_MIDI;
}

/**
 * Convert MIDI note number to frequency
 */
export function midiToFrequency(midi: number): number {
  return A4_FREQUENCY * Math.pow(2, (midi - A4_MIDI) / 12);
}

/**
 * Get note name from MIDI number
 */
export function midiToNoteName(midi: number): string {
  const noteIndex = Math.round(midi) % 12;
  const octave = Math.floor(Math.round(midi) / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Get the scale notes (MIDI numbers) for a given key and scale type
 * Returns all scale notes across the full MIDI range (0-127)
 */
export function getScaleNotes(key: App.Key, scale: App.Scale): number[] {
  const rootOffset = KEY_TO_OFFSET[key];
  const intervals = scale === App.Scale.Major ? MAJOR_SCALE : MINOR_SCALE;

  const scaleNotes: number[] = [];

  // Generate scale notes for all octaves (0-10)
  for (let octave = 0; octave <= 10; octave++) {
    for (const interval of intervals) {
      const midiNote = octave * 12 + rootOffset + interval;
      if (midiNote >= 0 && midiNote <= 127) {
        scaleNotes.push(midiNote);
      }
    }
  }

  return scaleNotes.sort((a, b) => a - b);
}

/**
 * Find the nearest scale note to a given MIDI note
 * This is the core of pitch correction - snapping to the scale
 */
export function findNearestScaleNote(
  midiNote: number,
  key: App.Key,
  scale: App.Scale
): number {
  const scaleNotes = getScaleNotes(key, scale);

  // Find the closest scale note
  let nearest = scaleNotes[0];
  let minDistance = Math.abs(midiNote - nearest);

  for (const scaleNote of scaleNotes) {
    const distance = Math.abs(midiNote - scaleNote);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = scaleNote;
    }
  }

  return nearest;
}

/**
 * Calculate pitch correction amount (in semitones)
 * Positive = shift up, Negative = shift down
 */
export function calculatePitchCorrection(
  inputFrequency: number,
  key: App.Key,
  scale: App.Scale
): { targetFrequency: number; semitoneShift: number; targetNote: string } {
  // Convert input frequency to MIDI
  const inputMidi = frequencyToMidi(inputFrequency);

  // Find nearest scale note
  const targetMidi = findNearestScaleNote(inputMidi, key, scale);

  // Calculate shift in semitones
  const semitoneShift = targetMidi - inputMidi;

  // Convert target MIDI back to frequency
  const targetFrequency = midiToFrequency(targetMidi);

  // Get note name for display
  const targetNote = midiToNoteName(targetMidi);

  return {
    targetFrequency,
    semitoneShift,
    targetNote,
  };
}

/**
 * Get cents deviation from nearest semitone
 * Useful for tuning displays (100 cents = 1 semitone)
 */
export function getCentsDeviation(frequency: number): number {
  const midi = frequencyToMidi(frequency);
  const nearestMidi = Math.round(midi);
  return (midi - nearestMidi) * 100; // Convert to cents
}

/**
 * Format key for display
 */
export function formatKey(key: App.Key): string {
  const keyMap: Record<App.Key, string> = {
    [App.Key.C]: 'C',
    [App.Key.CSharp]: 'C♯',
    [App.Key.D]: 'D',
    [App.Key.DSharp]: 'D♯',
    [App.Key.E]: 'E',
    [App.Key.F]: 'F',
    [App.Key.FSharp]: 'F♯',
    [App.Key.G]: 'G',
    [App.Key.GSharp]: 'G♯',
    [App.Key.A]: 'A',
    [App.Key.ASharp]: 'A♯',
    [App.Key.B]: 'B',
  };
  return keyMap[key];
}

/**
 * Format scale for display
 */
export function formatScale(scale: App.Scale): string {
  return scale === App.Scale.Major ? 'Major' : 'Minor';
}

/**
 * Check if a frequency is valid for vocal range
 * Typical vocal range: 80 Hz (E2) to 1200 Hz (D6)
 */
export function isVocalRange(frequency: number): boolean {
  return frequency >= 80 && frequency <= 1200;
}
