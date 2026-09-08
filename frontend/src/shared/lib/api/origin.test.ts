import { describe, expect, it } from "vitest";
import { apiOrigin, cableHttpToWs } from "./origin";

describe("api origin", () => {
  it("uses the page origin unless VITE_API_ORIGIN is set", () => {
    expect(apiOrigin()).toBe(window.location.origin);
    expect(apiOrigin({}, "http://localhost:4173")).toBe("http://localhost:4173");
    expect(apiOrigin({ VITE_API_ORIGIN: "https://api.example/" }, "http://localhost:4173")).toBe(
      "https://api.example",
    );
    expect(apiOrigin({}, "http://localhost:5173")).toBe("http://localhost:5173");
    expect(apiOrigin({}, "http://127.0.0.1:5173")).toBe("http://127.0.0.1:5173");
    expect(cableHttpToWs("https://api.example")).toBe("wss://api.example");
    expect(cableHttpToWs("http://localhost:3000")).toBe("ws://localhost:3000");
  });
});
