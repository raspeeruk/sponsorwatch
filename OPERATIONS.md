# SponsorWatch public files

SponsorWatch has no database. The retained public input is
`data/source.snapshot.json.gz`, containing the Home Office register CSV,
dated public change history and weekly reports. Website builds read only this
validated file. They do not fetch from GitHub or the source pipeline.

`npm run build` exports the interactive shell and generates every company and
town page as HTML using the existing templates. `npm start` serves the exported
`out/` files, including profiles, search JSON, weekly reports and sitemaps.
Anonymous visits do no Next rendering and no database work. The existing contact
POST route is preserved by the small file server, including its server-log
recording and thank-you redirect. This change does not activate email delivery.

The source pipeline captures once daily. A publisher runs after its completed
capture, validates source age, matching current and dated CSV, source checksum,
register size, history and report completeness, then atomically retains changes.
Missing, corrupt, stale or unexpectedly reduced sources fail without replacing
the last good snapshot. A date-only update or new empty daily diff does not
request a hosting rebuild. The displayed date remains the retained source date.

The existing Railway refresh was paused on 28 September to avoid hosting costs.
That pause remains in place. The manual workflow needs `SPONSORS_DATA_TOKEN`
with read access to the existing private source repository. Once restoring the
site is explicitly authorized, enable its daily 11:45 UTC schedule. Do not revive
Netlify: `netlify.toml` deliberately ignores builds. No DNS change is required.

For a local completed source checkout:

```sh
SPONSORS_DATA_PATH=/path/to/certifyd-data-pipeline npm run data:refresh
npm run build
npm test
npm start
```

The snapshot records its immutable source commit and checksum. Its public data
contains no credentials, account records or contact submissions. The sitemap
keeps the existing URL cohort, split into files of at most 50,000 URLs.
