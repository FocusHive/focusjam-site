# FocusJam Site

Public showcase for [FocusJam](https://focusjam.com), FocusHive's sovereign AI
meeting platform.

## Domains

- `focusjam.com` — public product showcase
- `app.focusjam.com` — authenticated application
- `join.focusjam.com` — meeting invitation and join flow
- `admin.focusjam.com` — private administrative console

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
