import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { materialHash, publishSnapshot, readSnapshot, validateSnapshot } from "./snapshot";

const baseline = readSnapshot();
test("date-only changes and empty daily diffs do not replace the published snapshot", () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "sponsor-snapshot-"));
  const file = path.join(folder, "snapshot.gz");
  try {
    assert.equal(publishSnapshot(baseline, file), true);
    const before = fs.readFileSync(file);
    const date = new Date(Date.parse(baseline.sourceDate) + 86400000).toISOString().slice(0, 10);
    const newer = { ...baseline, sourceDate: date, diffs: [...baseline.diffs, { date, diff: { summary: { added: 0, removed: 0, changed: 0 }, added: [], removed: [], changes: [] } }] };
    newer.materialHash = materialHash(newer);
    assert.equal(publishSnapshot(newer, file), false);
    assert.deepEqual(fs.readFileSync(file), before);
  } finally { fs.rmSync(folder, { recursive: true, force: true }); }
});

test("corrupt, incomplete and rolled-back sources retain the last good files", () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "sponsor-snapshot-"));
  const file = path.join(folder, "snapshot.gz");
  try {
    publishSnapshot(baseline, file);
    const before = fs.readFileSync(file);
    assert.throws(() => publishSnapshot({ ...baseline, csv: baseline.csv + "broken", materialHash: baseline.materialHash }, file));
    const sourceDate = new Date(Date.parse(baseline.sourceDate) - 86400000).toISOString().slice(0, 10);
    const rollback = { ...baseline, sourceDate, diffs: baseline.diffs.filter(item => item.date <= sourceDate) };
    rollback.materialHash = materialHash(rollback);
    assert.throws(() => publishSnapshot(rollback, file), /rollback/);
    const incomplete = { ...baseline, csv: baseline.csv.replace("Organisation Name", "Missing Name") };
    incomplete.materialHash = materialHash(incomplete);
    assert.throws(() => validateSnapshot(incomplete), /CSV|columns/);
    const lostHistory = { ...baseline, diffs: baseline.diffs.slice(1) };
    lostHistory.materialHash = materialHash(lostHistory);
    assert.throws(() => publishSnapshot(lostHistory, file), /history/);
    assert.deepEqual(fs.readFileSync(file), before);
  } finally { fs.rmSync(folder, { recursive: true, force: true }); }
});
