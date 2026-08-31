import { describe, expect, it } from "vitest";
import { md5Base64 } from "./checksum";

describe("md5Base64", () => {
  it("matches ActiveStorage checksums", () => {
    expect(md5Base64(new TextEncoder().encode("").buffer)).toBe("1B2M2Y8AsgTpgAmY7PhCfg==");
    expect(md5Base64(new TextEncoder().encode("hello").buffer)).toBe("XUFAKrxLKna5cZ2REBfFkg==");
  });
});
