/**
 * Static data loaders. All reads go through here so pages stay tidy and we
 * can change the underlying storage (JSON → SQLite → whatever) later.
 * No network. No database. Just fs reads into memory.
 */

import fs from "node:fs";
import path from "node:path";

// Static data lives at .data/static at the repo root. The /*turbopackIgnore*/
// comments tell the bundler not to trace these dynamic paths — otherwise it
// tries to include all ~500k JSON files as potential dynamic imports.
const DATA_DIR = /*turbopackIgnore: true*/ path.join(process.cwd(), ".data", "static");

function readJson<T>(rel: string): T {
  return JSON.parse(
    fs.readFileSync(/*turbopackIgnore: true*/ path.join(DATA_DIR, rel), "utf8"),
  ) as T;
}

function exists(rel: string) {
  return fs.existsSync(/*turbopackIgnore: true*/ path.join(DATA_DIR, rel));
}

export type CompanyIndex = {
  slug: string;
  name: string;
  town: string;
  townSlug: string;
  routes: string[];
  ratings: string[];
};

export type Company = {
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

export type Town = {
  slug: string;
  name: string;
  county: string;
  companies: string[]; // slugs
};

export type Route = {
  slug: string;
  name: string;
  companies: string[]; // slugs
};

export type Industry = {
  slug: string;
  name: string;
  companies: string[];
};

export type Stats = {
  asOf: string;
  totalCompanies: number;
  totalLicences: number;
  totalTowns: number;
  totalRoutes: number;
  ratings: Record<string, number>;
  recent: { date: string; added: number; removed: number; changed: number } | null;
};

export type ChangesFeedItem = {
  date: string;
  added: number;
  removed: number;
  changed: number;
};

export type BlogIndexItem = {
  slug: string;
  title: string;
  week_start: string;
  week_end: string;
  source_dates: string[];
  missing_dates: string[];
  summary: {
    total_before: number;
    total_after: number;
    gained: number;
    lost: number;
    downgraded: number;
    upgraded: number;
    other_rating_changes: number;
    field_updates: number;
  };
};

export type BlogEntry = {
  "Organisation Name": string;
  "Town/City": string;
  Route: string;
  date: string;
  companySlug?: string;
  column?: string;
  from?: string;
  to?: string;
  from_rating?: string | null;
  to_rating?: string | null;
};

export type BlogReport = BlogIndexItem & {
  version: number;
  gained: BlogEntry[];
  lost: BlogEntry[];
  downgraded: BlogEntry[];
  upgraded: BlogEntry[];
  other_rating_changes: BlogEntry[];
  field_update_counts: Record<string, number>;
};

// --- loaders ---

let _companyIndex: CompanyIndex[] | null = null;
export function getCompanyIndex(): CompanyIndex[] {
  if (!_companyIndex) _companyIndex = readJson<CompanyIndex[]>("companies/index.json");
  return _companyIndex;
}

let _companyLookup: Record<string, Company> | null = null;
export function getCompany(slug: string): Company | null {
  // Try individual file first (fast, works at build time with all files present)
  if (exists(`companies/full/${slug}.json`)) {
    return readJson<Company>(`companies/full/${slug}.json`);
  }
  // Fall back to lookup file (for serverless runtime where individual files aren't bundled)
  if (!_companyLookup) {
    try {
      _companyLookup = readJson<Record<string, Company>>("companies/lookup.json");
    } catch {
      _companyLookup = {};
    }
  }
  return _companyLookup[slug] || null;
}

export type TownIndexEntry = { slug: string; name: string; county: string; count: number };
let _townIndex: TownIndexEntry[] | null = null;
export function getTownIndex(): TownIndexEntry[] {
  if (!_townIndex) _townIndex = readJson<TownIndexEntry[]>("towns/index.json");
  return _townIndex;
}

let _townLookup: Record<string, Town> | null = null;
export function getTown(slug: string): Town | null {
  if (exists(`towns/${slug}.json`)) {
    return readJson<Town>(`towns/${slug}.json`);
  }
  if (!_townLookup) {
    try {
      _townLookup = readJson<Record<string, Town>>("towns/lookup.json");
    } catch {
      _townLookup = {};
    }
  }
  return _townLookup[slug] || null;
}

export type RouteIndexEntry = { slug: string; name: string; count: number };
let _routeIndex: RouteIndexEntry[] | null = null;
export function getRouteIndex(): RouteIndexEntry[] {
  if (!_routeIndex) _routeIndex = readJson<RouteIndexEntry[]>("routes/index.json");
  return _routeIndex;
}

export function getRoute(slug: string): Route | null {
  if (!exists(`routes/${slug}.json`)) return null;
  return readJson<Route>(`routes/${slug}.json`);
}

export type IndustryIndexEntry = { slug: string; name: string; count: number };
let _industryIndex: IndustryIndexEntry[] | null = null;
export function getIndustryIndex(): IndustryIndexEntry[] {
  if (!_industryIndex) _industryIndex = readJson<IndustryIndexEntry[]>("industries/index.json");
  return _industryIndex;
}

export function getIndustry(slug: string): Industry | null {
  if (!exists(`industries/${slug}.json`)) return null;
  return readJson<Industry>(`industries/${slug}.json`);
}

export function getStats(): Stats {
  return readJson<Stats>("stats.json");
}

export function getChangesFeed(): ChangesFeedItem[] {
  if (!exists("changes/feed.json")) return [];
  return readJson<ChangesFeedItem[]>("changes/feed.json");
}

export function getChangesForDate(date: string) {
  if (!exists(`changes/${date}.json`)) return null;
  return readJson(`changes/${date}.json`);
}

export function getBlogIndex(): BlogIndexItem[] {
  if (!exists("blog/index.json")) return [];
  return readJson<BlogIndexItem[]>("blog/index.json");
}

export function getBlogPost(slug: string): BlogReport | null {
  if (!exists(`blog/${slug}.json`)) return null;
  return readJson<BlogReport>(`blog/${slug}.json`);
}

// --- helpers ---

export function getCompaniesByTown(slug: string, limit = 500): CompanyIndex[] {
  const town = getTown(slug);
  if (!town) return [];
  const idx = getCompanyIndex();
  const map = new Map(idx.map((c) => [c.slug, c]));
  return town.companies
    .map((s) => map.get(s))
    .filter((c): c is CompanyIndex => Boolean(c))
    .slice(0, limit);
}

export function getCompaniesByRoute(slug: string, limit = 500): CompanyIndex[] {
  const route = getRoute(slug);
  if (!route) return [];
  const idx = getCompanyIndex();
  const map = new Map(idx.map((c) => [c.slug, c]));
  return route.companies
    .map((s) => map.get(s))
    .filter((c): c is CompanyIndex => Boolean(c))
    .slice(0, limit);
}

export function getCompaniesByIndustry(slug: string, limit = 500): CompanyIndex[] {
  const ind = getIndustry(slug);
  if (!ind) return [];
  const idx = getCompanyIndex();
  const map = new Map(idx.map((c) => [c.slug, c]));
  return ind.companies
    .map((s) => map.get(s))
    .filter((c): c is CompanyIndex => Boolean(c))
    .slice(0, limit);
}
