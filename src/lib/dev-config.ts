/**
 * How long the note editor waits after the last change before it saves.
 * Dev builds can change it from the page URL, `?saveDelay=<ms>` (see
 * `api/dev-console.ts`), to make the wait long enough for scripted tests.
 */
export let editorSaveDelayMs = 500;

export function setEditorSaveDelay(ms: number) {
  editorSaveDelayMs = ms;
}
