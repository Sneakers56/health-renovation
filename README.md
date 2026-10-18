# Health Renovation – website

Static site built with [Astro](https://astro.build). Replaces the WordPress theme.

## Run locally

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to dist/
```

## Editing

Everything is edited in one place: the visual editor at **/editor/** (built with [Puck](https://puckeditor.com)).

| Tab | What it edits | File(s) |
|---|---|---|
| Pages | Home, About, Contact, Book Online and any new page – drag blocks onto the page | src/content/pages/*.json |
| Services | Each service page: details in the panel, description as blocks | src/content/services/*.json |
| Blog | Articles: title, date, photo, draft switch; body as blocks | src/content/posts/*.json |
| Menu | Main menu links, dropdowns and the highlighted button | src/data/navigation.json |
| Testimonials | Client quotes shown by the Testimonials block | src/data/testimonials.json |
| Business details | Name, phone, email, location, hours, social links, announcement bar, Google Analytics | src/data/site.json |

Photos are uploaded from any photo field and saved to src/assets/images/.

Every page, service and article is a Puck document. The same React components render the editor canvas and the live site (server-rendered to plain HTML, no editor code shipped to visitors). Blocks live in src/puck/blocks.tsx; page, service and article templates in src/puck/config.tsx; settings editors in src/puck/settings.tsx.

### Editing locally

`npm run dev`, then open http://localhost:4321/editor/. Saving writes straight to the project files (a small dev-only API in scripts/editor-dev-api.mjs).

### Editing on the live site

Open https://<site>/editor/ and log in with GitHub (via Netlify: Project configuration → Access & security → OAuth → GitHub). Publishing commits to Sneakers56/health-renovation and Netlify rebuilds in about a minute. If you also edit locally, run `git pull` first.

## Deploy (Netlify, free tier)

1. Push this folder to a GitHub repo.
2. Netlify → Add new site → Import from GitHub. Build settings are read from `netlify.toml`.
3. Point `healthrenovation.com.au` at Netlify (Domain management).
4. Contact form submissions appear under Netlify → Forms. Add an email notification there so they go to Mark.
