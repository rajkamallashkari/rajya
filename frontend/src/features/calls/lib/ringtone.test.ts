import { afterEach, describe, expect, it, vi } from "vitest";
import { startRingtone, stopRingtone } from "./ringtone";

class FakeOscillator {
  public type = "";
  public frequency = { value: 0 };
  public connect = vi.fn();
  public start = vi.fn();
  public stop = vi.fn(() => {
    if (this.frequency.value < 0) {
      throw new Error("stopped");
    }
  });
}

class FakeGain {
  public gain = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
  public connect = vi.fn();
}

class FakeAudioContext {
  public currentTime = 0;
  public destination = {};
  public close = vi.fn(async () => undefined);
  public createOscillator(): FakeOscillator {
    return new FakeOscillator();
  }
  public createGain(): FakeGain {
    return new FakeGain();
  }
}

describe("ringtone", () => {
  afterEach(() => {
    stopRingtone();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("plays repeating tones and stops them", () => {
    vi.useFakeTimers();
    vi.stubGlobal("AudioContext", FakeAudioContext);
    startRingtone();
    vi.advanceTimersByTime(2000);
    stopRingtone();
    startRingtone();
    stopRingtone();
  });

  it("swallows AudioContext and oscillator failures", () => {
    vi.stubGlobal("AudioContext", class {
      constructor() {
        throw new Error("blocked");
      }
    });
    expect(() => startRingtone()).not.toThrow();
    vi.stubGlobal("AudioContext", class extends FakeAudioContext {
      public createOscillator(): FakeOscillator {
        const osc = new FakeOscillator();
        osc.stop = vi.fn((when?: number) => {
          if (when === undefined) {
            throw new Error("stopped");
          }
        });
        return osc;
      }
    });
    startRingtone();
    expect(() => stopRingtone()).not.toThrow();
  });
});
