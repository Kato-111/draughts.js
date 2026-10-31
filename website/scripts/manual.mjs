import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const docs = join(root, 'src/content/docs')
const pages = ['index.md', 'installation.md', 'rules.md', 'notation.md', 'fen.md', 'pdn.md', 'api.md']

function page(name) {
  const text = readFileSync(join(docs, name), 'utf8')
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  const meta = match?.[1] ?? ''
  const title = meta.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? name
  const body = (match ? text.slice(match[0].length) : text)
    .trim()
  return `# ${title}\n\n${body}\n`
}

const manual = [
  '# draughts.js',
  '',
  'The draughts.js manual in one file. Sections follow the documentation sidebar, in order: Overview, Installation, Rules, Notation, FEN, PDN, API.',
  '',
  'https://kato-111.github.io/draughts.js/draughts.md',
  '',
  pages.map(page).join('\n'),
].join('\n')

writeFileSync(join(root, 'public/draughts.md'), manual)
