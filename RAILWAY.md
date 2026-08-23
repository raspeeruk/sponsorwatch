# Sponsor Watch on Railway

Sponsor Watch is a build-time data site. The private `certifyd-data-pipeline`
repository is read during `npm run build`, and the resulting `.data/static`
files are served by the Next.js server. A data refresh therefore needs a new
Railway deployment, not an in-process refresh or a shared filesystem between
services.

## Services

Create these two services in one Railway project:

1. `sponsorwatch-web`, connected to `raspeeruk/sponsorwatch` on `main`.
2. `sponsorwatch-refresh`, using the public image
   `ghcr.io/railwayapp/cli:latest`.

The web service uses the repository's `railway.json`. It builds with
`npm run build` and serves with `npm run start`.

The refresh service is a Railway Cron Job. Set its start command to:

```sh
sh -c 'railway redeploy --from-source --project "$RAILWAY_PROJECT_ID" --environment "$RAILWAY_ENVIRONMENT_ID" --service "$SPONSORWATCH_WEB_SERVICE_ID" --yes'
```

Set its schedule to `17 6 * * *` (06:17 UTC daily). The command triggers a
fresh source build of the web service, so `scripts/prebuild.ts` runs again and
pulls the newest private CSV and diff history. The cron process must exit after
triggering the deployment.

## Variables

On `sponsorwatch-web`:

- `GITHUB_TOKEN`: a fine-grained GitHub token with read-only Contents access to
  `raspeeruk/certifyd-data-pipeline`.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: the existing measurement ID, if analytics is
  being carried over.

On `sponsorwatch-refresh`:

- `RAILWAY_TOKEN`: a project-scoped Railway token for the project containing
  Sponsor Watch.
- `RAILWAY_PROJECT_ID`: the Railway project ID.
- `RAILWAY_ENVIRONMENT_ID`: the production environment ID.
- `SPONSORWATCH_WEB_SERVICE_ID`: the ID of `sponsorwatch-web`.

Do not put either token in Git, `.env` files, build logs, or this document.
The private GitHub token belongs only on the web service because that is where
the actual build runs.

## First deployment and cutover

1. Create `sponsorwatch-web`, add `GITHUB_TOKEN`, and deploy it.
2. Generate a Railway domain and verify the homepage, a company page, a town
   page, `/changes`, `/sitemap.xml`, `/robots.txt`, and the contact form.
3. Create `sponsorwatch-refresh`, add its variables, set the daily schedule,
   and run one manual cron execution. Confirm the web deployment log shows
   `prebuild` fetching the private source and a current `csvDate` in
   `.data/static/build-manifest.json`.
4. Attach `sponsorwatch.co.uk` to the web service and switch DNS to Railway.
5. Once the Railway hostname serves correctly, disconnect the old Netlify site
   from GitHub and remove or disable its remaining production deployment.

The old Netlify repository configuration intentionally skips future Git
builds during this cutover. It can be removed after Netlify is disconnected.

## One rebuild now

After `GITHUB_TOKEN` is saved on the web service, trigger the first rebuild from
the Railway dashboard by redeploying `sponsorwatch-web` from source, or run:

```sh
RAILWAY_TOKEN='project-token' railway redeploy \
  --from-source \
  --project 'project-id' \
  --environment 'environment-id' \
  --service 'web-service-id' \
  --yes
```

The token value is shown only as a placeholder here. Do not paste a real token
into shell history or commit it.
