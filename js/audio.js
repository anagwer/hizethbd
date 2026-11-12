// 8-Bit Chiptune Synthesizer & Retro SFX (Web Audio API)

class PixelAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.loopTimer = null;
    this.stepIndex = 0;

    // Warm, cheerful 8-bit melody (Hz) — 0 = rest
    // Combines an upbeat adventure motif with a gentle birthday phrase
    this.melody = [
      523.25, 0, 659.25, 783.99, 1046.5, 0, 783.99, 659.25,
      587.33, 659.25, 698.46, 0, 659.25, 587.33, 523.25, 0,
      440.0, 523.25, 659.25, 0, 587.33, 523.25, 493.88, 0,
      392.0, 493.88, 587.33, 659.25, 523.25, 0, 523.25, 0,
      // Happy birthday 8-bit variation phrase
      392.0, 392.0, 440.0, 0, 392.0, 0, 523.25, 0,
      493.88, 0, 0, 0, 392.0, 392.0, 440.0, 0,
      392.0, 0, 587.33, 0, 523.25, 0, 0, 0,
      523.25, 659.25, 783.99, 1046.5, 880.0, 783.99, 659.25, 0
    ];

    this.bass = [
      130.81, 196.0, 130.81, 196.0, 146.83, 220.0, 146.83, 220.0,
      174.61, 220.0, 174.61, 220.0, 196.0, 246.94, 196.0, 146.83,
      110.0, 164.81, 110.0, 164.81, 146.83, 220.0, 196.0, 146.83,
      196.0, 246.94, 196.0, 146.83, 130.81, 196.0, 130.81, 0,
      196.0, 196.0, 130.81, 196.0, 130.81, 196.0, 130.81, 196.0,
      196.0, 246.94, 196.0, 146.83, 196.0, 246.94, 196.0, 146.83,
      196.0, 196.0, 130.81, 196.0, 130.81, 196.0, 130.81, 196.0,
      174.61, 220.0, 196.0, 246.94, 130.81, 196.0, 130.81, 0
    ];
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.16;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playTone(freq, duration = 0.14, type = "square", volume = 0.25, delay = 0) {
    if (!freq) return;
    this.ensureContext();
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  startBGM() {
    this.ensureContext();
    if (this.isPlaying) return;
    this.isPlaying = true;
    const stepMs = 190;

    const tick = () => {
      if (!this.isPlaying) return;
      const idx = this.stepIndex % this.melody.length;
      const note = this.melody[idx];
      const bassNote = this.bass[idx];
      if (note > 0) this.playTone(note, 0.16, "square", 0.22);
      if (bassNote > 0) this.playTone(bassNote, 0.17, "triangle", 0.28);
      this.stepIndex++;
      this.loopTimer = setTimeout(tick, stepMs);
    };
    tick();
  }

  stopBGM() {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  toggleBGM() {
    if (this.isPlaying) {
      this.stopBGM();
      return false;
    }
    this.startBGM();
    return true;
  }

  // ---- Retro Sound Effects ----
  sfxCoin() {
    this.playTone(987.77, 0.08, "square", 0.3, 0);
    this.playTone(1318.51, 0.22, "square", 0.3, 0.07);
  }

  sfxThrow() {
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.14);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  sfxCatch() {
    this.playTone(523.25, 0.09, "square", 0.28, 0);
    this.playTone(659.25, 0.09, "square", 0.28, 0.08);
    this.playTone(783.99, 0.09, "square", 0.28, 0.16);
    this.playTone(1046.5, 0.28, "square", 0.32, 0.24);
  }

  sfxLevelUp() {
    const notes = [523.25, 587.33, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => this.playTone(n, 0.15, "square", 0.26, i * 0.085));
  }

  sfxOpen() {
    this.playTone(440, 0.09, "triangle", 0.25, 0);
    this.playTone(554.37, 0.09, "triangle", 0.25, 0.07);
    this.playTone(659.25, 0.18, "triangle", 0.28, 0.14);
  }

  sfxCat() {
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.linearRampToValueAtTime(860, now + 0.08);
    osc.frequency.linearRampToValueAtTime(540, now + 0.2);
    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  sfxLovePop(combo = 0) {
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];
    const freq = scale[combo % scale.length];
    this.playTone(freq, 0.13, "sine", 0.28, 0);
    this.playTone(freq * 1.5, 0.1, "triangle", 0.18, 0.04);
  }

  sfxBlow() {
    this.ensureContext();
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  sfxBirthdayFanfare() {
    const seq = [
      [392.0, 0], [392.0, 0.16], [440.0, 0.34], [392.0, 0.56],
      [523.25, 0.78], [493.88, 1.02], [523.25, 1.32], [659.25, 1.48], [783.99, 1.64]
    ];
    seq.forEach(([freq, delay]) => this.playTone(freq, 0.18, "square", 0.26, delay));
  }
}

window.pixelAudio = new PixelAudioEngine();

