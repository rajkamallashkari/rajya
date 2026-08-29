import { describe, expect, it } from "vitest";
import {
  base64urlToBuffer,
  bufferToBase64url,
  serializeAssertionCredential,
  serializeAttestationCredential,
} from "./webauthn";

function bytes(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer;
}

describe("webauthn helpers", () => {
  it("round-trips buffers including empty and padded payloads", () => {
    expect(bufferToBase64url(bytes(""))).toBe("");
    expect(new TextDecoder().decode(base64urlToBuffer(""))).toBe("");
    expect(new TextDecoder().decode(base64urlToBuffer(bufferToBase64url(bytes("a"))))).toBe("a");
    expect(new TextDecoder().decode(base64urlToBuffer(bufferToBase64url(bytes("aa"))))).toBe("aa");
    expect(new TextDecoder().decode(base64urlToBuffer(bufferToBase64url(bytes("aaa"))))).toBe(
      "aaa",
    );
  });

  it("serializes assertion and attestation credentials", () => {
    const assertion = {
      id: "cred",
      rawId: bytes("raw"),
      type: "public-key",
      response: {
        authenticatorData: bytes("ad"),
        clientDataJSON: bytes("cd"),
        signature: bytes("sig"),
        userHandle: bytes("uh"),
      },
    } as unknown as PublicKeyCredential;
    expect(serializeAssertionCredential(assertion)).toEqual({
      id: "cred",
      rawId: bufferToBase64url(bytes("raw")),
      type: "public-key",
      response: {
        authenticatorData: bufferToBase64url(bytes("ad")),
        clientDataJSON: bufferToBase64url(bytes("cd")),
        signature: bufferToBase64url(bytes("sig")),
        userHandle: bufferToBase64url(bytes("uh")),
      },
    });

    const assertionWithoutHandle = {
      ...assertion,
      response: { ...assertion.response, userHandle: null },
    } as unknown as PublicKeyCredential;
    expect(serializeAssertionCredential(assertionWithoutHandle).response.userHandle).toBeNull();

    const attestation = {
      id: "att",
      rawId: bytes("raw"),
      type: "public-key",
      response: {
        attestationObject: bytes("ao"),
        clientDataJSON: bytes("cd"),
      },
    } as unknown as PublicKeyCredential;
    expect(serializeAttestationCredential(attestation)).toEqual({
      id: "att",
      rawId: bufferToBase64url(bytes("raw")),
      type: "public-key",
      response: {
        attestationObject: bufferToBase64url(bytes("ao")),
        clientDataJSON: bufferToBase64url(bytes("cd")),
      },
    });
  });
});
