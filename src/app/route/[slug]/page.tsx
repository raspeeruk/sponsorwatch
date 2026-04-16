import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getRoute, getRouteIndex, getCompaniesByRoute, getStats } from "@/lib/data";

export async function generateStaticParams() {
  return getRouteIndex().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const r = getRoute(slug);
  if (!r) return {};
  return {
    title: `${r.name} — UK sponsors on this visa route`,
    description: `All UK companies licensed to sponsor workers on the ${r.name} visa route. ${r.companies.length.toLocaleString()} active sponsors.`,
    alternates: { canonical: `/route/${r.slug}` },
  };
}

export default async function RoutePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const r = getRoute(slug);
  if (!r) notFound();
  const companies = getCompaniesByRoute(slug, 1000);
  const stats = getStats();

  return (
    <article className="container-main py-12">
      <p className="data-label"><Link href="/">Register</Link> / Visa route</p>
      <h1 className="font-display text-4xl md:text-5xl font-bold mt-3 leading-tight">
        {r.name}
      </h1>
      <p className="mt-3 text-lg">
        <span className="mono">{r.companies.length.toLocaleString()}</span> UK companies are licensed to sponsor workers on this route.
      </p>

      <div className="mt-8 border-y border-ink py-4 grid grid-cols-3 gap-6">
        <div>
          <p className="data-label">Sponsors</p>
          <p className="stat-digit">{r.companies.length.toLocaleString()}</p>
        </div>
        <div>
          <p className="data-label">Showing</p>
          <p className="stat-digit">{companies.length.toLocaleString()}</p>
        </div>
        <div>
          <p className="data-label">As of</p>
          <p className="font-display text-2xl mt-2">{stats.asOf}</p>
        </div>
      </div>

      <ul className="mt-10 border-t border-ink">
        {companies.map((c) => (
          <li key={c.slug} className="border-b border-ink">
            <Link
              href={`/company/${c.slug}`}
              className="grid grid-cols-12 gap-3 py-3 no-underline hover:bg-paper-dim"
            >
              <span className="col-span-8">{c.name}</span>
              <span className="col-span-3 data-label text-[11px]">{c.town}</span>
              <span className="col-span-1 data-label text-[11px] text-right">
                {c.ratings[0] || ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
