# SessionForge documentation website

This site uses VitePress's default theme, local full-text search, Markdown pages,
syntax highlighting, copy buttons, responsive navigation, and light/dark mode.
The theme adds a small SessionForge color and typography override.

## Development

From `docs-site/`:

```sh
npm install
npm run dev
```

## Production build

```sh
npm run build
npm run preview
```

VitePress reads `content/` and emits static HTML and assets to `dist/`.
Configure navigation in `content/.vitepress/config.ts`. Edit the guide and API
reference Markdown files in `content/guide/` and `content/reference/`.

Docs describe the current v0.1.0 source, rather than the README's proposed API.
Update API pages and implementation status whenever the library contract changes.
The site is an independent npm project and does not change the library's Yarn
workspace dependencies.
