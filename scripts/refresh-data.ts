import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { materialHash, publishSnapshot, type Snapshot } from "./snapshot";

// The existing source pipeline captures the register daily. Only this job reads
// its checkout. Website builds use the retained public snapshot without fetching.
const source = process.env.SPONSORS_DATA_PATH;
if (!source) throw new Error("SPONSORS_DATA_PATH must point to the completed source checkout");
const sponsors = path.join(source, "data/sponsors");
const csv = fs.readFileSync(path.join(sponsors, "latest.csv"), "utf8");
const sourceDate = fs.readdirSync(sponsors).filter(f => /^\d{4}-\d{2}-\d{2}\.csv$/.test(f)).sort().at(-1)?.slice(0, 10);
if (!sourceDate) throw new Error("No dated register snapshot found");
if (Date.now() - Date.parse(`${sourceDate}T00:00:00Z`) > 72 * 60 * 60 * 1000 ||
    Date.parse(`${sourceDate}T00:00:00Z`) > Date.now()) throw new Error("Source register is stale or future-dated");
if (csv !== fs.readFileSync(path.join(sponsors, `${sourceDate}.csv`), "utf8")) {
  throw new Error("Latest register does not match the latest completed dated source");
}
const readJsonDirectory = (folder: string) => fs.readdirSync(path.join(sponsors, folder))
  .filter(f => f.endsWith(".json")).sort()
  .map(file => ({ file, data: JSON.parse(fs.readFileSync(path.join(sponsors, folder, file), "utf8")) }));
// Empty daily diffs contain only a new date. They do not trigger a website build.
const diffs = readJsonDirectory("diffs").map(({ file, data }) => ({ date: file.slice(0, 10), diff: data }));
const weeklyReports = readJsonDirectory("weekly").map(({ data }) => data);
const sourceCommit = process.env.SPONSORS_SOURCE_COMMIT || execFileSync("git", ["rev-parse", "HEAD"], { cwd: source, encoding: "utf8" }).trim();
if (!/^[0-9a-f]{40}$/.test(sourceCommit)) throw new Error("Expected the immutable source commit");
const snapshot: Snapshot = {
  version: 1, sourceDate,
  sourceCommit,
  csv, diffs, weeklyReports, materialHash: "",
};
snapshot.materialHash = materialHash(snapshot);
const changed = publishSnapshot(snapshot);
console.log(changed ? `Published validated public source ${sourceDate}` : "No material public change; retain the current website and snapshot");
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
