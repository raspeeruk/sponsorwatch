import Link from "next/link";
import type { Metadata } from "next";
import { getBlogIndex } from "@/lib/data";

export const metadata: Metadata = {
  title: "Weekly field notes on the UK sponsor register",
  description: "Weekly, source-dated reports of sponsors gained, lost, downgraded and upgraded on the UK register.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const posts = getBlogIndex();

  return (
    <div className="container-main py-12">
      <div className="max-w-3xl">
        <p className="data-label">SponsorWatch / Field notes</p>
        <h1 className="font-display text-5xl md:text-7xl font-bold mt-3 leading-[0.95]">
          The register, read as a weekly record.
        </h1>
        <p className="mt-6 text-xl max-w-2xl leading-relaxed">
          Every week we turn the daily register diffs into a complete ledger of sponsors gained,
          lost, downgraded and upgraded. One row means one register record, not a hand-picked sample.
        </p>
      </div>

      <div className="mt-16 border-t border-ink">
        {posts.length === 0 ? (
          <p className="py-8 data-label">The first field note will appear after the next weekly run.</p>
        ) : (
          posts.map((post, index) => (
            <article key={post.slug} className="grid md:grid-cols-12 gap-6 py-8 border-b border-ink">
              <p className="md:col-span-2 data-label">{String(index + 1).padStart(2, "0")}</p>
              <div className="md:col-span-7">
                <p className="data-label">Week ending {post.week_end}</p>
                <h2 className="font-display text-3xl font-semibold mt-2">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="mt-3 text-sm max-w-xl">
                  {post.missing_dates.length > 0
                    ? `Captured on ${post.source_dates.join(", ")}. ${post.missing_dates.length} day${post.missing_dates.length === 1 ? " is" : "s are"} not currently retained.`
                    : "Complete seven-day source coverage."}
                </p>
              </div>
              <div className="md:col-span-3 md:border-l md:border-ink md:pl-6 grid grid-cols-2 gap-x-4 gap-y-3 self-start">
                <Metric label="Gained" value={post.summary.gained} />
                <Metric label="Lost" value={post.summary.lost} />
                <Metric label="Down" value={post.summary.downgraded} />
                <Metric label="Up" value={post.summary.upgraded} />
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="data-label text-[10px]">{label}</p>
      <p className="mono text-lg mt-1">{value.toLocaleString()}</p>
    </div>
  );
}
