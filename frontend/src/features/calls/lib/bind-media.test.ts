import { describe, expect, it, vi } from "vitest";
import { bindAudioElement, bindVideoElement } from "./bind-media";

function stream(): MediaStream {
  return { id: "s" } as MediaStream;
}

describe("bind-media", () => {
  it("skips missing elements and attaches live media", () => {
    bindVideoElement(null, null, true);
    bindAudioElement(null, stream(), 1, vi.fn());
    const video = document.createElement("video");
    video.play = vi.fn(async () => {
      throw new Error("autoplay");
    });
    bindVideoElement(video, stream(), true);
    bindVideoElement(video, null, false);
    expect(video.play).toHaveBeenCalled();
    const audio = document.createElement("audio");
    audio.play = vi.fn(async () => {
      throw new Error("autoplay");
    });
    const applyOutput = vi.fn();
    const first = stream();
    bindAudioElement(audio, first, 0.4, applyOutput);
    expect(applyOutput).toHaveBeenCalledWith(audio);
    expect(audio.volume).toBe(0.4);
    bindAudioElement(audio, first, 0.2, applyOutput);
    expect(applyOutput).toHaveBeenCalledTimes(1);
    expect(audio.volume).toBe(0.2);
  });
});
