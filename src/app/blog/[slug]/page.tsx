import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogIndex, getBlogPost, type BlogEntry } from "@/lib/data";

export async function generateStaticParams() {
  return getBlogIndex().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: `${post.summary.gained} gained, ${post.summary.lost} lost, ${post.summary.downgraded} downgraded and ${post.summary.upgraded} upgraded in the UK sponsor register for the week ending ${post.week_end}.`,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPost(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="container-main py-12">
      <div className="max-w-4xl">
        <p className="data-label">
          <Link href="/blog">Field notes</Link> / Week ending {post.week_end}
        </p>
        <h1 className="font-display text-5xl md:text-7xl font-bold mt-4 leading-[0.95] max-w-4xl">
          {post.title}
        </h1>
        <p className="mt-6 text-xl max-w-3xl leading-relaxed">
          A complete, source-dated account of the sponsor register records captured between {post.week_start} and {post.week_end}.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 border-y border-ink py-5 gap-y-6">
        <Stat label="Gained" value={post.summary.gained} tone="status-A" />
        <Stat label="Lost" value={post.summary.lost} tone="status-B" />
        <Stat label="Downgraded" value={post.summary.downgraded} tone="status-B" />
        <Stat label="Upgraded" value={post.summary.upgraded} tone="status-A" />
      </div>

      {post.missing_dates.length > 0 && (
        <aside className="mt-8 border-l-4 border-[#8B6B2C] pl-4 max-w-3xl">
          <p className="data-label">Coverage note</p>
          <p className="mt-2">
            This report uses the captured source dates {post.source_dates.join(", ")}. No exact snapshot is currently retained for {post.missing_dates.join(", ")}.
            The missing days are not treated as days with no change.
          </p>
        </aside>
      )}

      <section className="mt-14 border-t border-ink pt-6 max-w-2xl">
        <p className="data-label">Register field updates</p>
        <h2 className="font-display text-3xl font-semibold mt-2">
          {post.summary.field_updates.toLocaleString()} non-rating updates
        </h2>
        <p className="mt-3">
          Field-level corrections such as county text changes are counted for completeness, but are not presented as sponsor status moves.
        </p>
        <ul className="mt-4 data-label space-y-1">
          {Object.entries(post.field_update_counts).map(([column, count]) => (
            <li key={column}>{column}: {count.toLocaleString()}</li>
          ))}
        </ul>
      </section>

      <div className="mt-14 max-w-5xl">
        <EntrySection
          title="Sponsors gained"
          description="Every register record appearing during the captured week."
          entries={post.gained}
          tone="status-A"
        />
        <EntrySection
          title="Sponsors lost"
          description="Every register record no longer appearing during the captured week."
          entries={post.lost}
          tone="status-B"
        />
        <TransitionSection title="Downgraded" entries={post.downgraded} tone="status-B" />
        <TransitionSection title="Upgraded" entries={post.upgraded} tone="status-A" />
        {post.other_rating_changes.length > 0 && (
          <TransitionSection
            title="Other rating field changes"
            entries={post.other_rating_changes}
            tone="status-Provisional"
          />
        )}
      </div>

      <p className="mt-12 data-label">
        Complete report data: <a href={`/blog-data/${post.slug}.json`}>download the source-dated JSON</a>.
      </p>
    </article>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`status-dot ${tone} mt-2`} />
      <div>
        <p className="data-label">{label}</p>
        <p className="stat-digit mt-2 text-4xl">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

function EntrySection({
  title,
  description,
  entries,
  tone,
}: {
  title: string;
  description: string;
  entries: BlogEntry[];
  tone: string;
}) {
  return (
    <section className="mt-14 border-t border-ink pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-3xl font-semibold">
          <span className={`status-dot ${tone}`} />{title}
        </h2>
        <p className="data-label">{entries.length.toLocaleString()} records</p>
      </div>
      <p className="mt-2 text-sm">{description}</p>
      {entries.length > 0 ? <EntryList entries={entries} /> : <p className="mt-4 data-label">None recorded.</p>}
    </section>
  );
}

function TransitionSection({ title, entries, tone }: { title: string; entries: BlogEntry[]; tone: string }) {
  return (
    <section className="mt-14 border-t border-ink pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-3xl font-semibold">
          <span className={`status-dot ${tone}`} />{title}
        </h2>
        <p className="data-label">{entries.length.toLocaleString()} records</p>
      </div>
      {entries.length > 0 ? <EntryList entries={entries} transition /> : <p className="mt-4 data-label">None recorded.</p>}
    </section>
  );
}

function EntryList({ entries, transition = false }: { entries: BlogEntry[]; transition?: boolean }) {
  return (
    <details className="mt-5 group" open>
      <summary className="cursor-pointer data-label border-y border-ink py-3 list-none flex justify-between">
        <span>Complete list</span><span>-</span>
      </summary>
      <ul className="border-b border-ink">
        {entries.map((entry, index) => (
          <EntryRow
            key={`${entry.date}-${entry["Organisation Name"]}-${entry["Town/City"]}-${entry.Route}-${index}`}
            entry={entry}
            transition={transition}
          />
        ))}
      </ul>
    </details>
  );
}

function EntryRow({ entry, transition }: { entry: BlogEntry; transition: boolean }) {
  const name = entry["Organisation Name"];
  const label = entry.companySlug ? (
    <Link href={`/company/${entry.companySlug}`}>{name}</Link>
  ) : (
    <Link href={`/changes/${entry.date}`}>{name}</Link>
  );
  return (
    <li className="py-3 border-b border-ink/30 grid grid-cols-12 gap-3 text-sm">
      <span className="col-span-12 md:col-span-5">{label}</span>
      <span className="col-span-5 md:col-span-2 data-label text-[10px]">{entry["Town/City"]}</span>
      <span className="col-span-7 md:col-span-3 data-label text-[10px]">{entry.Route}</span>
      <span className="col-span-12 md:col-span-2 mono text-[11px] md:text-right">
        {transition ? `${entry.from || "?"} -> ${entry.to || "?"}` : entry.date}
      </span>
    </li>
  );
}
