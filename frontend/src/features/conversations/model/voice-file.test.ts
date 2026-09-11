import { describe, expect, it } from "vitest";
import { voiceContentType, voiceExtensionForMime, voiceFileFromBlob } from "./voice-file";

describe("voiceFileFromBlob", () => {
  it("picks an extension from the mime type", () => {
    expect(voiceExtensionForMime("audio/mp4")).toBe("m4a");
    expect(voiceExtensionForMime("audio/ogg;codecs=opus")).toBe("ogg");
    expect(voiceExtensionForMime("audio/webm")).toBe("weba");
  });

  it("strips MediaRecorder codec parameters for disk PUT", () => {
    expect(voiceContentType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(voiceContentType("audio/mp4;codecs=aac")).toBe("audio/mp4");
    expect(voiceContentType("")).toBe("audio/webm");
  });

  it("builds a File with the voice mime type", () => {
    const file = voiceFileFromBlob(new Blob(["x"], { type: "audio/webm;codecs=opus" }), "audio/webm;codecs=opus");
    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe("audio/webm");
    expect(file.name.endsWith(".weba")).toBe(true);
  });

  it("falls back to the blob type and then to webm", () => {
    expect(voiceFileFromBlob(new Blob(["x"], { type: "audio/ogg" }), "").type).toBe("audio/ogg");
    expect(voiceFileFromBlob(new Blob(["x"]), "").type).toBe("audio/webm");
  });
});
