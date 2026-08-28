import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canvas2dContext,
  cssVar,
  displayPeaks,
  downsamplePeaks,
  drawWaveform,
  fillWaveformBar,
  formatVoiceDuration,
  selectVoicePeaks,
  shouldShowPreviewElapsed,
  stretchPeaks,
  voicePreviewDurationSec,
  voicePreviewProgress,
  waveformBarAmplitude,
  waveformBarCount,
  waveformBarPlayed,
  waveformBarWidthPx,
  waveformFillColors,
} from "./waveform";
import {
  WAVEFORM_BAR_COUNT,
  WAVEFORM_FALLBACK_BAR_WIDTH,
  WAVEFORM_FALLBACK_FILL,
  WAVEFORM_MIN_AMPLITUDE,
} from "./constants";

describe("downsamplePeaks", () => {
  it("handles empty, short, and long series", () => {
    expect(downsamplePeaks([])).toEqual([]);
    expect(downsamplePeaks([0.2, 1.4, -0.2])).toEqual([0.2, 1, 0]);
    const raw = Array.from({ length: WAVEFORM_BAR_COUNT * 2 }, (_, i) => (i % 2 === 0 ? 0.2 : 0.8));
    const down = downsamplePeaks(raw);
    expect(down).toHaveLength(WAVEFORM_BAR_COUNT);
    const sparse = [0.4, 0.8] as number[];
    sparse.length = WAVEFORM_BAR_COUNT * 2;
    expect(downsamplePeaks(sparse)).toHaveLength(WAVEFORM_BAR_COUNT);
  });
});

describe("displayPeaks", () => {
  it("always fills the bar count and applies the minimum amplitude", () => {
    expect(displayPeaks([])).toHaveLength(WAVEFORM_BAR_COUNT);
    expect(displayPeaks([])[0]).toBe(WAVEFORM_MIN_AMPLITUDE);
    expect(displayPeaks([0])).toEqual(
      Array.from({ length: WAVEFORM_BAR_COUNT }, () => WAVEFORM_MIN_AMPLITUDE),
    );
    const stretched = displayPeaks([0.2, 1]);
    expect(stretched).toHaveLength(WAVEFORM_BAR_COUNT);
    expect(stretched[0]).toBe(0.2);
    expect(stretched.at(-1)).toBe(1);
    const raw = Array.from({ length: WAVEFORM_BAR_COUNT * 2 }, (_, i) => (i % 2 === 0 ? 0.2 : 0.8));
    expect(displayPeaks(raw)).toHaveLength(WAVEFORM_BAR_COUNT);
    expect(stretchPeaks([], 3)).toEqual([
      WAVEFORM_MIN_AMPLITUDE,
      WAVEFORM_MIN_AMPLITUDE,
      WAVEFORM_MIN_AMPLITUDE,
    ]);
    const gapped: number[] = [];
    gapped[1] = 0.8;
    expect(stretchPeaks(gapped, 3)[0]).toBe(0);
    const trailing: number[] = [0.2];
    trailing.length = 3;
    expect(stretchPeaks(trailing, 4).at(-1)).toBe(0);
  });
});

describe("selectVoicePeaks", () => {
  it("prefers final peaks when present", () => {
    expect(selectVoicePeaks([0.4], [0.1])).toEqual([0.4]);
    expect(selectVoicePeaks([], [0.1])).toEqual([0.1]);
  });
});

describe("formatVoiceDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatVoiceDuration(-10)).toBe("0:00");
    expect(formatVoiceDuration(0)).toBe("0:00");
    expect(formatVoiceDuration(4_200)).toBe("0:04");
    expect(formatVoiceDuration(65_000)).toBe("1:05");
  });
});

describe("voice preview clock helpers", () => {
  it("falls back to wall-clock duration and clamps progress", () => {
    expect(voicePreviewDurationSec(Number.POSITIVE_INFINITY, 4_200)).toBe(4.2);
    expect(voicePreviewDurationSec(0, 1_000)).toBe(1);
    expect(voicePreviewDurationSec(8, 1_000)).toBe(8);
    expect(voicePreviewProgress("recording", 4, 8)).toBe(0);
    expect(voicePreviewProgress("paused", 4, 0)).toBe(0);
    expect(voicePreviewProgress("paused", -1, 8)).toBe(0);
    expect(voicePreviewProgress("paused", 12, 8)).toBe(1);
    expect(voicePreviewProgress("paused", 2, 8)).toBe(0.25);
    expect(shouldShowPreviewElapsed(false, 0)).toBe(false);
    expect(shouldShowPreviewElapsed(true, 0)).toBe(true);
    expect(shouldShowPreviewElapsed(false, 1)).toBe(true);
  });
});

describe("waveform canvas helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 1 });
  });

  it("reads CSS variables, bar metrics, colours, and amplitudes", () => {
    const el = document.createElement("div");
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      getPropertyValue: (name: string) => {
        if (name === "--accent") {
          return " rgb(79, 70, 229) ";
        }
        if (name === "--waveform-idle") {
          return "#888888";
        }
        if (name === "--waveform-bar-width") {
          return "3px";
        }
        return "";
      },
    } as unknown as CSSStyleDeclaration);
    expect(cssVar(el, "--missing", "fallback")).toBe("fallback");
    expect(cssVar(el, "--accent", "x")).toBe("rgb(79, 70, 229)");
    expect(waveformBarWidthPx(el)).toBe(3);
    expect(waveformFillColors(el)).toEqual({
      idle: "#888888",
      played: "rgb(79, 70, 229)",
    });
    expect(waveformBarCount(0, 2, 2)).toBe(0);
    expect(waveformBarCount(10, 0, 0)).toBe(0);
    expect(waveformBarCount(10, 2, 2)).toBe(2);
    expect(waveformBarAmplitude([], 0, 4, WAVEFORM_MIN_AMPLITUDE)).toBe(WAVEFORM_MIN_AMPLITUDE);
    expect(waveformBarAmplitude([0.5], 0, 0, WAVEFORM_MIN_AMPLITUDE)).toBe(WAVEFORM_MIN_AMPLITUDE);
    const hole: number[] = [];
    hole.length = 2;
    hole[1] = 0.9;
    expect(waveformBarAmplitude(hole, 0, 2, WAVEFORM_MIN_AMPLITUDE)).toBe(WAVEFORM_MIN_AMPLITUDE);
    expect(waveformBarAmplitude([0.4, 0.8], 1, 2, WAVEFORM_MIN_AMPLITUDE)).toBe(0.8);
    expect(waveformBarPlayed(0, 4, 0)).toBe(false);
    expect(waveformBarPlayed(0, 0, 0.5)).toBe(false);
    expect(waveformBarPlayed(0, 4, 0.5)).toBe(true);
    expect(waveformBarPlayed(3, 4, 0.5)).toBe(false);
  });

  it("falls back when bar width is missing or invalid", () => {
    const el = document.createElement("div");
    const values = ["", "nope", "0", "-2"];
    for (const value of values) {
      vi.spyOn(window, "getComputedStyle").mockReturnValue({
        getPropertyValue: () => value,
      } as unknown as CSSStyleDeclaration);
      expect(waveformBarWidthPx(el)).toBe(WAVEFORM_FALLBACK_BAR_WIDTH);
      vi.restoreAllMocks();
    }
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      getPropertyValue: () => "",
    } as unknown as CSSStyleDeclaration);
    expect(waveformFillColors(el)).toEqual({
      idle: WAVEFORM_FALLBACK_FILL,
      played: WAVEFORM_FALLBACK_FILL,
    });
  });

  it("fills rounded bars when roundRect exists and rectangles otherwise", () => {
    const rounded = {
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    fillWaveformBar(rounded, 1, 2, 3, 4);
    expect(rounded.roundRect).toHaveBeenCalledWith(1, 2, 3, 4, 1.5);
    expect(rounded.fill).toHaveBeenCalled();
    const squared = {
      beginPath: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    fillWaveformBar(squared, 1, 2, 3, 4);
    expect(squared.fillRect).toHaveBeenCalledWith(1, 2, 3, 4);
  });

  it("draws peaks onto a canvas and no-ops on missing context or size", () => {
    const ctx = {
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      setTransform: vi.fn(),
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D;
    const canvas = document.createElement("canvas");
    Object.defineProperty(canvas, "clientWidth", { configurable: true, value: 200 });
    Object.defineProperty(canvas, "clientHeight", { configurable: true, value: 32 });
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx);
    drawWaveform(canvas, [0.2, 0.9, 0.4], { progress: 0.5 });
    expect(ctx.setTransform).toHaveBeenCalled();
    expect(ctx.clearRect).toHaveBeenCalled();
    expect(ctx.roundRect).toHaveBeenCalled();
    canvas.width = 200;
    canvas.height = 32;
    drawWaveform(canvas, []);
    expect(ctx.clearRect).toHaveBeenCalledTimes(2);

    const squared = {
      beginPath: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      setTransform: vi.fn(),
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D;
    const squareCanvas = document.createElement("canvas");
    Object.defineProperty(squareCanvas, "clientWidth", { configurable: true, value: 80 });
    Object.defineProperty(squareCanvas, "clientHeight", { configurable: true, value: 32 });
    squareCanvas.width = 80;
    squareCanvas.height = 0;
    vi.spyOn(squareCanvas, "getContext").mockReturnValue(squared);
    drawWaveform(squareCanvas, [0.5]);
    expect(squared.fillRect).toHaveBeenCalled();

    Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 0 });
    const dprCanvas = document.createElement("canvas");
    Object.defineProperty(dprCanvas, "clientWidth", { configurable: true, value: 40 });
    Object.defineProperty(dprCanvas, "clientHeight", { configurable: true, value: 32 });
    dprCanvas.width = 40;
    dprCanvas.height = 32;
    vi.spyOn(dprCanvas, "getContext").mockReturnValue(ctx);
    drawWaveform(dprCanvas, [0.5]);

    const empty = document.createElement("canvas");
    vi.spyOn(empty, "getContext").mockReturnValue(null);
    drawWaveform(empty, [0.5]);
    const throwing = document.createElement("canvas");
    vi.spyOn(throwing, "getContext").mockImplementation(() => {
      throw new Error("no canvas");
    });
    drawWaveform(throwing, [0.5]);
    expect(canvas2dContext(throwing)).toBeNull();

    const zeroWidth = document.createElement("canvas");
    Object.defineProperty(zeroWidth, "clientWidth", { configurable: true, value: 0 });
    Object.defineProperty(zeroWidth, "clientHeight", { configurable: true, value: 32 });
    drawWaveform(zeroWidth, [0.5]);
    const zeroHeight = document.createElement("canvas");
    Object.defineProperty(zeroHeight, "clientWidth", { configurable: true, value: 32 });
    Object.defineProperty(zeroHeight, "clientHeight", { configurable: true, value: 0 });
    drawWaveform(zeroHeight, [0.5]);
  });
});
