/**
 * CircularPitchMeter.tsx
 *
 * Circular pitch meter showing detected note and cents deviation
 * Inspired by Antares Auto-Tune Access interface
 */

import React from 'react';
import './CircularPitchMeter.css';

interface CircularPitchMeterProps {
  detectedNote: string | null;
  detectedCents: number | null;
  isActive: boolean;
}

export const CircularPitchMeter: React.FC<CircularPitchMeterProps> = ({
  detectedNote,
  detectedCents,
  isActive,
}) => {
  // Generate the cent markers and bars
  const generateCentBars = () => {
    const bars = [];
    const totalBars = 60; // Number of bars around the circle
    const centsPerBar = 200 / totalBars; // -100 to +100 = 200 cents total

    for (let i = 0; i < totalBars; i++) {
      const cents = -100 + (i * centsPerBar);
      const angle = 90 + (i * (360 / totalBars)); // Start from top

      // Determine if this bar should be lit based on detected cents
      let isLit = false;
      let barColor = '#2d3748'; // Default dark color

      if (isActive && detectedCents !== null) {
        // Light up bars from 0 to detected cents
        if (detectedCents >= 0) {
          // Positive deviation (sharp)
          isLit = cents >= 0 && cents <= detectedCents;
          barColor = isLit ? '#f59e0b' : '#2d3748'; // Orange for sharp
        } else {
          // Negative deviation (flat)
          isLit = cents <= 0 && cents >= detectedCents;
          barColor = isLit ? '#f59e0b' : '#2d3748'; // Orange for flat
        }
      }

      bars.push(
        <div
          key={i}
          className="cent-bar"
          style={{
            transform: `rotate(${angle}deg) translateY(-140px)`,
            backgroundColor: barColor,
            opacity: isLit ? 1 : 0.3,
          }}
        />
      );
    }

    return bars;
  };

  return (
    <div className="circular-pitch-meter">
      {/* Cent markers */}
      <div className="cent-markers">
        <div className="cent-marker" style={{ top: '10px', left: '50%', transform: 'translateX(-50%)' }}>0</div>
        <div className="cent-marker" style={{ top: '35px', right: '90px' }}>+25</div>
        <div className="cent-marker" style={{ top: '95px', right: '35px' }}>+50</div>
        <div className="cent-marker" style={{ top: '180px', right: '10px' }}>+75</div>
        <div className="cent-marker" style={{ bottom: '35px', right: '10px' }}>+100</div>
        <div className="cent-marker" style={{ bottom: '10px', left: '50%', transform: 'translateX(-50%)' }}>-100</div>
        <div className="cent-marker" style={{ bottom: '35px', left: '10px' }}>-75</div>
        <div className="cent-marker" style={{ top: '180px', left: '10px' }}>-50</div>
        <div className="cent-marker" style={{ top: '95px', left: '35px' }}>-25</div>
      </div>

      {/* Circular meter with bars */}
      <div className="meter-circle">
        {generateCentBars()}
      </div>

      {/* Center display */}
      <div className="meter-center">
        <div className="detected-note">
          {detectedNote || '--'}
        </div>
        <div className="hold-button">
          <span className="hold-icon">❄️</span>
          <span className="hold-text">Hold</span>
        </div>
      </div>
    </div>
  );
};
