import Link from "next/link";
import type { Metadata } from "next";
import { getRouteIndex } from "@/lib/data";

export const metadata: Metadata = {
  title: "All UK visa routes with sponsor licences",
  description:
    "Browse UK Home Office sponsor licences by visa route — Skilled Worker, Global Business Mobility, Creative Worker and more.",
  alternates: { canonical: "/routes" },
};

export default function RoutesIndex() {
  const routes = getRouteIndex();
  return (
    <article className="container-main py-12">
      <p className="data-label"><Link href="/">Register</Link> / Routes</p>
      <h1 className="font-display text-4xl md:text-5xl font-bold mt-3">
        Sponsors by visa route
      </h1>
      <p className="mt-3 text-lg max-w-2xl">
        Every visa route in the UK&apos;s Worker and Temporary Worker sponsor system, with a count
        of licensed sponsors.
      </p>
      <ul className="mt-10 border-t border-ink">
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
    </article>
  );
}
