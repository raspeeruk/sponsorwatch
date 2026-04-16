import Link from "next/link";
import {
  getStats,
  getChangesFeed,
  getRouteIndex,
  getTownIndex,
  getIndustryIndex,
} from "@/lib/data";
import { SearchBox } from "@/components/SearchBox";

export default function Home() {
  const stats = getStats();
  const feed = getChangesFeed().slice(0, 7);
  const routes = getRouteIndex().slice(0, 10);
  const towns = getTownIndex().slice(0, 12);
  const industries = getIndustryIndex();

  return (
    <>
      <section className="container-main py-16">
        <p className="data-label">Issue · {stats.asOf.replaceAll("-", " · ")}</p>
        <h1 className="font-display text-5xl md:text-6xl font-bold mt-3 leading-[1.05] max-w-3xl">
          Every UK licensed sponsor, updated daily.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed">
          A public mirror of the UK Home Office Register of Licensed Sponsors (Workers). Search{" "}
          <span className="mono">{stats.totalCompanies.toLocaleString()}</span> companies across{" "}
          <span className="mono">{stats.totalTowns.toLocaleString()}</span> towns and{" "}
          <span className="mono">{stats.totalRoutes}</span> visa routes. Published by the Home
          Office. Tracked daily by SponsorWatch.
        </p>
        <div className="mt-8 max-w-2xl">
          <SearchBox />
        </div>
      </section>

      <section className="border-y border-ink">
        <div className="container-main py-8 grid grid-cols-2 md:grid-cols-4">
          <Stat label="Sponsors" digit={stats.totalCompanies.toLocaleString()} />
          <Stat label="Licences" digit={stats.totalLicences.toLocaleString()} />
          <Stat label="Towns" digit={stats.totalTowns.toLocaleString()} />
          <Stat label="Routes" digit={String(stats.totalRoutes)} />
        </div>
      </section>

      {feed.length > 0 && (
        <section className="container-main py-12">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-3xl font-semibold">Latest bulletins</h2>
            <Link href="/changes" className="data-label">All changes →</Link>
          </div>
          <div className="mt-6 border border-ink">
            {feed.map((d) => (
              <Link
                key={d.date}
                href={`/changes/${d.date}`}
                className="grid grid-cols-12 items-baseline border-b border-ink last:border-b-0 px-4 py-3 no-underline hover:bg-paper-dim"
              >
                <span className="col-span-3 mono text-sm">{d.date}</span>
                <span className="col-span-3 text-sm">
                  <span className="data-label">Added</span>{" "}
                  <span className="mono">{d.added}</span>
                </span>
                <span className="col-span-3 text-sm">
                  <span className="data-label">Removed</span>{" "}
                  <span className="mono">{d.removed}</span>
                </span>
                <span className="col-span-3 text-sm">
                  <span className="data-label">Changed</span>{" "}
                  <span className="mono">{d.changed}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container-main py-12 grid md:grid-cols-12 gap-12">
        <div className="md:col-span-7">
          <h2 className="font-display text-3xl font-semibold">By visa route</h2>
          <ul className="mt-4 border-t border-ink">
            {routes.map((r) => (
              <li key={r.slug} className="border-b border-ink">
                <Link
                  href={`/route/${r.slug}`}
                  className="flex items-baseline justify-between py-3 no-underline hover:bg-paper-dim"
                >
                  <span>{r.name}</span>
                  <span className="mono text-sm">{r.count.toLocaleString()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-5">
          <h2 className="font-display text-3xl font-semibold">By industry</h2>
          <ul className="mt-4 border-t border-ink">
            {industries.map((i) => (
              <li key={i.slug} className="border-b border-ink">
                <Link
                  href={`/for/${i.slug}`}
                  className="flex items-baseline justify-between py-3 no-underline hover:bg-paper-dim"
                >
                  <span>{i.name}</span>
                  <span className="mono text-sm">{i.count.toLocaleString()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-main py-12">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-3xl font-semibold">Largest sponsor towns</h2>
          <Link href="/towns" className="data-label">All towns →</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
          {towns.map((t) => (
            <Link key={t.slug} href={`/town/${t.slug}`} className="no-underline">
              <span>{t.name}</span>{" "}
              <span className="mono text-sm opacity-70">{t.count.toLocaleString()}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function Stat({ label, digit }: { label: string; digit: string }) {
  return (
    <div className="py-3 border-r border-ink last:border-r-0 px-4 first:pl-0">
      <p className="data-label">{label}</p>
      <p className="stat-digit mt-2">{digit}</p>
    </div>
  );
}
