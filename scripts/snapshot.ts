import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";

export type Snapshot = {
  version: 1;
  sourceDate: string;
  sourceCommit: string;
  materialHash: string;
  csv: string;
  diffs: Array<{ date: string; diff: any }>;
  weeklyReports: any[];
};

export const SNAPSHOT_PATH = path.resolve("data/source.snapshot.json.gz");
function validateCsv(csv: string) {
  const required = ["Organisation Name", "Town/City", "County", "Type & Rating", "Route"];
  let field = "", row: string[] = [], header: string[] | null = null;
  let quoted = false, count = 0;
  const companies = new Set<string>();
  const finishRow = () => {
    row.push(field); field = "";
    if (row.some(value => value.length)) {
      if (!header) {
        header = row.map(value => value.trim());
        if (required.some(name => !header!.includes(name))) throw new Error("Incomplete sponsor CSV columns");
      } else {
        if (row.length !== header.length || !row[header.indexOf("Organisation Name")].trim() ||
            !row[header.indexOf("Route")].trim() || !row[header.indexOf("Type & Rating")].trim()) throw new Error("Incomplete sponsor CSV record");
        companies.add(`${row[header.indexOf("Organisation Name")] }|${row[header.indexOf("Town/City")]}`.toLowerCase());
        count++;
      }
    }
    row = [];
  };
  for (let index = 0; index < csv.length; index++) {
    const char = csv[index];
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') { field += '"'; index++; }
      else quoted = !quoted;
    } else if (!quoted && char === ",") { row.push(field); field = ""; }
    else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && csv[index + 1] === "\n") index++;
      finishRow();
    } else field += char;
  }
  if (quoted) throw new Error("Truncated quoted sponsor record");
  if (field || row.length) finishRow();
  if (count < 80000 || count > 250000) throw new Error("Unexpected sponsor record count");
  if (companies.size < 80000) throw new Error("Unexpected unique sponsor count");
  return count;
}
export function materialHash(snapshot: Pick<Snapshot, "csv" | "diffs" | "weeklyReports">) {
  return createHash("sha256").update(JSON.stringify({
    csv: snapshot.csv.replace(/\r\n/g, "\n").trim(),
    diffs: snapshot.diffs.filter(({ diff }) => diff.summary?.added || diff.summary?.removed || diff.summary?.changed),
    weeklyReports: snapshot.weeklyReports,
  })).digest("hex");
}

export function validateSnapshot(snapshot: Snapshot) {
  if (snapshot.version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.sourceDate) ||
      !/^[0-9a-f]{40}$/.test(snapshot.sourceCommit)) {
    throw new Error("Invalid public snapshot metadata");
  }
  if (!snapshot.csv.startsWith('"Organisation Name"') && !snapshot.csv.startsWith("Organisation Name")) {
    throw new Error("Expected the Home Office sponsor CSV, not a pointer or error response");
  }
  if (snapshot.csv.length < 5_000_000 || snapshot.csv.length > 100_000_000) {
    throw new Error("Sponsor CSV size is outside the established register range");
  }
  validateCsv(snapshot.csv);
  for (const entry of snapshot.diffs) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || entry.date > snapshot.sourceDate || !entry.diff.summary ||
        !Array.isArray(entry.diff.added) || !Array.isArray(entry.diff.removed) ||
        !Array.isArray(entry.diff.changes)) throw new Error("Incomplete change history");
    for (const [summary, records] of [["added", "added"], ["removed", "removed"], ["changed", "changes"]]) {
      if (entry.diff.summary[summary] !== entry.diff[records].length) throw new Error("Change history counts do not match its records");
    }
  }
  for (const report of snapshot.weeklyReports) {
    if (!/^[a-z0-9-]+$/.test(report.slug) || !report.summary ||
        !Array.isArray(report.gained) || !Array.isArray(report.lost) ||
        !Array.isArray(report.downgraded) || !Array.isArray(report.upgraded) ||
        !Array.isArray(report.other_rating_changes) || !report.field_update_counts ||
        !Array.isArray(report.source_dates) || !Array.isArray(report.missing_dates)) {
      throw new Error("Incomplete weekly report");
    }
    for (const key of ["gained", "lost", "downgraded", "upgraded", "other_rating_changes"]) {
      if (report.summary[key] !== report[key].length) throw new Error("Weekly report counts do not match its records");
    }
  }
  if (snapshot.materialHash !== materialHash(snapshot)) throw new Error("Public snapshot checksum mismatch");
}

export function readSnapshot(file = SNAPSHOT_PATH): Snapshot {
  const snapshot = JSON.parse(gunzipSync(fs.readFileSync(file)).toString("utf8"));
  validateSnapshot(snapshot);
  return snapshot;
}

export function publishSnapshot(snapshot: Snapshot, file = SNAPSHOT_PATH) {
  validateSnapshot(snapshot);
  const previous = fs.existsSync(file) ? readSnapshot(file) : null;
  if (previous && snapshot.sourceDate < previous.sourceDate) throw new Error("Refusing a source rollback");
  if (previous?.materialHash === snapshot.materialHash) return false;
  const oldRows = previous ? validateCsv(previous.csv) : null;
  const rows = validateCsv(snapshot.csv);
  if (oldRows && (rows < oldRows * 0.85 || rows > oldRows * 1.15)) {
    throw new Error("Register row count changed by more than 15%; retain the last good snapshot for review");
  }
  if (previous && (snapshot.diffs.length < previous.diffs.length ||
      snapshot.weeklyReports.length < previous.weeklyReports.length)) {
    throw new Error("Refusing to discard retained public history");
  }
  if (previous && (previous.diffs.some(old => !snapshot.diffs.some(item => item.date === old.date)) ||
      previous.weeklyReports.some(old => !snapshot.weeklyReports.some(item => item.slug === old.slug)))) {
    throw new Error("Refusing to replace retained public history with unrelated entries");
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, gzipSync(JSON.stringify(snapshot), { level: 9 }));
  readSnapshot(temporary);
  fs.renameSync(temporary, file);
  return true;
}
