function padBase64(base64: string): string {
  const remainder = base64.length % 4;
  if (remainder === 0) {
    return base64;
  }
  return `${base64}${"=".repeat(4 - remainder)}`;
}

export function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = padBase64(base64url.replace(/-/g, "+").replace(/_/g, "/"));
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export interface SerializedAssertion {
  id: string;
  rawId: string;
  response: {
    authenticatorData: string;
    clientDataJSON: string;
    signature: string;
    userHandle: string | null;
  };
  type: string;
  [key: string]: unknown;
}

export function serializeAssertionCredential(credential: PublicKeyCredential): SerializedAssertion {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: bufferToBase64url(response.authenticatorData),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      signature: bufferToBase64url(response.signature),
      userHandle: response.userHandle ? bufferToBase64url(response.userHandle) : null,
    },
  };
}

export interface SerializedAttestation {
  id: string;
  rawId: string;
  response: {
    attestationObject: string;
    clientDataJSON: string;
  };
  type: string;
  [key: string]: unknown;
}

export const WEBAUTHN_ES256_ALG = -7;

export function toCreationPublicKey(
  options: { challenge: string } & Record<string, unknown>,
): PublicKeyCredentialCreationOptions {
  const user = options.user as { id?: string; name?: string; displayName?: string } | undefined;
  const rp = options.rp as PublicKeyCredentialRpEntity | undefined;
  if (!user?.id || !user.name || !user.displayName || !rp) {
    throw new Error("registration_options_incomplete");
  }
  const exclude = (options.excludeCredentials as { type?: string; id: string }[] | undefined) ?? [];
  return {
    challenge: base64urlToBuffer(options.challenge),
    rp,
    user: {
      id: base64urlToBuffer(user.id),
      name: user.name,
      displayName: user.displayName,
    },
    pubKeyCredParams: (options.pubKeyCredParams as PublicKeyCredentialParameters[] | undefined) ?? [
      { type: "public-key", alg: WEBAUTHN_ES256_ALG },
    ],
    excludeCredentials: exclude.map((entry) => ({
      type: (entry.type ?? "public-key") as PublicKeyCredentialType,
      id: base64urlToBuffer(entry.id),
    })),
  };
}

export function serializeAttestationCredential(
  credential: PublicKeyCredential,
): SerializedAttestation {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      attestationObject: bufferToBase64url(response.attestationObject),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
    },
  };
}
