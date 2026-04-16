import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getIndustry,
  getIndustryIndex,
  getCompaniesByIndustry,
  getStats,
} from "@/lib/data";

export async function generateStaticParams() {
  return getIndustryIndex().map((i) => ({ industry: i.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ industry: string }> },
): Promise<Metadata> {
  const { industry } = await params;
  const ind = getIndustry(industry);
  if (!ind) return {};
  return {
    title: `UK visa sponsors in ${ind.name.toLowerCase()}`,
    description: `UK companies in ${ind.name.toLowerCase()} licensed to sponsor work visas. ${ind.companies.length.toLocaleString()} active sponsors on the Home Office register.`,
    alternates: { canonical: `/for/${ind.slug}` },
  };
}

export default async function IndustryPage(
  { params }: { params: Promise<{ industry: string }> },
) {
  const { industry } = await params;
  const ind = getIndustry(industry);
  if (!ind) notFound();
  const companies = getCompaniesByIndustry(industry, 500);
  const stats = getStats();

  return (
    <article className="container-main py-12">
      <p className="data-label"><Link href="/">Register</Link> / Industry</p>
      <h1 className="font-display text-4xl md:text-5xl font-bold mt-3">
        UK visa sponsors in {ind.name.toLowerCase()}
      </h1>
      <p className="mt-3 text-lg max-w-2xl">
        <span className="mono">{ind.companies.length.toLocaleString()}</span> UK companies in {ind.name.toLowerCase()} are licensed by the Home Office to sponsor workers on visa routes including Skilled Worker, Global Business Mobility and Temporary Worker.
      </p>

      <div className="mt-8 border-y border-ink py-4 grid grid-cols-3 gap-6">
        <div>
          <p className="data-label">Sponsors</p>
          <p className="stat-digit">{ind.companies.length.toLocaleString()}</p>
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
              <span className="col-span-4 data-label text-[11px]">{c.town}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-12 border border-ink p-6 bg-paper-dim">
        <p className="data-label mb-3">Powered by Certifyd</p>
        <h3 className="font-display text-xl font-semibold">
          Are you a {ind.name.toLowerCase()} sponsor? Keep your RTW records audit-ready.
        </h3>
        <p className="mt-2">
          Every licensed sponsor must maintain Right to Work documentation. One missing or
          expired record can put the licence at risk. Certifyd&apos;s RTW Portal takes care of it.
        </p>
        <a href="https://certifyd.io" className="btn-primary mt-4">Learn more →</a>
      </section>
    </article>
  );
}
