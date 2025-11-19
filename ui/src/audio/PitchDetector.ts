/**
 * PitchDetector.ts
 *
 * Implements the YIN algorithm for monophonic pitch detection
 * YIN is robust for vocal pitch tracking with low latency
 *
 * Reference: "YIN, a fundamental frequency estimator for speech and music"
 * by Alain de Cheveigné and Hideki Kawahara (2002)
 */

export class PitchDetector {
  private bufferSize: number;
  private sampleRate: number;
  private threshold: number; // YIN threshold for pitch detection confidence

  constructor(sampleRate: number, bufferSize: number = 2048) {
    this.sampleRate = sampleRate;
    this.bufferSize = bufferSize;
    this.threshold = 0.15; // Standard YIN threshold (0.1-0.15)
  }

  /**
   * Detect pitch from audio buffer using YIN algorithm
   * Returns frequency in Hz, or null if no pitch detected
   */
  detectPitch(audioBuffer: Float32Array): number | null {
    // Step 1: Calculate difference function
    const yinBuffer = this.differenceFunction(audioBuffer);

    // Step 2: Calculate cumulative mean normalized difference
    const cmndf = this.cumulativeMeanNormalizedDifference(yinBuffer);

    // Step 3: Find the best tau (period) using absolute threshold
    const tau = this.absoluteThreshold(cmndf);

    if (tau === -1) {
      return null; // No pitch detected
    }

    // Step 4: Parabolic interpolation for better accuracy
    const betterTau = this.parabolicInterpolation(cmndf, tau);

    // Convert tau (period in samples) to frequency
    const frequency = this.sampleRate / betterTau;

    // Validate frequency is in vocal range (80 Hz - 1200 Hz)
    if (frequency < 80 || frequency > 1200) {
      return null;
    }

    return frequency;
  }

  /**
   * YIN Step 1: Difference Function
   * Calculates autocorrelation-like function in the time domain
   */
  private differenceFunction(buffer: Float32Array): Float32Array {
    const yinBuffer = new Float32Array(this.bufferSize / 2);
    yinBuffer[0] = 1.0; // By definition

    for (let tau = 1; tau < yinBuffer.length; tau++) {
      let sum = 0;
      for (let i = 0; i < yinBuffer.length; i++) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      yinBuffer[tau] = sum;
    }

    return yinBuffer;
  }

  /**
   * YIN Step 2: Cumulative Mean Normalized Difference Function (CMNDF)
   * Normalizes the difference function
   */
  private cumulativeMeanNormalizedDifference(yinBuffer: Float32Array): Float32Array {
    const cmndf = new Float32Array(yinBuffer.length);
    cmndf[0] = 1.0;

    let runningSum = 0;

    for (let tau = 1; tau < yinBuffer.length; tau++) {
      runningSum += yinBuffer[tau];
      cmndf[tau] = yinBuffer[tau] / (runningSum / tau);
    }

    return cmndf;
  }

  /**
   * YIN Step 3: Absolute Threshold
   * Find first tau where CMNDF drops below threshold
   */
  private absoluteThreshold(cmndf: Float32Array): number {
    // Start search after minimum period (prevents detecting too-high frequencies)
    const minTau = Math.floor(this.sampleRate / 1200); // 1200 Hz max

    for (let tau = minTau; tau < cmndf.length; tau++) {
      if (cmndf[tau] < this.threshold) {
        // Found a dip below threshold
        // Now find the minimum in this valley
        while (tau + 1 < cmndf.length && cmndf[tau + 1] < cmndf[tau]) {
          tau++;
        }
        return tau;
      }
    }

    return -1; // No pitch found
  }

  /**
   * YIN Step 4: Parabolic Interpolation
   * Refine tau estimate for sub-sample accuracy
   */
  private parabolicInterpolation(cmndf: Float32Array, tau: number): number {
    if (tau === 0 || tau >= cmndf.length - 1) {
      return tau;
    }

    const s0 = cmndf[tau - 1];
    const s1 = cmndf[tau];
    const s2 = cmndf[tau + 1];

    // Parabolic interpolation formula
    const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));

    return tau + adjustment;
  }

  /**
   * Get confidence of last pitch detection (0.0 - 1.0)
   * Lower CMNDF value = higher confidence
   */
  getConfidence(cmndf: Float32Array, tau: number): number {
    if (tau < 0 || tau >= cmndf.length) {
      return 0;
    }
    // Invert CMNDF to get confidence (lower CMNDF = higher confidence)
    return Math.max(0, 1 - cmndf[tau]);
  }

  /**
   * Set YIN threshold (0.0 - 1.0)
   * Lower = more strict, fewer false positives
   * Higher = more lenient, may detect more pitches but less accurate
   */
  setThreshold(threshold: number): void {
    this.threshold = Math.max(0.01, Math.min(0.5, threshold));
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.bufferSize;
  }
}

/**
 * Helper function to calculate RMS (Root Mean Square) of audio buffer
 * Used to detect silence and avoid pitch detection on quiet signals
 */
export function calculateRMS(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

/**
 * Check if audio signal is too quiet for pitch detection
 * RMS threshold for silence detection
 */
export function isSilent(buffer: Float32Array, threshold: number = 0.01): boolean {
  return calculateRMS(buffer) < threshold;
}
