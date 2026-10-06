import { Platform, Share } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import {
  getCheckins,
  getCustomStrategies,
  getFavourites,
  getJournalEntries,
  getSafeSpaceNotes,
} from "./db";

/**
 * User-facing data export (M3-09 / M4-07) — technical-spec §3.9.
 *
 * Rules from the spec: user-initiated only (no scheduled/automatic exports),
 * generated and saved **locally** — no cloud upload, no email, no server call —
 * plain text, no password protection, and the app keeps no copy.
 *
 * Column sets follow the spec's intent but map to what the app actually
 * stores (the spec's sample columns assume a wider schema than `supabase/schema.sql`
 * has — e.g. trigger logs have no "Where/Environment/Intensity" fields). The
 * mapping is recorded in the changelog and shown on the export screen so the
 * user knows what they are getting.
 *
 * Note: this is the **user's own copy** of their data. It is a different thing
 * from the research export (S27), which is CLI-only and excludes free text.
 */

export type ExportKind = "diary" | "triggers" | "portfolio";

export interface ExportDataset {
  kind: ExportKind;
  label: string;
  fileStem: string;
  columns: string[];
  rows: string[][];
}

/** RFC 4180 escaping — quote only when needed, double any embedded quotes. */
function csvField(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(columns: string[], rows: string[][]): string {
  const lines = [columns.map(csvField).join(",")];
  for (const row of rows) lines.push(row.map(csvField).join(","));
  // Trailing newline so spreadsheet apps treat the last row as a record.
  return `${lines.join("\r\n")}\r\n`;
}

const isoDate = (v: string | null | undefined) => (v ? new Date(v).toISOString() : "");

async function buildDiary(): Promise<ExportDataset> {
  const entries = await getJournalEntries();
  return {
    kind: "diary",
    label: "Diary entries",
    fileStem: "diary",
    columns: ["created_at", "prompt", "body", "tags"],
    rows: (entries ?? []).map((e: any) => [
      isoDate(e.created_at),
      e.prompts?.prompt_text ?? "",
      e.body ?? "",
      (e.journal_entry_tags ?? []).map((t: any) => t.tags?.name ?? "").filter(Boolean).join("; "),
    ]),
  };
}

async function buildTriggers(): Promise<ExportDataset> {
  const checkins = await getCheckins();
  return {
    kind: "triggers",
    label: "Trigger logs",
    fileStem: "triggers",
    columns: ["created_at", "trigger", "nervous_system_state", "survival_response", "note"],
    rows: (checkins ?? []).map((r: any) => [
      isoDate(r.created_at),
      (r.triggers ?? []).join("; "),
      r.ns_state ?? "",
      r.survival_response ?? "",
      r.note ?? "",
    ]),
  };
}

async function buildPortfolio(): Promise<ExportDataset> {
  const [favourites, notes, strategies] = await Promise.all([
    getFavourites(),
    getSafeSpaceNotes(),
    getCustomStrategies(),
  ]);
  const rows: string[][] = [
    ...(favourites ?? []).map((f: any) => [
      "favourite",
      f.exercises?.title ?? "",
      f.exercises?.category ?? "",
      "",
      isoDate(f.created_at),
    ]),
    ...(notes ?? []).map((n: any) => ["safe_space_note", "", "", n.body ?? "", isoDate(n.created_at)]),
    ...(strategies ?? []).map((s: any) => [
      "custom_strategy",
      s.title ?? "",
      "",
      s.body ?? "",
      isoDate(s.created_at),
    ]),
  ];
  return {
    kind: "portfolio",
    label: "Portfolio",
    fileStem: "portfolio",
    columns: ["kind", "name", "category", "detail", "created_at"],
    rows,
  };
}

export async function buildExport(kind: ExportKind): Promise<ExportDataset> {
  if (kind === "diary") return buildDiary();
  if (kind === "triggers") return buildTriggers();
  return buildPortfolio();
}

/**
 * Write a CSV to the device and hand it to the system.
 *
 * Android: Downloads folder (spec §3.9 "saved to the user's device").
 * iOS has no shared Downloads folder, so it goes to the app Documents
 * directory and the share sheet lets the user file it wherever they like.
 */
export async function saveCsvFile(fileStem: string, csv: string): Promise<string> {
  const dirs = ReactNativeBlobUtil.fs.dirs;
  const dir = (Platform.OS === "android" ? dirs.DownloadDir : undefined) ?? dirs.DocumentDir;
  if (!dir) throw new Error("No writable folder available on this device");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const path = `${dir}/calmanchor-${fileStem}-${stamp}.csv`;
  await ReactNativeBlobUtil.fs.writeFile(path, csv, "utf8");
  return path;
}

/** Open the file in the platform's viewer / share sheet. Falls back to Share. */
export async function openExportedFile(path: string, label: string): Promise<void> {
  try {
    if (Platform.OS === "ios") {
      await (ReactNativeBlobUtil as any).ios?.openDocument?.(path);
      return;
    }
    await (ReactNativeBlobUtil as any).android?.actionViewIntent?.(path, "text/csv");
  } catch {
    // Fall through to the share sheet if the platform opener is unavailable.
  }
  await Share.share({
    title: `Calm Anchor ${label}`,
    message: Platform.OS === "android" ? `Calm Anchor ${label} — ${path}` : "",
    url: Platform.OS === "ios" ? `file://${path}` : undefined,
  } as never);
}
