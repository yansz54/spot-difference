// Synthesized sounds: every sound the game makes is an oscillator shaped by
// WebAudio, so the game ships no audio files and makes no network request.
// The context is created lazily on the first user gesture (browsers require
// one) and stays silent until then.
export class SoundEngine {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  /** Create (or resume) the audio context. Safe to call on every gesture. */
  ensure() {
    try {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.context = new AudioContext();
      }
      if (this.context.state === 'suspended') void this.context.resume();
    } catch {
      this.context = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
  }

  /** One short tone: frequency, seconds, waveform, and peak volume. */
  tone(frequency, seconds, type, volume) {
    if (this.muted || !this.context) return;
    try {
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type || 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume || 0.12, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start(now);
      oscillator.stop(now + seconds + 0.05);
    } catch {
      // Sound is garnish: a failure here must never break the game.
    }
  }

  /** A found difference: a bright two-note chime, high then higher. */
  found() {
    this.tone(659.25, 0.16, 'sine', 0.14);
    window.setTimeout(() => this.tone(987.77, 0.28, 'sine', 0.14), 70);
  }

  /** A wrong click: a short low buzz. */
  wrong() {
    this.tone(138.59, 0.22, 'sawtooth', 0.07);
  }

  /** A plain UI click. */
  click() {
    this.tone(523.25, 0.07, 'triangle', 0.08);
  }

  /** A hint: one soft pluck. */
  hint() {
    this.tone(392.0, 0.2, 'triangle', 0.1);
    window.setTimeout(() => this.tone(587.33, 0.24, 'triangle', 0.08), 90);
  }

  /** A finished level: a small rising arpeggio. */
  fanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((frequency, index) => {
      window.setTimeout(() => this.tone(frequency, 0.3, 'sine', 0.12), index * 110);
    });
  }
}
