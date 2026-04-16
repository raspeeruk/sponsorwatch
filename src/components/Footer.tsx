import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink">
      <div className="container-main py-10 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <p className="data-label mb-3">About</p>
          <p className="leading-relaxed">
            SponsorWatch is a public mirror of the UK Home Office{" "}
            <a href="https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers">
              Register of Licensed Sponsors (Workers)
            </a>
            . Data is refreshed daily from the official publication. We do not alter the
            register — we track what&apos;s added, removed, and changed, day by day.
          </p>
        </div>
        <div>
          <p className="data-label mb-3">Index</p>
          <ul className="space-y-1">
            <li><Link href="/changes">Daily changes</Link></li>
            <li><Link href="/routes">By visa route</Link></li>
            <li><Link href="/towns">By town</Link></li>
            <li><Link href="/for/healthcare">By industry</Link></li>
          </ul>
        </div>
        <div>
          <p className="data-label mb-3">Powered by Certifyd</p>
          <p className="leading-relaxed mb-3">
            Your company is a licensed sponsor. Are your staff&apos;s Right to Work documents
            current?
          </p>
          <a
            href="https://certifyd.io"
            className="btn-primary text-sm"
          >
            Certifyd RTW Portal →
          </a>
        </div>
      </div>
      <div className="container-main py-4 border-t border-ink/20">
        <p className="data-label text-[11px]">
          © {new Date().getFullYear()} SponsorWatch · Data source: gov.uk OGL v3 · A Certifyd project
        </p>
      </div>
    </footer>
  );
}
