"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Hit = { s: string; n: string; t: string };

export function SearchBox() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const indexRef = useRef<Hit[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q || q.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    (async () => {
      if (!indexRef.current) {
        setLoading(true);
        const res = await fetch("/search-index.json");
        indexRef.current = (await res.json()) as Hit[];
        setLoading(false);
      }
      if (cancelled) return;
      const needle = q.toLowerCase();
      const list: Hit[] = [];
      for (const h of indexRef.current!) {
        if (h.n.toLowerCase().includes(needle)) {
          list.push(h);
          if (list.length >= 15) break;
        }
      }
      setHits(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [q]);

  return (
    <div>
      <div className="flex items-center border border-ink bg-paper">
        <span className="data-label px-3">Search</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Company name — e.g. Tesco, NHS, Deloitte"
          className="flex-1 bg-transparent py-3 pr-4 outline-none text-lg"
          autoComplete="off"
        />
      </div>
      {q.length >= 2 && (
        <div className="mt-2 border border-ink bg-paper">
          {loading && <p className="px-3 py-2 data-label">Loading…</p>}
          {!loading && hits.length === 0 && (
            <p className="px-3 py-2 data-label">No matches in the top 20,000 sponsors.</p>
          )}
          {hits.map((h) => (
            <Link
              key={h.s}
              href={`/company/${h.s}`}
              className="block px-3 py-2 border-b border-ink/30 last:border-b-0 no-underline hover:bg-paper-dim"
            >
              <span className="block">{h.n}</span>
              <span className="data-label text-[11px]">{h.t}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
