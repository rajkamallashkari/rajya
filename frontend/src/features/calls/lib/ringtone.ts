import {
  CALL_RINGTONE_ATTACK_S,
  CALL_RINGTONE_DECAY_S,
  CALL_RINGTONE_FREQ_A,
  CALL_RINGTONE_FREQ_B,
  CALL_RINGTONE_GAIN,
  CALL_RINGTONE_GAIN_FLOOR,
  CALL_RINGTONE_INTERVAL_MS,
  CALL_RINGTONE_STAGGER_S,
  CALL_RINGTONE_STOP_S,
} from "@/features/calls/model/constants";

let ctx: AudioContext | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let oscillators: OscillatorNode[] = [];

function playTonePair(audioCtx: AudioContext): void {
  const now = audioCtx.currentTime;
  [CALL_RINGTONE_FREQ_A, CALL_RINGTONE_FREQ_B].forEach((freq, index) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(CALL_RINGTONE_GAIN_FLOOR, now);
    gain.gain.exponentialRampToValueAtTime(CALL_RINGTONE_GAIN, now + CALL_RINGTONE_ATTACK_S);
    gain.gain.exponentialRampToValueAtTime(CALL_RINGTONE_GAIN_FLOOR, now + CALL_RINGTONE_DECAY_S);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + index * CALL_RINGTONE_STAGGER_S);
    osc.stop(now + CALL_RINGTONE_STOP_S);
    oscillators.push(osc);
  });
}

export function startRingtone(): void {
  stopRingtone();
  try {
    ctx = new AudioContext();
    playTonePair(ctx);
    intervalId = setInterval(() => {
      if (ctx) {
        playTonePair(ctx);
      }
    }, CALL_RINGTONE_INTERVAL_MS);
  } catch {
    return;
  }
}

export function stopRingtone(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  oscillators.forEach((osc) => {
    try {
      osc.stop();
    } catch {
      return;
    }
  });
  oscillators = [];
  if (ctx) {
    void ctx.close();
    ctx = null;
  }
}
