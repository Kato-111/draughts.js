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
      sidebar: [{ label: 'Manual', slug: 'index' }],
    }),
  ],
})
