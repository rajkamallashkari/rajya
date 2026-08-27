import { describe, expect, it } from "vitest";
import { loadCatalog } from "./catalog";
import en from "./en.json";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe("loadCatalog", () => {
  it("returns bundled catalog when there is no fetcher", async () => {
    await expect(loadCatalog({ version: "1" })).resolves.toEqual(en);
    await expect(
      loadCatalog({
        version: "1",
        storage: { getItem: () => null, setItem: () => undefined },
      }),
    ).resolves.toEqual(en);
  });

  it("returns a valid cached catalog", async () => {
    const storage = new Map<string, string>();
    storage.set("rajya:i18n:1:en", JSON.stringify(en));
    const catalog = await loadCatalog({
      version: "1",
      storage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      },
    });
    expect(catalog.app.tagline).toBe(en.app.tagline);
  });

  it("ignores broken cache and failed fetches", async () => {
    const storage = {
      getItem: () => "{not json",
      setItem: () => undefined,
    };
    await expect(
      loadCatalog({ version: "1", storage, fetcher: async () => jsonResponse(en, false) }),
    ).resolves.toEqual(en);
    await expect(
      loadCatalog({ version: "1", fetcher: async () => jsonResponse({ nope: true }) }),
    ).resolves.toEqual(en);
    await expect(
      loadCatalog({ version: "1", fetcher: async () => jsonResponse([]) }),
    ).resolves.toEqual(en);
    await expect(
      loadCatalog({ version: "1", fetcher: async () => jsonResponse(null) }),
    ).resolves.toEqual(en);
    await expect(
      loadCatalog({
        version: "1",
        fetcher: async () => {
          throw new Error("network");
        },
      }),
    ).resolves.toEqual(en);
  });

  it("persists a fetched catalog", async () => {
    const store: Record<string, string> = {};
    const catalog = await loadCatalog({
      version: "9",
      locale: "en",
      fetcher: async () => jsonResponse(en),
      storage: {
        getItem: (key) => store[key] ?? null,
        setItem: (key, value) => {
          store[key] = value;
        },
      },
    });
    expect(catalog).toEqual(en);
    expect(Object.values(store)[0]).toContain("tagline");
    await expect(
      loadCatalog({ version: "9", fetcher: async () => jsonResponse(en) }),
    ).resolves.toEqual(en);
    await expect(loadCatalog({ version: "1", bundled: en })).resolves.toEqual(en);
  });

  it("rejects cached payloads that are not catalogs", async () => {
    const storage = {
      getItem: () => JSON.stringify({ brand: 1 }),
      setItem: () => undefined,
    };
    await expect(loadCatalog({ version: "1", storage })).resolves.toEqual(en);
    await expect(
      loadCatalog({
        version: "1",
        storage: { getItem: () => "[]", setItem: () => undefined },
      }),
    ).resolves.toEqual(en);
    await expect(
      loadCatalog({
        version: "1",
        storage: { getItem: () => "null", setItem: () => undefined },
      }),
    ).resolves.toEqual(en);
    await expect(
      loadCatalog({
        version: "1",
        storage: { getItem: () => "1", setItem: () => undefined },
      }),
    ).resolves.toEqual(en);
    await expect(
      loadCatalog({
        version: "1",
        storage: {
          getItem: () => JSON.stringify({ brand: null, app: {}, errors: {} }),
          setItem: () => undefined,
        },
      }),
    ).resolves.toEqual(en);
    await expect(
      loadCatalog({
        version: "1",
        storage: {
          getItem: () => JSON.stringify({ brand: {}, app: null, errors: {} }),
          setItem: () => undefined,
        },
      }),
    ).resolves.toEqual(en);
    await expect(
      loadCatalog({
        version: "1",
        storage: {
          getItem: () => JSON.stringify({ brand: {}, app: {}, errors: null }),
          setItem: () => undefined,
        },
      }),
    ).resolves.toEqual(en);
  });
});
