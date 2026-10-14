import assert from "node:assert/strict";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";
import { getCompanyIndex, getTownIndex, getStats } from "../src/lib/data";

const manifest = JSON.parse(fs.readFileSync("out/static-build.json", "utf8"));
assert.equal(manifest.complete, true, "A partial export cannot be published");
assert.equal(manifest.sourceDate, getStats().asOf);
const counts: Record<string, number> = {};
for (const [kind, entries] of [["company", getCompanyIndex()], ["town", getTownIndex()]] as const) {
  const files = new Set(fs.readdirSync(`out/${kind}`).filter(file => file.endsWith(".html.gz")));
  assert.equal(files.size, entries.length, `${kind} file count must match the retained register`);
  for (const entry of entries) assert.ok(files.has(`${entry.slug}.html.gz`), `Missing ${kind}/${entry.slug}`);
  for (const entry of [entries[0], entries[Math.floor(entries.length / 2)], entries.at(-1)!]) {
    const html = gunzipSync(fs.readFileSync(`out/${kind}/${entry.slug}.html.gz`)).toString("utf8");
    assert.ok(html.includes(`<link rel="canonical" href="https://sponsorwatch.co.uk/${kind}/${entry.slug}">`));
    assert.match(html, /<h1\b/);
    assert.ok(!html.includes("self.__next_f"), "Profiles must be complete HTML without an RSC runtime");
  }
  counts[kind] = files.size;
}
const search = JSON.parse(fs.readFileSync("out/search-index.json", "utf8"));
assert.equal(search.length, getCompanyIndex().length, "Search must cover the complete public register");
const index = fs.readFileSync("out/sitemap.xml", "utf8");
const sitemapFiles = [...index.matchAll(/<loc>https:\/\/sponsorwatch\.co\.uk\/(sitemap-\d+\.xml)<\/loc>/g)].map(match => match[1]);
assert.ok(sitemapFiles.length > 0);
let sitemapUrls = 0;
for (const file of sitemapFiles) {
  const xml = fs.readFileSync(`out/${file}`, "utf8");
  const count = [...xml.matchAll(/<url>/g)].length;
  assert.ok(count > 0 && count <= 50000, `${file} must stay within the sitemap URL cap`);
  sitemapUrls += count;
}
assert.equal(sitemapUrls, manifest.sitemapUrls);
assert.ok(sitemapUrls >= counts.company + counts.town);
console.log(JSON.stringify({ complete: true, sourceDate: manifest.sourceDate, sourceCommit: manifest.sourceCommit, materialHash: manifest.materialHash, companyFiles: counts.company, townFiles: counts.town, searchRecords: search.length, sitemapFiles: sitemapFiles.length, sitemapUrls }));
