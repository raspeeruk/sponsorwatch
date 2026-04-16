import Link from "next/link";
import type { Metadata } from "next";
import { getChangesFeed } from "@/lib/data";

export const metadata: Metadata = {
  title: "Daily changes to the UK sponsor register",
  description:
    "Every daily update to the UK Home Office Register of Licensed Sponsors — additions, removals, and rating changes.",
  alternates: { canonical: "/changes" },
};

export default function ChangesIndex() {
  const feed = getChangesFeed();
  return (
    <article className="container-main py-12">
      <p className="data-label"><Link href="/">Register</Link> / Daily changes</p>
      <h1 className="font-display text-4xl md:text-5xl font-bold mt-3">
        Daily changes
      </h1>
      <p className="mt-3 text-lg max-w-2xl">
        Every day SponsorWatch pulls the latest register and compares it to the previous day.
        Here is every change since we started tracking.
      </p>
      {feed.length === 0 ? (
        <p className="mt-10 data-label">
          First snapshot captured. Daily change history begins tomorrow.
        </p>
      ) : (
        <div className="mt-10 border border-ink">
          {feed.map((d) => (
            <Link
              key={d.date}
              href={`/changes/${d.date}`}
              className="grid grid-cols-12 items-baseline border-b border-ink last:border-b-0 px-4 py-3 no-underline hover:bg-paper-dim"
            >
              <span className="col-span-3 mono text-sm">{d.date}</span>
              <span className="col-span-3 text-sm"><span className="data-label">Added</span> <span className="mono">{d.added}</span></span>
              <span className="col-span-3 text-sm"><span className="data-label">Removed</span> <span className="mono">{d.removed}</span></span>
              <span className="col-span-3 text-sm"><span className="data-label">Changed</span> <span className="mono">{d.changed}</span></span>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
