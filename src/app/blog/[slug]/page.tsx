import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogIndex, getBlogPost } from "@/lib/data";
import { CompleteReport } from "./CompleteReport";

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

      <CompleteReport slug={post.slug} />

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
