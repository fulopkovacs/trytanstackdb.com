/*
 * Loads the chart module, with retries that work in real browsers.
 *
 * Browsers remember a module URL whose fetch failed, and fail every later
 * import() of it at once. So a retry asks for the same chunk under a new
 * URL, with a `?retry=` query. The URL comes from the import error's message
 * (Chromium and Firefox name it), and it's only used if it really is the
 * chart chunk: same origin, same directory as this module (the build's
 * assets, or the source folder in dev) and named like the chunk. Anything
 * else, or a message without a URL, retries with the plain import.
 */

/** "Failed to fetch dynamically imported module: <url>" (Chromium), "error loading dynamically imported module: <url>" (Firefox). */
const IMPORT_FAILURE = /dynamically imported module:\s*(\S+)/i;

/** The chart chunk's file name: `charts-<hash>.js` once built, `charts.tsx` in dev. */
const CHART_CHUNK = /^charts(-[\w-]+)?\.(js|tsx)$/;

/**
 * The chart chunk a failed import names, without its query, or `null` if
 * the error doesn't name one: `moduleUrl` is this module's own URL
 * (`import.meta.url`), `origin` the page's.
 */
export function chartChunkUrlFrom(
  error: unknown,
  moduleUrl: string,
  origin: string,
): string | null {
  const message = error instanceof Error ? error.message : String(error);
  const named = IMPORT_FAILURE.exec(message)?.[1];
  if (!named || !URL.canParse(named) || !URL.canParse(moduleUrl)) return null;
  const url = new URL(named);
  const here = new URL(moduleUrl);
  if (url.origin !== origin || here.origin !== origin) return null;
  const directory = here.pathname.slice(0, here.pathname.lastIndexOf("/") + 1);
  if (!url.pathname.startsWith(directory)) return null;
  if (!CHART_CHUNK.test(url.pathname.slice(directory.length))) return null;
  return url.origin + url.pathname;
}

export interface ChartsLoaderOptions<TModule> {
  /** The normal import, `() => import("./charts")`. */
  importModule: () => Promise<TModule>;
  /** An import of an exact URL, for retries under a new URL. */
  importUrl: (url: string) => Promise<TModule>;
  /** The chunk URL a failed import names (see `chartChunkUrlFrom`), or `null`. */
  chunkUrlFrom: (error: unknown) => string | null;
}

/**
 * A `load()` that imports the module once, however many charts ask at the
 * same time. A failed import is forgotten, so the next `load()` tries again:
 * under a new URL if the failure named the chart chunk, otherwise the
 * normal way.
 */
export function createChartsLoader<TModule>({
  importModule,
  importUrl,
  chunkUrlFrom,
}: ChartsLoaderOptions<TModule>): () => Promise<TModule> {
  let pending: Promise<TModule> | null = null;
  let failedUrl: string | null = null;
  let retries = 0;
  return () => {
    pending ??= (failedUrl ? importUrl(`${failedUrl}?retry=${++retries}`) : importModule()).catch(
      (error: unknown) => {
        pending = null;
        failedUrl ??= chunkUrlFrom(error);
        throw error;
      },
    );
    return pending;
  };
}
