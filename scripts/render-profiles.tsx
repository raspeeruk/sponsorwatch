import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { renderToStaticMarkup } from "react-dom/server";
import CompanyPage, { generateMetadata as companyMetadata } from "../src/app/company/[slug]/page";
import TownPage, { generateMetadata as townMetadata } from "../src/app/town/[slug]/page";
import { Masthead } from "../src/components/Masthead";
import { Footer } from "../src/components/Footer";
import { getCompanyIndex, getTownIndex, getStats } from "../src/lib/data";

// Render the large register sequentially using the existing React templates.
// Next exports the small interactive shell. Profiles need no hydration or RSC
// requests, and this avoids hundreds of thousands of concurrent Next workers.
async function main() {
  const sample = process.argv.includes("--sample");
  fs.writeFileSync("out/static-build.json", JSON.stringify({ complete: false }));
  const base = "https://sponsorwatch.co.uk";
  const homepage = fs.readFileSync("out/index.html", "utf8");
  const head = homepage.match(/<head>([\s\S]*?)<\/head>/)?.[1];
  if (!head) throw new Error("Missing exported website shell");
  const styles = [...head.matchAll(/<link\b[^>]*>/g)].map(m => m[0])
    .filter(tag => /stylesheet|icon/.test(tag)).join("");
  if (!styles.includes("stylesheet")) throw new Error("Missing exported stylesheet");
  const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  const masthead = renderToStaticMarkup(<Masthead />);
  const footer = renderToStaticMarkup(<Footer />);
  const ga = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const analytics = ga && /^G-[A-Z0-9]+$/.test(ga) ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');</script>` : "";
  const writePage = (url: string, title: string, description: string, body: string) => {
    const target = path.join("out", `${url}.html.gz`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} · SponsorWatch</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${base}/${url}"><meta property="og:type" content="website"><meta property="og:site_name" content="SponsorWatch"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${base}/${url}">${styles}${analytics}</head><body>${masthead}<main class="min-h-screen">${body}</main>${footer}</body></html>`;
    fs.writeFileSync(target, gzipSync(html));
  };
  for (const [kind, entries, page, metadata] of [
    ["company", getCompanyIndex(), CompanyPage, companyMetadata],
    ["town", getTownIndex(), TownPage, townMetadata],
  ] as const) {
    let count = 0;
    for (const item of sample ? entries.slice(0, 10) : entries) {
      const params = Promise.resolve({ slug: item.slug });
      const meta = await metadata({ params });
      writePage(`${kind}/${item.slug}`, String(meta.title), String(meta.description), renderToStaticMarkup(await page({ params })));
      count++;
      if (count % 10000 === 0) console.log(`[static] ${kind}: ${count} files`);
    }
    console.log(`[static] ${kind}: ${count} files complete`);
  }
  if (sample) return; // bounded local verification is never a releasable artifact
  // Preserve the existing sitemap URL and URL cohort, within the 50,000 URL cap.
  const sitemap = fs.readFileSync("out/sitemap.xml", "utf8");
  const urls = [...sitemap.matchAll(/<url>[\s\S]*?<\/url>/g)].map(m => m[0]);
  if (urls.length < getCompanyIndex().length + getTownIndex().length) throw new Error("Incomplete exported sitemap");
  const sourceDate = getStats().asOf;
  const names: string[] = [];
  for (let start = 0; start < urls.length; start += 50000) {
    const name = `sitemap-${names.length + 1}.xml`;
    names.push(name);
    fs.writeFileSync(path.join("out", name), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.slice(start, start + 50000).join("")}</urlset>`);
  }
  fs.writeFileSync("out/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${names.map(name => `<sitemap><loc>${base}/${name}</loc><lastmod>${sourceDate}</lastmod></sitemap>`).join("")}</sitemapindex>`);
  const source = JSON.parse(fs.readFileSync(".data/static/build-manifest.json", "utf8"));
  fs.writeFileSync("out/static-build.json", JSON.stringify({
    complete: true, sourceDate, sourceCommit: source.sourceCommit, materialHash: source.materialHash,
    companies: getCompanyIndex().length, towns: getTownIndex().length,
    sitemapUrls: urls.length,
  }));
}
main().catch(error => { console.error(error); process.exit(1); });
