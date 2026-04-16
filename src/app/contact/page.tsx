import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact SponsorWatch",
  description: "Report a data error or get in touch with the SponsorWatch team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <article className="container-main py-12 max-w-xl">
      <p className="data-label"><Link href="/">Register</Link> / Contact</p>
      <h1 className="font-display text-4xl font-bold mt-3">Contact SponsorWatch</h1>
      <p className="mt-3">
        Spotted an error in the register? Want alerts when a company&apos;s status changes? Send us
        a note.
      </p>
      <form action="/api/contact" method="POST" className="mt-8 space-y-5">
        <div>
          <label className="data-label">Your name</label>
          <input
            name="name"
            required
            className="mt-1 w-full border-b border-ink bg-transparent py-2 outline-none focus:border-crown"
          />
        </div>
        <div>
          <label className="data-label">Email</label>
          <input
            type="email"
            name="email"
            required
            className="mt-1 w-full border-b border-ink bg-transparent py-2 outline-none focus:border-crown"
          />
        </div>
        <div>
          <label className="data-label">Company (optional)</label>
          <input
            name="company"
            className="mt-1 w-full border-b border-ink bg-transparent py-2 outline-none focus:border-crown"
          />
        </div>
        <div>
          <label className="data-label">Message</label>
          <textarea
            name="message"
            rows={5}
            required
            className="mt-1 w-full border border-ink bg-transparent p-2 outline-none focus:border-crown"
          />
        </div>
        <button type="submit" className="btn-primary">Send →</button>
      </form>
    </article>
  );
}
