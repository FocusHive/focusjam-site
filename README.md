# FocusJam Site

_Last verified: 2026-11-10._

Public showcase for [FocusJam](https://focusjam.com), FocusHive's sovereign AI
meeting platform.

## Domains

- `focusjam.com` (and `www`) is this site: the only public FocusJam surface.
- The FocusJam application lives on private, Ziti-only hostnames. This site must
  never link to them (enforced by `tests/public-surface.spec.ts`); calls to
  action go to the demo request page (`contact.html`).

## Copy rules

Describe benefits, not internals. Do not name internal hostnames, the
infrastructure, or the technology stack in page copy (the public-surface test
fails the pipeline if it finds them).

## Development

The site is dependency-free HTML, CSS, and JavaScript. Serve the repository
root with any static file server:

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080`. `npm run serve` does the same on port 4173
(the port the Playwright config uses).

## Tests and CI

The site itself has no runtime dependencies; `@playwright/test` is the only
dev dependency. `npm run test:e2e` runs the specs in `tests/` (navigation,
pages, pricing, branding, links, contrast, accessibility, mobile nav, and the
public-surface rule above). GitLab CI (`.gitlab-ci.yml`) runs HTMLHint and
Stylelint, then the Playwright e2e job, a link check and pa11y-ci (the last two
are allowed to fail). CI builds and deploys nothing.

## Deployment

GitHub Pages publishes the repository root with `focusjam.com` (see `CNAME`) as
its custom domain. GitLab is the source of truth; GitHub is the deployment
mirror (the CI file documents a push mirror of `main`). There is no cluster
deployment. Checked 2026-11-10: `https://focusjam.com` answers HTTP 200 and its
`last-modified` (2026-11-07) matches the latest change on `main`.

Owner seat: focushive (escalation: FocusHive/Overview#1).
