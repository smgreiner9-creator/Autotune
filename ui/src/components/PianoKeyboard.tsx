/**
 * PianoKeyboard.tsx
 *
 * Piano keyboard component showing scale notes highlighted
 * Inspired by Antares Auto-Tune Access interface
 */

import React from 'react';
import { App } from '#caller-utils';
import { getScaleNotes } from '../audio/MusicTheory';
import './PianoKeyboard.css';

interface PianoKeyboardProps {
  keySignature: App.Key;
  scale: App.Scale;
}

// Define piano keys (2 octaves starting from C3 = MIDI 48)
const PIANO_KEYS = [
  { midi: 48, name: 'C', type: 'white' },
  { midi: 49, name: 'C#', type: 'black' },
  { midi: 50, name: 'D', type: 'white' },
  { midi: 51, name: 'D#', type: 'black' },
  { midi: 52, name: 'E', type: 'white' },
  { midi: 53, name: 'F', type: 'white' },
  { midi: 54, name: 'F#', type: 'black' },
  { midi: 55, name: 'G', type: 'white' },
  { midi: 56, name: 'G#', type: 'black' },
  { midi: 57, name: 'A', type: 'white' },
  { midi: 58, name: 'A#', type: 'black' },
  { midi: 59, name: 'B', type: 'white' },
  { midi: 60, name: 'C', type: 'white' }, // C4
  { midi: 61, name: 'C#', type: 'black' },
  { midi: 62, name: 'D', type: 'white' },
  { midi: 63, name: 'D#', type: 'black' },
  { midi: 64, name: 'E', type: 'white' },
  { midi: 65, name: 'F', type: 'white' },
  { midi: 66, name: 'F#', type: 'black' },
  { midi: 67, name: 'G', type: 'white' },
  { midi: 68, name: 'G#', type: 'black' },
  { midi: 69, name: 'A', type: 'white' },
  { midi: 70, name: 'A#', type: 'black' },
  { midi: 71, name: 'B', type: 'white' },
];

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({ keySignature, scale }) => {
  // Get all scale notes for the current key and scale
  const scaleNotes = getScaleNotes(keySignature, scale);
  const scaleNotesSet = new Set(scaleNotes);

  // Check if a MIDI note is in the scale
  const isInScale = (midi: number): boolean => {
    return scaleNotesSet.has(midi);
  };

  return (
    <div className="piano-keyboard">
      <div className="piano-keys">
        {PIANO_KEYS.map((key) => {
          const inScale = isInScale(key.midi);
          const keyClassName = `piano-key ${key.type} ${inScale ? 'in-scale' : ''}`;

          if (key.type === 'black') {
            return (
              <div key={key.midi} className={keyClassName}>
                <span className="key-label">{key.name}</span>
              </div>
            );
          }

          return (
            <div key={key.midi} className={keyClassName}>
              <span className="key-label">{key.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
