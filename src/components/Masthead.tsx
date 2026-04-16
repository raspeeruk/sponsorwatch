import Link from "next/link";
import { getStats } from "@/lib/data";

export function Masthead() {
  const stats = getStats();
  return (
    <header className="border-b border-ink">
      <div className="container-main flex items-center justify-between py-4">
        <Link href="/" className="no-underline">
          <div className="flex items-baseline gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 9 L6 4 L9 8 L12 3 L15 8 L18 4 L21 9 L21 18 L3 18 Z"
                stroke="#0B0E1A"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
            <span className="font-display text-xl font-bold tracking-tight">SponsorWatch</span>
            <span className="data-label hidden sm:inline">UK Register · Daily</span>
          </div>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/changes">Changes</Link>
          <Link href="/routes">Routes</Link>
          <Link href="/towns">Towns</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
      <div className="container-main py-2">
        <p className="data-label text-[11px]">
          As of {stats.asOf} · {stats.totalCompanies.toLocaleString()} companies · {stats.totalLicences.toLocaleString()} licences
        </p>
      </div>
    </header>
  );
}
