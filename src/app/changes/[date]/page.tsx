import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getChangesForDate, getChangesFeed } from "@/lib/data";

type Diff = {
  date: string;
  summary: { total_today: number; total_previous: number; added: number; removed: number; changed: number };
  added: Array<{ "Organisation Name": string; "Town/City": string; Route: string }>;
  removed: Array<{ "Organisation Name": string; "Town/City": string; Route: string }>;
  changes: Array<{ key: { "Organisation Name": string; "Town/City": string; Route: string }; changes: Record<string, { from: string; to: string }> }>;
};

export async function generateStaticParams() {
  const feed = getChangesFeed();
  return feed.map((d) => ({ date: d.date }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ date: string }> },
): Promise<Metadata> {
  const { date } = await params;
  const d = getChangesForDate(date) as Diff | null;
  if (!d) return {};
  return {
    title: `UK sponsor register — changes on ${date}`,
    description: `${d.summary.added} added, ${d.summary.removed} removed, ${d.summary.changed} rating changes on ${date}.`,
    alternates: { canonical: `/changes/${date}` },
  };
}

function slugForCompany(name: string, town: string) {
  return (name + "-" + town)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default async function DailyChange(
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;
  const d = getChangesForDate(date) as Diff | null;
  if (!d) notFound();

  return (
    <article className="container-main py-12">
      <p className="data-label">
        <Link href="/changes">Changes</Link> / {date}
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-bold mt-3">
        Bulletin · {date}
      </h1>
      <p className="mt-3 text-lg">
        <span className="mono">{d.summary.total_today.toLocaleString()}</span> companies on the register (was{" "}
        <span className="mono">{d.summary.total_previous.toLocaleString()}</span>).
      </p>

      <div className="mt-8 grid grid-cols-3 border-y border-ink py-4">
        <Stat label="Added" value={String(d.summary.added)} />
        <Stat label="Removed" value={String(d.summary.removed)} />
        <Stat label="Changed" value={String(d.summary.changed)} />
      </div>

      {d.added.length > 0 && (
        <Block title="Added to the register" tone="ledger">
          {d.added.map((e, i) => (
            <Row key={`a${i}`} name={e["Organisation Name"]} town={e["Town/City"]} route={e.Route} />
          ))}
        </Block>
      )}
      {d.removed.length > 0 && (
        <Block title="Removed from the register" tone="flag">
          {d.removed.map((e, i) => (
            <Row key={`r${i}`} name={e["Organisation Name"]} town={e["Town/City"]} route={e.Route} />
          ))}
        </Block>
      )}
      {d.changes.length > 0 && (
        <Block title="Rating changes" tone="stamp">
          {d.changes.map((e, i) => (
            <li key={`c${i}`} className="border-b border-ink py-3 grid grid-cols-12 gap-3">
              <span className="col-span-5">
                <Link href={`/company/${slugForCompany(e.key["Organisation Name"], e.key["Town/City"])}`}>
                  {e.key["Organisation Name"]}
                </Link>
              </span>
              <span className="col-span-3 data-label text-[11px]">{e.key["Town/City"]}</span>
              <span className="col-span-4 mono text-xs">
                {Object.entries(e.changes).map(([col, c]) => (
                  <span key={col}>{col}: {c.from} → {c.to}</span>
                ))}
              </span>
            </li>
          ))}
        </Block>
      )}
    </article>
  );
}

function Block({ title, tone, children }: { title: string; tone: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-semibold">
        <span className={`status-dot status-${tone === "flag" ? "B" : tone === "stamp" ? "Provisional" : "A"}`} />
        {title}
      </h2>
      <ul className="mt-4 border-t border-ink">{children}</ul>
    </section>
  );
}

function Row({ name, town, route }: { name: string; town: string; route: string }) {
  return (
    <li className="border-b border-ink py-3 grid grid-cols-12 gap-3">
      <span className="col-span-6">
        <Link href={`/company/${slugForCompany(name, town)}`}>{name}</Link>
      </span>
      <span className="col-span-3 data-label text-[11px]">{town}</span>
      <span className="col-span-3 data-label text-[11px]">{route}</span>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 border-r border-ink last:border-r-0 first:pl-0">
      <p className="data-label">{label}</p>
      <p className="stat-digit mt-2">{value}</p>
    </div>
  );
}
