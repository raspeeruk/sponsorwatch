/**
 * Prebuild: read latest CSV from certifyd-data-pipeline and generate
 * the static JSON files that Next.js consumes at build time.
 *
 * Files-first per RogerSon decision dec_1742688000_files_first.
 * No database. Everything below is written once per build to .data/static/.
 *
 * Output structure:
 *   .data/static/
 *     stats.json                     # aggregate counts for home
 *     companies/index.json           # slim list used for sitemap + search
 *     companies/by-shard/[a].json    # hash shard, 256 files of ~500 companies
 *     companies/full/[slug].json     # per-company detail for dynamic pages
 *     towns/index.json
 *     towns/[slug].json
 *     routes/index.json
 *     routes/[slug].json
 *     changes/feed.json
 *     changes/[date].json
 *     industries/index.json
 *     industries/[slug].json
 *     search-index.json              # compact search blob for client
 *     build-manifest.json            # build metadata
 */

import * as fs from "node:fs";
import * as path from "node:path";

// Data source: the certifyd-data-pipeline repo. Prefer local checkout (faster,
// works offline). Fall back to fetching raw GitHub for CI builds.
const LOCAL_PIPELINE =
  process.env.SPONSORS_DATA_PATH ||
  "/Users/andrewspeer/Documents/GitHub/certifyd-data-pipeline";
const REMOTE_BASE =
  process.env.SPONSORS_REMOTE_BASE ||
  "https://raw.githubusercontent.com/raspeeruk/certifyd-data-pipeline/main";

const STATIC_DIR = path.resolve(__dirname, "..", ".data", "static");

type Row = {
  organisationName: string;
  townCity: string;
  county: string;
  typeRating: string;
  route: string;
};

type Company = {
  slug: string;
  name: string;
  town: string;
  townSlug: string;
  county: string;
  licences: Array<{
    route: string;
    routeSlug: string;
    typeRating: string;
    rating: "A" | "B" | "Provisional" | "Unknown";
  }>;
  history: Array<{
    date: string;
    event: "added" | "removed" | "changed";
    change?: { column: string; from: string; to: string };
  }>;
};

// --- helpers ---

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

function ratingOf(typeRating: string): Company["licences"][0]["rating"] {
  if (/Provisional/i.test(typeRating)) return "Provisional";
  if (/B rating/i.test(typeRating)) return "B";
  if (/A\s*\(|A rating/i.test(typeRating)) return "A";
  return "Unknown";
}

function tidy(s: string | undefined | null): string {
  if (!s) return "";
  const t = s.trim();
  if (t === "NULL") return "";
  return t;
}

function parseCsv(contents: string): Row[] {
  // Simple RFC4180-ish parser adequate for this dataset.
  const rows: Row[] = [];
  const text = contents.replace(/^\uFEFF/, "");
  const lines: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQ = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        field = "";
        if (row.length && row.some((v) => v.length)) lines.push(row);
        row = [];
      } else {
        field += c;
      }
    }
  }
  if (field.length || row.length) {
    row.push(field);
    lines.push(row);
  }

  const header = lines[0].map((h) => h.trim());
  const idx = (name: string) => header.findIndex((h) => h === name);
  const iOrg = idx("Organisation Name");
  const iTown = idx("Town/City");
  const iCounty = idx("County");
  const iType = idx("Type & Rating");
  const iRoute = idx("Route");
  if ([iOrg, iTown, iCounty, iType, iRoute].some((i) => i < 0)) {
    throw new Error(
      `Missing expected CSV columns. Got: ${header.join(" | ")}`,
    );
  }

  for (let li = 1; li < lines.length; li++) {
    const r = lines[li];
    rows.push({
      organisationName: tidy(r[iOrg]),
      townCity: tidy(r[iTown]),
      county: tidy(r[iCounty]),
      typeRating: tidy(r[iType]),
      route: tidy(r[iRoute]),
    });
  }
  return rows;
}

// --- data fetching ---

async function readLatestCsv(): Promise<{ date: string; csv: string }> {
  // 1. Local repo (preferred)
  const localCsv = path.join(LOCAL_PIPELINE, "data", "sponsors", "latest.csv");
  if (fs.existsSync(localCsv)) {
    const buf = fs.readFileSync(localCsv, "utf8");
    // Try to find dated snapshot to stamp build
    const sponsorsDir = path.join(LOCAL_PIPELINE, "data", "sponsors");
    let dateStamp = new Date().toISOString().slice(0, 10);
    if (fs.existsSync(sponsorsDir)) {
      const dated = fs
        .readdirSync(sponsorsDir)
        .filter((f) => /^\d{4}-\d{2}-\d{2}\.csv$/.test(f))
        .sort()
        .pop();
      if (dated) dateStamp = dated.replace(".csv", "");
    }
    console.log(`[prebuild] Loaded ${localCsv} (${buf.length} bytes)`);
    return { date: dateStamp, csv: buf };
  }

  // 2. Remote fallback — two-step: Contents API for download_url, then fetch actual LFS file
  const apiUrl = "https://api.github.com/repos/raspeeruk/certifyd-data-pipeline/contents/data/sponsors/latest.csv";
  console.log(`[prebuild] Fetching via GitHub API (LFS two-step)`);
  const metaHeaders: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "sponsorwatch-prebuild",
  };
  if (process.env.GITHUB_TOKEN) {
    metaHeaders.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }
  const metaRes = await fetch(apiUrl, { headers: metaHeaders });
  if (!metaRes.ok) {
    throw new Error(`Failed to fetch file metadata: ${metaRes.status} ${metaRes.statusText}`);
  }
  const meta = (await metaRes.json()) as { download_url: string; size: number };
  console.log(`[prebuild] LFS download_url obtained (${meta.size} bytes)`);

  const csvRes = await fetch(meta.download_url);
  if (!csvRes.ok) {
    throw new Error(`Failed to download CSV: ${csvRes.status} ${csvRes.statusText}`);
  }
  const csv = await csvRes.text();
  return { date: new Date().toISOString().slice(0, 10), csv };
}

async function readAllDiffs(): Promise<Array<{ date: string; diff: any }>> {
  // 1. Try local filesystem
  const diffsDir = path.join(LOCAL_PIPELINE, "data", "sponsors", "diffs");
  if (fs.existsSync(diffsDir)) {
    const files = fs
      .readdirSync(diffsDir)
      .filter((f) => f.endsWith(".json"))
      .sort();
    if (files.length > 0) {
      const out: Array<{ date: string; diff: any }> = [];
      for (const f of files) {
        const raw = fs.readFileSync(path.join(diffsDir, f), "utf8");
        try {
          out.push({ date: f.replace(".json", ""), diff: JSON.parse(raw) });
        } catch {
          console.warn(`[prebuild] skipped bad diff ${f}`);
        }
      }
      console.log(`[prebuild] loaded ${out.length} diffs from local`);
      return out;
    }
  }

  // 2. Remote fallback — fetch diff listing from GitHub API
  const apiUrl = "https://api.github.com/repos/raspeeruk/certifyd-data-pipeline/contents/data/sponsors/diffs";
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "sponsorwatch-prebuild",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }
  const listRes = await fetch(apiUrl, { headers });
  if (!listRes.ok) {
    console.log(`[prebuild] No remote diffs (${listRes.status}) — skipping change history`);
    return [];
  }
  const listing = (await listRes.json()) as Array<{ name: string; download_url: string }>;
  const jsonFiles = listing.filter((f) => f.name.endsWith(".json")).sort((a, b) => a.name.localeCompare(b.name));
  console.log(`[prebuild] fetching ${jsonFiles.length} diffs from GitHub`);

  const out: Array<{ date: string; diff: any }> = [];
  for (const f of jsonFiles) {
    try {
      const res = await fetch(f.download_url);
      if (res.ok) {
        out.push({ date: f.name.replace(".json", ""), diff: await res.json() });
      }
    } catch {
      console.warn(`[prebuild] skipped bad remote diff ${f.name}`);
    }
  }
  return out;
}

// --- main ---

async function main() {
  console.log("[prebuild] starting");
  fs.mkdirSync(STATIC_DIR, { recursive: true });
  for (const sub of [
    "companies/by-shard",
    "companies/full",
    "towns",
    "routes",
    "changes",
    "industries",
  ]) {
    fs.mkdirSync(path.join(STATIC_DIR, sub), { recursive: true });
  }

  const { date, csv } = await readLatestCsv();
  const diffs = await readAllDiffs();

  const rows = parseCsv(csv);
  console.log(`[prebuild] parsed ${rows.length} rows`);

  // Collapse rows → unique companies (keyed by name|town|route)
  const byCompany = new Map<
    string,
    { name: string; town: string; county: string; licences: Company["licences"] }
  >();
  for (const r of rows) {
    if (!r.organisationName) continue;
    const key = `${r.organisationName}|${r.townCity}`.toLowerCase();
    let rec = byCompany.get(key);
    if (!rec) {
      rec = {
        name: r.organisationName,
        town: r.townCity,
        county: r.county,
        licences: [],
      };
      byCompany.set(key, rec);
    }
    rec.licences.push({
      route: r.route,
      routeSlug: slugify(r.route),
      typeRating: r.typeRating,
      rating: ratingOf(r.typeRating),
    });
  }

  // Build companies with slugs. Resolve slug collisions by appending town slug.
  const usedSlugs = new Set<string>();
  const companies: Company[] = [];
  for (const c of byCompany.values()) {
    const base = slugify(c.name);
    let slug = base;
    if (usedSlugs.has(slug)) {
      slug = `${base}-${slugify(c.town) || "uk"}`;
    }
    let n = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${n++}`;
    }
    usedSlugs.add(slug);
    companies.push({
      slug,
      name: c.name,
      town: c.town,
      townSlug: slugify(c.town) || "unknown",
      county: c.county,
      licences: c.licences,
      history: [],
    });
  }

  // Apply diff history to each company
  const companiesByKey = new Map(
    companies.map((c) => [`${c.name.toLowerCase()}|${c.town.toLowerCase()}`, c]),
  );
  for (const { date: d, diff } of diffs) {
    for (const entry of diff.added || []) {
      const key = `${(entry["Organisation Name"] || "").toLowerCase()}|${(entry["Town/City"] || "").toLowerCase()}`;
      const c = companiesByKey.get(key);
      if (c) c.history.push({ date: d, event: "added" });
    }
    for (const entry of diff.removed || []) {
      const key = `${(entry["Organisation Name"] || "").toLowerCase()}|${(entry["Town/City"] || "").toLowerCase()}`;
      const c = companiesByKey.get(key);
      if (c) c.history.push({ date: d, event: "removed" });
    }
    for (const entry of diff.changes || []) {
      const k = entry.key || {};
      const key = `${(k["Organisation Name"] || "").toLowerCase()}|${(k["Town/City"] || "").toLowerCase()}`;
      const c = companiesByKey.get(key);
      if (c) {
        for (const [column, change] of Object.entries(entry.changes || {}) as any) {
          c.history.push({
            date: d,
            event: "changed",
            change: { column, from: change.from, to: change.to },
          });
        }
      }
    }
  }

  companies.sort((a, b) => a.name.localeCompare(b.name));

  // --- write company files ---
  console.log(`[prebuild] writing ${companies.length} company files`);
  const indexSlim = companies.map((c) => ({
    slug: c.slug,
    name: c.name,
    town: c.town,
    townSlug: c.townSlug,
    routes: Array.from(new Set(c.licences.map((l) => l.routeSlug))),
    ratings: Array.from(new Set(c.licences.map((l) => l.rating))),
  }));
  fs.writeFileSync(
    path.join(STATIC_DIR, "companies/index.json"),
    JSON.stringify(indexSlim),
  );

  // Sharded (by first two chars of slug) for browsing
  const shards = new Map<string, typeof indexSlim>();
  for (const c of indexSlim) {
    const shard = c.slug.slice(0, 1).match(/[a-z0-9]/) ? c.slug[0] : "0";
    if (!shards.has(shard)) shards.set(shard, []);
    shards.get(shard)!.push(c);
  }
  for (const [shard, list] of shards) {
    fs.writeFileSync(
      path.join(STATIC_DIR, "companies/by-shard", `${shard}.json`),
      JSON.stringify(list),
    );
  }

  // Full per-company files (lightweight — only the ones that might be rendered
  // at build. Rest rendered on demand by route handler reading from index.)
  for (const c of companies) {
    fs.writeFileSync(
      path.join(STATIC_DIR, "companies/full", `${c.slug}.json`),
      JSON.stringify(c),
    );
  }

  // --- towns ---
  const byTown = new Map<
    string,
    { slug: string; name: string; county: string; companies: string[] }
  >();
  for (const c of companies) {
    if (!c.town) continue;
    let t = byTown.get(c.townSlug);
    if (!t) {
      t = { slug: c.townSlug, name: c.town, county: c.county, companies: [] };
      byTown.set(c.townSlug, t);
    }
    t.companies.push(c.slug);
  }
  for (const t of byTown.values()) {
    fs.writeFileSync(
      path.join(STATIC_DIR, "towns", `${t.slug}.json`),
      JSON.stringify(t),
    );
  }
  fs.writeFileSync(
    path.join(STATIC_DIR, "towns/index.json"),
    JSON.stringify(
      Array.from(byTown.values())
        .map((t) => ({ slug: t.slug, name: t.name, county: t.county, count: t.companies.length }))
        .sort((a, b) => b.count - a.count),
    ),
  );

  // --- routes ---
  const byRoute = new Map<
    string,
    { slug: string; name: string; companies: string[] }
  >();
  for (const c of companies) {
    for (const l of c.licences) {
      if (!l.route) continue;
      let r = byRoute.get(l.routeSlug);
      if (!r) {
        r = { slug: l.routeSlug, name: l.route, companies: [] };
        byRoute.set(l.routeSlug, r);
      }
      if (!r.companies.includes(c.slug)) r.companies.push(c.slug);
    }
  }
  for (const r of byRoute.values()) {
    fs.writeFileSync(
      path.join(STATIC_DIR, "routes", `${r.slug}.json`),
      JSON.stringify(r),
    );
  }
  fs.writeFileSync(
    path.join(STATIC_DIR, "routes/index.json"),
    JSON.stringify(
      Array.from(byRoute.values())
        .map((r) => ({ slug: r.slug, name: r.name, count: r.companies.length }))
        .sort((a, b) => b.count - a.count),
    ),
  );

  // --- industries (heuristic from org name keywords) ---
  const industries: Array<{ slug: string; name: string; keywords: RegExp }> = [
    { slug: "healthcare", name: "Healthcare", keywords: /(nhs|care\b|clinic|hospital|medical|pharma|dental|nursing|health)/i },
    { slug: "hospitality", name: "Hospitality", keywords: /(hotel|restaurant|catering|pub\b|bar\b|cafe|food|hospitality|leisure)/i },
    { slug: "technology", name: "Technology", keywords: /(tech|software|digital|data|cyber|ai\b|cloud|systems|solutions|consulting)/i },
    { slug: "construction", name: "Construction", keywords: /(construct|builder|building|roof|plumb|electrical|engineer)/i },
    { slug: "logistics", name: "Logistics & Transport", keywords: /(logistics|transport|freight|haulage|courier|delivery)/i },
    { slug: "finance", name: "Finance", keywords: /(bank|finance|capital|invest|asset|wealth|insurance)/i },
    { slug: "retail", name: "Retail", keywords: /(retail|shop|store|supermarket)/i },
    { slug: "education", name: "Education", keywords: /(school|academy|college|university|education|tuition)/i },
    { slug: "legal", name: "Legal", keywords: /(law\b|legal|solicitor|barrister|chambers)/i },
    { slug: "media", name: "Media & Creative", keywords: /(media|film|studio|creative|design|agency|publish|music|art\b)/i },
  ];
  const byIndustry = new Map<string, string[]>();
  for (const c of companies) {
    for (const ind of industries) {
      if (ind.keywords.test(c.name)) {
        if (!byIndustry.has(ind.slug)) byIndustry.set(ind.slug, []);
        byIndustry.get(ind.slug)!.push(c.slug);
        break; // classify into first match only
      }
    }
  }
  for (const ind of industries) {
    const ids = byIndustry.get(ind.slug) || [];
    fs.writeFileSync(
      path.join(STATIC_DIR, "industries", `${ind.slug}.json`),
      JSON.stringify({ slug: ind.slug, name: ind.name, companies: ids }),
    );
  }
  fs.writeFileSync(
    path.join(STATIC_DIR, "industries/index.json"),
    JSON.stringify(
      industries.map((ind) => ({
        slug: ind.slug,
        name: ind.name,
        count: (byIndustry.get(ind.slug) || []).length,
      })),
    ),
  );

  // --- changes feed ---
  const feed: Array<{
    date: string;
    added: number;
    removed: number;
    changed: number;
  }> = diffs.map(({ date, diff }) => ({
    date,
    added: diff?.summary?.added || 0,
    removed: diff?.summary?.removed || 0,
    changed: diff?.summary?.changed || 0,
  }));
  fs.writeFileSync(
    path.join(STATIC_DIR, "changes/feed.json"),
    JSON.stringify(feed.reverse()),
  );
  for (const { date: d, diff } of diffs) {
    fs.writeFileSync(
      path.join(STATIC_DIR, "changes", `${d}.json`),
      JSON.stringify(diff),
    );
  }

  // --- search index (compact) ---
  // Tokens: slug, lowercase name, town. Keep small — slim fields only.
  // Written to public/ so it can be fetched directly by the client.
  const PUBLIC_DIR = path.resolve(__dirname, "..", "public");
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(PUBLIC_DIR, "search-index.json"),
    JSON.stringify(
      companies.slice(0, 20000).map((c) => ({
        s: c.slug,
        n: c.name,
        t: c.town,
      })),
    ),
  );

  // --- stats ---
  const ratingsCount = { A: 0, B: 0, Provisional: 0, Unknown: 0 };
  for (const c of companies) {
    for (const l of c.licences) ratingsCount[l.rating]++;
  }
  const latestDiff = diffs.length ? diffs[diffs.length - 1].diff : null;
  const stats = {
    asOf: date,
    totalCompanies: companies.length,
    totalLicences: companies.reduce((a, c) => a + c.licences.length, 0),
    totalTowns: byTown.size,
    totalRoutes: byRoute.size,
    ratings: ratingsCount,
    recent: latestDiff
      ? {
          date: latestDiff.date,
          added: latestDiff.summary.added,
          removed: latestDiff.summary.removed,
          changed: latestDiff.summary.changed,
        }
      : null,
  };
  fs.writeFileSync(
    path.join(STATIC_DIR, "stats.json"),
    JSON.stringify(stats, null, 2),
  );

  fs.writeFileSync(
    path.join(STATIC_DIR, "build-manifest.json"),
    JSON.stringify(
      { builtAt: new Date().toISOString(), csvDate: date, companies: companies.length },
      null,
      2,
    ),
  );

  console.log(
    `[prebuild] done — ${companies.length} companies, ${byTown.size} towns, ${byRoute.size} routes, ${diffs.length} diffs`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
