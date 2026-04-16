import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Masthead } from "@/components/Masthead";

export const metadata: Metadata = {
  metadataBase: new URL("https://sponsorwatch.co.uk"),
  title: {
    default: "SponsorWatch — UK Licensed Sponsor Register",
    template: "%s · SponsorWatch",
  },
  description:
    "A public mirror of the UK Home Office Register of Licensed Sponsors (Workers). Updated daily with additions, removals and rating changes. Powered by Certifyd.",
  openGraph: {
    type: "website",
    siteName: "SponsorWatch",
    title: "SponsorWatch — UK Licensed Sponsor Register",
    description:
      "Every UK licensed sponsor, updated daily from official Home Office data.",
    url: "https://sponsorwatch.co.uk",
  },
  icons: { icon: "/favicon.ico" },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
              }}
            />
          </>
        )}
      </head>
      <body>
        <Masthead />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
