import { describe, expect, it, vi } from "vite-plus/test";

import { chartChunkUrlFrom, createChartsLoader } from "./charts-loader";

const ORIGIN = "https://trytanstackdb.com";
/** Where this module ends up once built: a chunk in the assets folder. */
const MODULE_URL = `${ORIGIN}/assets/lazy-charts-B1x9.js`;
const CHUNK_URL = `${ORIGIN}/assets/charts-GJvtBBTf.js`;

const chromium = (url: string) =>
  new TypeError(`Failed to fetch dynamically imported module: ${url}`);
const firefox = (url: string) => new TypeError(`error loading dynamically imported module: ${url}`);

describe("chartChunkUrlFrom", () => {
  it("finds the chart chunk a failed import names (Chromium, Firefox)", () => {
    expect(chartChunkUrlFrom(chromium(CHUNK_URL), MODULE_URL, ORIGIN)).toBe(CHUNK_URL);
    expect(chartChunkUrlFrom(firefox(CHUNK_URL), MODULE_URL, ORIGIN)).toBe(CHUNK_URL);
    // Dev: the source module, next to this one, maybe with Vite's timestamp.
    expect(
      chartChunkUrlFrom(
        chromium("http://pop-os:5179/src/components/notes/charts.tsx?t=1730730000"),
        "http://pop-os:5179/src/components/notes/lazy-charts.tsx",
        "http://pop-os:5179",
      ),
    ).toBe("http://pop-os:5179/src/components/notes/charts.tsx");
  });

  it("rejects another origin", () => {
    expect(
      chartChunkUrlFrom(chromium("https://attacker.example/evil.js"), MODULE_URL, ORIGIN),
    ).toBeNull();
    expect(
      chartChunkUrlFrom(
        chromium("https://attacker.example/assets/charts-GJvtBBTf.js"),
        MODULE_URL,
        ORIGIN,
      ),
    ).toBeNull();
  });

  it("rejects same-origin scripts that aren't the chart chunk", () => {
    for (const path of [
      "/uploads/payload.js",
      "/uploads/charts-GJvtBBTf.js",
      "/assets/payload.js",
      "/assets/sub/charts-GJvtBBTf.js",
      "/assets/../uploads/charts-x.js",
      "/assets/charts-GJvtBBTf.js.map",
    ]) {
      expect(chartChunkUrlFrom(chromium(`${ORIGIN}${path}`), MODULE_URL, ORIGIN), path).toBeNull();
    }
  });

  it("ignores errors that aren't failed imports, even if they mention the chunk", () => {
    expect(
      chartChunkUrlFrom(new TypeError("Importing a module script failed."), MODULE_URL, ORIGIN),
    ).toBeNull();
    expect(
      chartChunkUrlFrom(
        new TypeError(`x is not a function (${CHUNK_URL}:1:20)`),
        MODULE_URL,
        ORIGIN,
      ),
    ).toBeNull();
    expect(chartChunkUrlFrom(chromium("not a url"), MODULE_URL, ORIGIN)).toBeNull();
  });
});

describe("createChartsLoader", () => {
  function setup(firstError: unknown) {
    const module = { name: "charts" };
    const importModule = vi.fn().mockRejectedValueOnce(firstError).mockResolvedValue(module);
    const importUrl = vi.fn().mockResolvedValue(module);
    const load = createChartsLoader({
      importModule,
      importUrl,
      chunkUrlFrom: (error) => chartChunkUrlFrom(error, MODULE_URL, ORIGIN),
    });
    return { module, importModule, importUrl, load };
  }

  it("imports once for charts loading at the same time, and once per retry", async () => {
    const { module, importModule, importUrl, load } = setup(chromium(CHUNK_URL));
    const first = [load(), load(), load()];
    expect(importModule).toHaveBeenCalledTimes(1);
    for (const attempt of first) await expect(attempt).rejects.toThrow(CHUNK_URL);

    // Every chart retries at once: one import, of the chunk under a new URL.
    const retried = [load(), load(), load()];
    expect(await Promise.all(retried)).toEqual([module, module, module]);
    expect(importUrl.mock.calls).toEqual([[`${CHUNK_URL}?retry=1`]]);
    expect(importModule).toHaveBeenCalledTimes(1);

    // Loaded: no more imports.
    expect(await load()).toBe(module);
    expect(importUrl).toHaveBeenCalledTimes(1);
  });

  it("counts retries up while they keep failing", async () => {
    const { importUrl, load } = setup(chromium(CHUNK_URL));
    await expect(load()).rejects.toThrow();
    importUrl.mockRejectedValueOnce(chromium(`${CHUNK_URL}?retry=1`));
    await expect(load()).rejects.toThrow();
    await load();
    expect(importUrl.mock.calls).toEqual([[`${CHUNK_URL}?retry=1`], [`${CHUNK_URL}?retry=2`]]);
  });

  it("retries the normal way when the error names no chunk, or the wrong one", async () => {
    for (const error of [
      new TypeError("Importing a module script failed."),
      chromium("https://attacker.example/evil.js"),
      chromium(`${ORIGIN}/uploads/payload.js`),
    ]) {
      const { module, importModule, importUrl, load } = setup(error);
      await expect(load()).rejects.toBe(error);
      expect(await load()).toBe(module);
      expect(importModule).toHaveBeenCalledTimes(2);
      expect(importUrl).not.toHaveBeenCalled();
    }
  });
});
