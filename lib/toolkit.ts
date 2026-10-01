import ReactNativeBlobUtil from "react-native-blob-util";

export const TOOLKIT_BUCKET = "toolkit";
export const TOOLKIT_FILE = "toolkit_compressed.pdf";

// Public URL — safe to ship to the client (EXPO_PUBLIC_).
export const TOOLKIT_URL = process.env.EXPO_PUBLIC_TOOLKIT_PDF_URL!;

// react-native-pdf source: fetch + on-device caching handled by the viewer.
export const toolkitSource = {
  uri: TOOLKIT_URL,
  cache: true,
};

let localSourcePromise: Promise<{ uri: string }> | null = null;

/**
 * A single on-device copy of the workbook, shared by every Pdf instance.
 *
 * The signed-out preview mounts one `singlePage` Pdf per visible page, and
 * react-native-pdf downloads + caches per instance — concurrent instances race
 * the same cache file. Downloading once here (memoised) sidesteps that and keeps
 * the PDF out of the repo per S07/S28.
 */
export function loadToolkitLocalSource(): Promise<{ uri: string }> {
  if (!localSourcePromise) {
    localSourcePromise = (async () => {
      const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${TOOLKIT_FILE}`;
      const exists = await ReactNativeBlobUtil.fs.exists(path);
      if (!exists) {
        const res = await ReactNativeBlobUtil.config({
          path,
          fileCache: true,
        }).fetch("GET", TOOLKIT_URL);
        if (!res.info().status || res.info().status >= 400) {
          throw new Error(`Toolkit fetch failed: ${res.info().status}`);
        }
      }
      return { uri: `file://${path}` };
    })().catch((e) => {
      // Allow a later retry rather than caching the failure forever.
      localSourcePromise = null;
      throw e;
    });
  }
  return localSourcePromise;
}

/** Drop the cached copy (used by an explicit reload/retry). */
export function resetToolkitLocalSource() {
  localSourcePromise = null;
}

// Optional helper if you ever need the raw bytes (e.g. share sheet).
export async function fetchToolkitPdf(): Promise<Blob> {
  const res = await fetch(TOOLKIT_URL);
  if (!res.ok) throw new Error(`Toolkit fetch failed: ${res.status}`);
  return res.blob();
}
