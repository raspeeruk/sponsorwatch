"use client";

import Link from "next/link";
import { useState } from "react";
import type { BlogEntry, BlogReport } from "@/lib/data";

export function CompleteReport({ slug }: { slug: string }) {
  const [report, setReport] = useState<BlogReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function loadReport() {
    if (report || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/blog-data/${slug}.json`, { cache: "force-cache" });
      if (!response.ok) throw new Error("Report unavailable");
      setReport(await response.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (!report) {
    return (
      <section className="mt-14 border-t border-ink pt-6 max-w-3xl">
        <p className="data-label">Complete register ledger</p>
        <h2 className="font-display text-3xl font-semibold mt-2">Every gained, lost, downgraded and upgraded record</h2>
        <p className="mt-3">
          The complete lists are kept as a separate source file so this page stays quick to read. Load them when you want to inspect every record.
        </p>
        <button className="btn-primary mt-5" type="button" onClick={loadReport} disabled={loading}>
          {loading ? "Loading complete ledger..." : "Load complete ledger"}
        </button>
        {error && <p className="mt-3 text-[#C8102E]">The complete report could not be loaded. Use the JSON link below instead.</p>}
      </section>
    );
  }

  return (
    <div className="mt-14 max-w-5xl">
      <EntrySection title="Sponsors gained" description="Records appearing in the register during the captured week." entries={report.gained} tone="status-A" />
      <EntrySection title="Sponsors lost" description="Records no longer appearing in the register during the captured week." entries={report.lost} tone="status-B" />
      <TransitionSection title="Downgraded" entries={report.downgraded} tone="status-B" />
      <TransitionSection title="Upgraded" entries={report.upgraded} tone="status-A" />
      {report.other_rating_changes.length > 0 && (
        <TransitionSection title="Other rating field changes" entries={report.other_rating_changes} tone="status-Provisional" />
      )}
    </div>
  );
}

function EntrySection({ title, description, entries, tone }: { title: string; description: string; entries: BlogEntry[]; tone: string }) {
  return (
    <section className="mt-14 border-t border-ink pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-3xl font-semibold"><span className={`status-dot ${tone}`} />{title}</h2>
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
        <h2 className="font-display text-3xl font-semibold"><span className={`status-dot ${tone}`} />{title}</h2>
        <p className="data-label">{entries.length.toLocaleString()} records</p>
      </div>
      {entries.length > 0 ? <EntryList entries={entries} transition /> : <p className="mt-4 data-label">None recorded.</p>}
    </section>
  );
}

function EntryList({ entries, transition = false }: { entries: BlogEntry[]; transition?: boolean }) {
  return (
    <details className="mt-5 group" open={entries.length <= 50}>
      <summary className="cursor-pointer data-label border-y border-ink py-3 list-none flex justify-between">
        <span>Show complete list</span><span className="group-open:hidden">+</span><span className="hidden group-open:inline">-</span>
      </summary>
      <ul className="border-b border-ink">
        {entries.map((entry, index) => (
          <EntryRow key={`${entry.date}-${entry["Organisation Name"]}-${entry["Town/City"]}-${entry.Route}-${index}`} entry={entry} transition={transition} />
        ))}
      </ul>
    </details>
  );
}

function EntryRow({ entry, transition }: { entry: BlogEntry; transition: boolean }) {
  const name = entry["Organisation Name"];
  const label = entry.companySlug ? <Link href={`/company/${entry.companySlug}`}>{name}</Link> : name;
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
