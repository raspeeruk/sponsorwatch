# Sponsor Watch on Railway

Sponsor Watch is a build-time data site. The private `certifyd-data-pipeline`
repository is read during `npm run build`, and the resulting `.data/static`
files are served by the Next.js server. A data refresh therefore needs a new
Railway deployment, not an in-process refresh or a shared filesystem between
services.

## Service

Use one Railway service, `sponsorwatch-web`, connected to
`raspeeruk/sponsorwatch` on `main`. A scheduled GitHub Action updates a small
refresh marker after the source scraper runs. That commit triggers the Railway
GitHub integration and causes a fresh build.

The web service uses the repository's `railway.json`. It builds with
`npm run build` and serves with `npm run start`.

The refresh workflow runs at 11:45 UTC, after the source scraper's 10:30 UTC
run. The marker commit triggers a fresh source build, so `scripts/prebuild.ts`
runs again and pulls the newest private CSV and diff history.

## Variables

On `sponsorwatch-web`:

- `GITHUB_TOKEN`: a fine-grained GitHub token with read-only Contents access to
  `raspeeruk/certifyd-data-pipeline`.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: the existing measurement ID, if analytics is
  being carried over.

Do not put the token in Git, `.env` files, build logs, or this document.
The private GitHub token belongs only on the web service because that is where
the actual build runs.

## First deployment and cutover

1. Create `sponsorwatch-web`, add `GITHUB_TOKEN`, and deploy it.
2. Generate a Railway domain and verify the homepage, a company page, a town
   page, `/changes`, `/sitemap.xml`, `/robots.txt`, and the contact form.
3. Run the `Refresh Sponsor Watch on Railway` workflow manually once. Confirm
   the resulting Railway deployment log shows `prebuild` fetching the private
   source and a current `csvDate` in `.data/static/build-manifest.json`.
4. Attach `sponsorwatch.co.uk` to the web service and switch DNS to Railway.
5. Once the Railway hostname serves correctly, disconnect the old Netlify site
   from GitHub and remove or disable its remaining production deployment.

The old Netlify repository configuration intentionally skips future Git
builds during this cutover. It can be removed after Netlify is disconnected.

## One rebuild now

After `GITHUB_TOKEN` is saved on the web service, run the
`Refresh Sponsor Watch on Railway` workflow manually. It creates a refresh
marker commit, which is the Railway deployment trigger.
