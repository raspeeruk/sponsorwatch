import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCompany, getCompanyIndex, getStats } from "@/lib/data";

// Generate static params for the top 5,000 companies; the rest are built on
// demand by Netlify (ISR) and cached for 24h. Keeps build time bounded while
// still letting Google crawl every page via the sitemap.
export async function generateStaticParams() {
  const top = getCompanyIndex().slice(0, 5000);
  return top.map((c) => ({ slug: c.slug }));
}

export const revalidate = 86400; // 1 day
export const dynamicParams = true;

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const c = getCompany(slug);
  if (!c) return {};
  const routes = Array.from(new Set(c.licences.map((l) => l.route))).join(", ");
  return {
    title: `${c.name} — UK sponsor licence`,
    description: `${c.name} in ${c.town} holds a Home Office sponsor licence for ${routes}. Licence history and rating on SponsorWatch.`,
    alternates: { canonical: `/company/${c.slug}` },
  };
}

export default async function CompanyPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const c = getCompany(slug);
  if (!c) notFound();
  const stats = getStats();

  const hasB = c.licences.some((l) => l.rating === "B");
  const hasProvisional = c.licences.some((l) => l.rating === "Provisional");

  return (
    <article className="container-main py-12">
      <p className="data-label">
        <Link href="/">Register</Link> / <Link href={`/town/${c.townSlug}`}>{c.town}</Link>
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-bold mt-3 leading-tight">
        {c.name}
      </h1>
      <p className="mt-3 text-lg">
        {c.town}
        {c.county ? `, ${c.county}` : ""} · Licensed UK visa sponsor
      </p>

      <div className="mt-8 grid md:grid-cols-3 gap-6 border-y border-ink py-6">
        <Summary label="Status" value={hasB ? "Rated B — caution" : hasProvisional ? "Provisional" : "Active (A rating)"} tone={hasB ? "flag" : hasProvisional ? "stamp" : "ledger"} />
        <Summary label="Licences held" value={String(c.licences.length)} />
        <Summary label="Register as of" value={stats.asOf} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">Licence details</h2>
        <table className="mt-4 w-full text-sm border border-ink">
          <thead>
            <tr className="bg-paper-dim">
              <th className="data-label text-left px-3 py-2 border-b border-ink">Route</th>
              <th className="data-label text-left px-3 py-2 border-b border-ink">Type &amp; rating</th>
              <th className="data-label text-left px-3 py-2 border-b border-ink">Status</th>
            </tr>
          </thead>
          <tbody>
            {c.licences.map((l, i) => (
              <tr key={i} className="border-b border-ink last:border-b-0">
                <td className="px-3 py-2">
                  <Link href={`/route/${l.routeSlug}`}>{l.route}</Link>
                </td>
                <td className="px-3 py-2 mono text-xs">{l.typeRating}</td>
                <td className="px-3 py-2">
                  <span className={`status-dot status-${l.rating}`} />
                  {l.rating}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {c.history.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">Register history</h2>
          <ul className="mt-4 border-t border-ink">
            {c.history.slice(-30).reverse().map((h, i) => (
              <li key={i} className="border-b border-ink py-2 grid grid-cols-12 gap-3">
                <span className="mono text-sm col-span-3">{h.date}</span>
                <span className="col-span-9">
                  {h.event === "added" && "Added to the register"}
                  {h.event === "removed" && "Removed from the register"}
                  {h.event === "changed" && h.change && (
                    <>
                      <span className="data-label">{h.change.column}</span>{" "}
                      <span className="mono">{h.change.from || "—"}</span>{" → "}
                      <span className="mono">{h.change.to || "—"}</span>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 border border-ink p-6 bg-paper-dim">
        <p className="data-label mb-3">Powered by Certifyd</p>
        <h3 className="font-display text-xl font-semibold">
          {c.name} is a licensed sponsor. Are their staff&apos;s documents up to date?
        </h3>
        <p className="mt-2">
          Sponsor licences can be revoked if Right to Work records aren&apos;t maintained.
          Certifyd&apos;s RTW Portal gives you an audit-ready dashboard of every employee&apos;s
          status.
        </p>
        <a href="https://certifyd.io" className="btn-primary mt-4">Learn more →</a>
      </section>
    </article>
  );
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "flag" | "stamp" | "ledger";
}) {
  return (
    <div>
      <p className="data-label">{label}</p>
      <p
        className={`mt-1 font-display text-2xl ${
          tone === "flag" ? "text-flag" : tone === "stamp" ? "text-stamp" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
