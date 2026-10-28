import { defineConfig } from 'vitepress';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  title: 'SessionForge',
  description: 'Revocable refresh sessions for stateless authentication. Guides and API reference for SessionForge 0.1.0.',
  outDir: '../dist',
  lastUpdated: false,
  vite: { publicDir: fileURLToPath(new URL('../../../assets', import.meta.url)) },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/sessionforge-logo.png' }],
    ['meta', { name: 'theme-color', content: '#061d56' }],
  ],
  themeConfig: {
    logo: { src: '/sessionforge-logo.png', alt: 'SessionForge' },
    siteTitle: false,
    search: { provider: 'local' },
    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'API reference', link: '/reference/session-forge', activeMatch: '/reference/' },
      { text: 'v0.1.0', items: [{ text: 'Implementation status', link: '/guide/status' }] },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/mynameisankit/session-forge' }],
    sidebar: [
      { text: 'GETTING STARTED', items: [
        { text: 'Introduction', link: '/guide/introduction' },
        { text: 'Quick start', link: '/guide/getting-started' },
        { text: 'Implementation status', link: '/guide/status' },
      ] },
      { text: 'CORE CONCEPTS', items: [
        { text: 'Architecture', link: '/guide/architecture', items: [
          { text: 'Policies & Guarantees', link: '/guide/policies-guarantees' },
        ] },
        { text: 'Token lifecycle', link: '/guide/token-lifecycle' },
        { text: 'Revocation & security', link: '/guide/security' },
      ] },
      { text: 'GUIDES', items: [
        { text: 'SQLite adapter', link: '/guide/sqlite' },
        { text: 'Custom stores', link: '/guide/custom-stores' },
        { text: 'Session cleanup', link: '/guide/cleanup' },
        { text: 'Example application', link: '/guide/example' },
      ] },
      { text: 'API REFERENCE', items: [
        { text: 'SessionForge', link: '/reference/session-forge' },
        { text: 'SessionStore', link: '/reference/session-store' },
        { text: 'Utilities', link: '/reference/utilities' },
      ] },
    ],
    outline: { level: [2, 3], label: 'On this page' },
    footer: { message: 'Built for explicit authentication boundaries. Powered by VitePress.' },
  },
});
