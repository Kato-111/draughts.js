// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  site: 'https://kato-111.github.io',
  base: '/draughts.js',
  integrations: [
    starlight({
      title: 'draughts.js',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/Kato-111/draughts.js',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/Kato-111/draughts.js/edit/main/website/',
      },
      sidebar: [
        { label: 'Overview', slug: 'index' },
        { label: 'Installation', slug: 'installation' },
        { label: 'Rules', slug: 'rules' },
        { label: 'Notation', slug: 'notation' },
        { label: 'FEN', slug: 'fen' },
        { label: 'PDN', slug: 'pdn' },
        { label: 'API', slug: 'api' },
      ],
    }),
  ],
})
