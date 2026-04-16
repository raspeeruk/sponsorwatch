import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTown, getTownIndex, getCompaniesByTown, getStats } from "@/lib/data";

export async function generateStaticParams() {
  return getTownIndex().slice(0, 2000).map((t) => ({ slug: t.slug }));
}

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const t = getTown(slug);
  if (!t) return {};
  return {
    title: `UK visa sponsors in ${t.name}`,
    description: `All licensed Home Office sponsors in ${t.name}${t.county ? ", " + t.county : ""}. ${t.companies.length.toLocaleString()} companies on the register.`,
    alternates: { canonical: `/town/${t.slug}` },
  };
}

export default async function TownPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const t = getTown(slug);
  if (!t) notFound();
  const companies = getCompaniesByTown(slug, 500);
  const stats = getStats();

  return (
    <article className="container-main py-12">
      <p className="data-label"><Link href="/">Register</Link> / Town</p>
      <h1 className="font-display text-4xl md:text-5xl font-bold mt-3">
        Licensed sponsors in {t.name}
      </h1>
      <p className="mt-3 text-lg">
        {t.county ? `${t.county} · ` : ""}
        <span className="mono">{t.companies.length.toLocaleString()}</span> companies licensed to sponsor UK work visas
      </p>

      <div className="mt-8 border-y border-ink py-4 grid grid-cols-3 gap-6">
        <div>
          <p className="data-label">Total</p>
          <p className="stat-digit">{t.companies.length.toLocaleString()}</p>
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
              className="flex items-baseline justify-between py-3 no-underline hover:bg-paper-dim"
            >
              <span>{c.name}</span>
              <span className="data-label text-[11px]">{c.ratings.join(" · ")}</span>
            </Link>
          </li>
        ))}
      </ul>
      {t.companies.length > 500 && (
        <p className="mt-6 data-label">Only the first 500 shown.</p>
      )}
    </article>
  );
}
