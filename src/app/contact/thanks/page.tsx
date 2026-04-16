import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thanks",
  robots: { index: false },
};

export default function Thanks() {
  return (
    <article className="container-main py-20 max-w-xl">
      <h1 className="font-display text-4xl font-bold">Noted.</h1>
      <p className="mt-3">Thanks — we&apos;ll get back to you within a working day.</p>
      <Link href="/" className="btn-primary mt-8">Back to the register →</Link>
    </article>
  );
}
