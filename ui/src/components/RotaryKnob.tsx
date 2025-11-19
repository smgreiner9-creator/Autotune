/**
 * RotaryKnob.tsx
 *
 * Rotary knob component for parameter control
 * Inspired by Antares Auto-Tune Access interface
 */

import React, { useState, useRef, useEffect } from 'react';
import './RotaryKnob.css';

interface RotaryKnobProps {
  label: string;
  value: number; // 0.0 to 1.0
  onChange: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
  middleLabel?: string;
  disabled?: boolean;
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  label,
  value,
  onChange,
  minLabel = 'Min',
  maxLabel = 'Max',
  middleLabel = 'Medium',
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startValueRef = useRef<number>(0);

  // Convert value (0-1) to rotation angle (-135° to +135°, 270° total)
  const valueToAngle = (val: number): number => {
    return -135 + (val * 270);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = startYRef.current - e.clientY; // Inverted: up = increase
      const sensitivity = 0.003; // Adjust sensitivity
      const deltaValue = deltaY * sensitivity;

      const newValue = Math.max(0, Math.min(1, startValueRef.current + deltaValue));
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onChange, value]);

  const angle = valueToAngle(value);

  // Determine current label based on value
  const getCurrentLabel = () => {
    if (value < 0.33) return minLabel;
    if (value < 0.67) return middleLabel;
    return maxLabel;
  };

  return (
    <div className="rotary-knob-container">
      <div className="rotary-label">{label}</div>
      <div className="rotary-current-label">{getCurrentLabel()}</div>
      <div
        ref={knobRef}
        className={`rotary-knob ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div
          className="rotary-knob-inner"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <div className="rotary-indicator" />
        </div>
      </div>
      <div className="rotary-range-labels">
        <span className="range-label-min">{minLabel}</span>
        <span className="range-label-max">{maxLabel}</span>
      </div>
    </div>
  );
};
