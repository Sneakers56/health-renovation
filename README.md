# Health Renovation – website

Static site built with [Astro](https://astro.build). Replaces the WordPress theme.

## Run locally

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to dist/
```

## Editing

There are two editors:

- **Visual page editor – `/editor/`.** Drag-and-drop editing of every page (Home, About, Contact, Book Online and any new page). Drag blocks from the left onto the live page, drop them into columns, click anything to edit it, then **Publish**. Built with [Puck](https://puckeditor.com).
- **Content editor – `/admin/`.** Services, blog articles, the menu, testimonials and business details (Decap CMS).

| What | File | Edited in |
|---|---|---|
| Pages | `src/content/pages/*.json` | /editor/ |
| Services (one page each) | `src/content/services/*.md` | /admin/ |
| Blog articles | `src/content/posts/*.md` (`draft: true` = not published) | /admin/ |
| Menu | `src/data/navigation.json` | /admin/ |
| Testimonials | `src/data/testimonials.json` | /admin/ |
| Business details, announcement bar, Google Analytics | `src/data/site.json` | /admin/ |
| Photos | `src/assets/images/` | both (upload from either) |

**Page blocks** (`src/puck/blocks.tsx`): Section, Columns, Spacer, Divider · Heading, Text, Image, Button, Video, Icon card, Quote · plus ready-made sections (intro with photo, banner, highlights bar, text, photo + text, cards, services grid, tags, FAQ, call to action, contact form, online booking, gallery, testimonials, latest articles). Every block has a *Hide on site* switch.

The same React blocks render the editor canvas and the live pages (server-rendered to plain HTML – no editor code ships to visitors).

**Online booking:** paste the booking page address from Cliniko, Halaxy, Acuity etc. into an *Online booking* block. Until then it shows call/text buttons.

### Editing locally

Run each in its own terminal:

```bash
npm run dev
```

```bash
npm run cms
```

Then open http://localhost:4321/editor/ (pages) or http://localhost:4321/admin/index.html (everything else). Saves write straight to the project files.

## Deploy (Netlify, free tier)

1. Push this folder to a GitHub repo.
2. Netlify → Add new site → Import from GitHub. Build settings are read from `netlify.toml`.
3. Point `healthrenovation.com.au` at Netlify (Domain management).
4. Contact form submissions appear under Netlify → Forms. Add an email notification there so they go to Mark.

## Logging in on the live site (`/editor` and `/admin`)

1. `public/admin/config.yml` points at the GitHub repo (`Sneakers56/health-renovation`).
2. Netlify → Site configuration → Access & security → OAuth → install the GitHub provider.
3. Mark logs in at `/editor/` or `/admin/` with GitHub (one login works for both). Publishing commits to GitHub and the site rebuilds in about a minute.
