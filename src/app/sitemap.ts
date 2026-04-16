import type { MetadataRoute } from "next";
import {
  getCompanyIndex,
  getTownIndex,
  getRouteIndex,
  getIndustryIndex,
  getChangesFeed,
} from "@/lib/data";

const BASE = "https://sponsorwatch.co.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, priority: 1.0 },
    { url: `${BASE}/changes`, lastModified: now, priority: 0.9 },
    { url: `${BASE}/routes`, lastModified: now, priority: 0.9 },
    { url: `${BASE}/towns`, lastModified: now, priority: 0.9 },
    { url: `${BASE}/contact`, lastModified: now, priority: 0.3 },
  ];

  for (const c of getCompanyIndex()) {
    entries.push({
      url: `${BASE}/company/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    });
  }
  for (const t of getTownIndex()) {
    entries.push({
      url: `${BASE}/town/${t.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }
  for (const r of getRouteIndex()) {
    entries.push({
      url: `${BASE}/route/${r.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }
  for (const i of getIndustryIndex()) {
    entries.push({
      url: `${BASE}/for/${i.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  for (const d of getChangesFeed()) {
    entries.push({
      url: `${BASE}/changes/${d.date}`,
      lastModified: d.date,
      priority: 0.6,
    });
  }
  return entries;
}
