import { describe, expect, it } from "vitest";
import { urlBase64ToUint8Array } from "./vapid";

describe("vapid key decode", () => {
  it("decodes URL-safe base64 with and without padding" , () => {
    expect(Array.from(urlBase64ToUint8Array("YQ"))).toEqual([ 97 ]);
    expect(Array.from(urlBase64ToUint8Array("YWI"))).toEqual([ 97, 98 ]);
    expect(Array.from(urlBase64ToUint8Array("AQID"))).toEqual([ 1, 2, 3 ]);
  });
});
