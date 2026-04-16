# SponsorWatch — Design Brief

**Domain**: sponsorwatch.co.uk
**Status**: Draft
**Date**: 2026-04-16

## Positioning

A public, free, daily-updated register of every UK Home Office licensed sponsor. Powered by the official gov.uk Workers register. Tracks additions, removals, and rating changes day-by-day. "Powered by Certifyd."

Target audience:
- HR and compliance managers checking on competitors or partners
- Prospective sponsored workers checking if a company is licensed
- Journalists and researchers tracking immigration sponsorship trends
- Government policy watchers

## Aesthetic — Civic Data

**Ordnance Survey meets gov.uk meets the Bank of England.** Trustworthy, institutional, information-dense. The visual language of public records — quiet authority, no marketing fluff, data as the hero.

### Registry check
Cross-referenced against `knowledge/design-registry.md`. Distinct from:
- **CensusWise** (Cartographic/Institutional) — we skip the contour line motif and run a tighter, less decorative grid.
- **OrgBrief** (Institutional Editorial) — no teal, no McKinsey voice; this is utility-first, not editorial.
- **AuditBrief** (Brutalist) — we keep structure and white space; no exposed grid lines.
- **EPC Check** (Utility/government) — we are deliberately more typographically confident; EPC Check uses system sans, we use a paired serif/grotesque.

### Unique hook
**The "Daily Bulletin" masthead**: the home page leads with today's date and a typewritten-feel line of statistics ("03 added · 11 removed · 2 rating changes") like the front bar of a civil service report. Every company page carries a sparkline of its licence status history along the top.

## Fonts

- **Headings**: `Fraunces` (variable) — weight 700, moderate optical size. Quiet confidence, slightly warm.
- **Body**: `Public Sans` — the UK government's design system typeface. Direct nod to gov.uk provenance.
- **Data / small caps / IDs**: `JetBrains Mono` — for licence numbers, dates, route codes.

No Inter. No Roboto. No system-ui default.

## Palette

One dominant color at 60-70%, one sharp accent, tinted neutrals.

| Token | Hex | Use |
|-------|-----|-----|
| `ink` | `#0B0E1A` | Body text, headings, borders |
| `paper` | `#F4F1EA` | Page background (warm stone, never #fff) |
| `paper-dim` | `#EAE5D9` | Card backgrounds, hovers |
| `rule` | `#1A1D2E` | Horizontal rules, section dividers |
| `crown` | `#1B4332` | Primary accent — heritage green, used on CTAs only |
| `flag` | `#C8102E` | Reserved for alerts: "LICENCE REVOKED", "B rating" |
| `ledger` | `#3E4D2F` | Secondary muted — verified, stable, active |
| `stamp` | `#8B6B2C` | Used for "new this week" badges, gold-on-paper |

Zero pure black, zero pure white. Everything on warm paper.

## Layout principles

- **Asymmetric 12-column grid**: 8/4 splits for hero/data, 7/5 for indexes.
- **Horizontal rules separate, cards do not**: use `1px solid ink` hairlines between blocks. Cards only where data is tabular.
- **Everything fixed-width**: max content width 1120px. No edge-to-edge anything.
- **Sparse iconography**: no icon library. Only a crown mark for official-source attribution and a simple status dot (●) for rating state.
- **Date-stamps everywhere**: every page shows "Updated DD MMM YYYY" in small caps, top-right.

## Type hierarchy

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Page title | Fraunces | 64px (desktop) | 700 |
| Section head | Fraunces | 32px | 600 |
| Body | Public Sans | 17px / 1.55 | 400 |
| Small print | Public Sans | 14px | 500, tracking 0.05em |
| Data label | JetBrains Mono | 13px | 500, uppercase |
| Stat digit | JetBrains Mono | 48px | 400 |

3x+ size jump between body and headings. Data digits are always monospace so they line up.

## Texture & background

- Page background is warm stone `#F4F1EA` with a very subtle 3% noise overlay.
- No gradients anywhere except a single `mix-blend-multiply` vignette on the home hero.
- Borders on tables and bulletin rows are 1px hairlines in `ink`.

## Component rules

- **Buttons**: primary = `crown` green fill, white text, no rounding. Secondary = underlined text link in `ink`, no button chrome.
- **Links**: underlined, `ink` colour, `crown` on hover. Never blue.
- **Forms**: full-width inputs, 1px `ink` bottom border only, no fills.
- **Tables**: zebra-stripe with `paper-dim`. Column headers in JetBrains Mono, small caps.
- **Badges**: `A rating` = ledger green dot. `B rating` = flag red dot. `New` = stamp gold dot with 4-week window.

## Favicon

A simple crown mark — monochrome `ink` on `paper`. Ships as `/app/icon.png` and `/public/favicon.ico`. Generated from the brand colour tokens.

## The Screenshot Test

If someone screenshots sponsorwatch.co.uk next to:
- A Certifyd product page → clearly NOT the same company (paper/ink civic vs dark fintech)
- CensusWise → different font pair, no contour motif
- Any Inter/Roboto site → instantly distinctive
- The gov.uk register download page → looks related but modern

Passes.

## Tone of voice

- Neutral, factual, third-person.
- Never say "amazing", "powerful", "the best". Say "the official register", "as of 16 April 2026", "2,341 sponsors added since 2025-04-16".
- Headlines are statements of fact, not promises. "Every UK licensed sponsor, updated daily" — not "Discover UK sponsors".
- Footer: "SponsorWatch — A public mirror of the UK Home Office Register of Licensed Sponsors (Workers). Updated daily from official data. Powered by Certifyd."
