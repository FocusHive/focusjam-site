# FocusJam Site

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

Then open `http://localhost:8080`.

## Deployment

GitHub Pages publishes the repository root with `focusjam.com` as its custom
domain. GitLab is the source of truth; GitHub is the deployment mirror.
