import Link from "next/link";
import type { Metadata } from "next";
import { getTownIndex } from "@/lib/data";

export const metadata: Metadata = {
  title: "UK towns with licensed visa sponsors",
  description:
    "Browse UK visa sponsors by town. Every UK town with at least one Home Office licensed sponsor.",
  alternates: { canonical: "/towns" },
};

export default function TownsIndex() {
  const towns = getTownIndex();
  return (
    <article className="container-main py-12">
      <p className="data-label"><Link href="/">Register</Link> / Towns</p>
      <h1 className="font-display text-4xl md:text-5xl font-bold mt-3">
        Sponsors by town
      </h1>
      <p className="mt-3 text-lg max-w-2xl">
        <span className="mono">{towns.length.toLocaleString()}</span> UK towns with at least one licensed sponsor. Ordered by count.
      </p>
      <ul className="mt-10 border-t border-ink columns-1 md:columns-3 gap-8">
        {towns.map((t) => (
          <li key={t.slug} className="border-b border-ink break-inside-avoid">
            <Link
              href={`/town/${t.slug}`}
              className="flex items-baseline justify-between py-2 no-underline hover:bg-paper-dim"
            >
              <span>{t.name}</span>
              <span className="mono text-xs">{t.count.toLocaleString()}</span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
