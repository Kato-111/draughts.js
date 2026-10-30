import type { Color } from './types'

export type PdnHeader = { key: string; value: string }

export type PdnToken =
  | { type: 'move'; san: string; suffix: string }
  | { type: 'comment'; text: string }
  | { type: 'result'; value: string }
  | { type: 'lparen' }
  | { type: 'rparen' }

export function parsePdn(input: string): { headers: PdnHeader[]; tokens: PdnToken[] } {
  const source = input.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const headers: PdnHeader[] = []
  let i = 0
  while (i < source.length) {
    while (i < source.length && (source[i] === ' ' || source[i] === '\t' || source[i] === '\n')) i++
    if (source[i] === ';' || source[i] === '%') {
      while (i < source.length && source[i] !== '\n') i++
      continue
    }
    if (source[i] !== '[') break
    const close = source.indexOf(']', i)
    if (close < 0) throw new Error('PDN: unclosed header')
    const inside = source.slice(i + 1, close).trim()
    const header = /^([A-Za-z0-9_]+)\s+"([^"]*)"$/.exec(inside)
    if (!header) throw new Error(`PDN: invalid header [${inside}]`)
    headers.push({ key: header[1], value: header[2] })
    i = close + 1
  }
  return { headers, tokens: tokenize(source.slice(i)) }
}

export function formatPdn(args: {
  headers: Iterable<[string, string]>
  initialTurn: Color
  moves: { color: Color; san: string; suffix: string }[]
  comments: Map<number, string>
  newline: string
  maxWidth: number
}): string {
  const { newline, maxWidth } = args
  const headerText = [...args.headers]
    .map(([key, value]) => `[${key} "${value}"]`)
    .join(newline)
  const words: string[] = []
  const start = args.comments.get(0)
  if (start) words.push(`{${start}}`)
  let number = 1
  for (let i = 0; i < args.moves.length; i++) {
    const move = args.moves[i]
    const body = move.san + move.suffix
    if (move.color === 'w') {
      words.push(`${number}.`, body)
    } else if (i === 0 && args.initialTurn === 'b') {
      words.push(`${number}...`, body)
      number++
    } else {
      words.push(body)
      number++
    }
    const comment = args.comments.get(i + 1)
    if (comment) words.push(`{${comment}}`)
  }
  const result = resultOf(args.headers)
  if (result) words.push(result)
  const movetext = wrap(words.join(' '), maxWidth, newline)
  if (!headerText) return movetext
  if (!movetext) return headerText + newline
  return headerText + newline + newline + movetext
}

function resultOf(headers: Iterable<[string, string]>): string {
  for (const [key, value] of headers) {
    if (key.toLowerCase() === 'result') return value
  }
  return '*'
}

function wrap(text: string, width: number, newline: string): string {
  if (!text || width <= 0) return text
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    if (!line) line = word
    else if (line.length + 1 + word.length > width) {
      lines.push(line)
      line = word
    } else line += ` ${word}`
  }
  if (line) lines.push(line)
  return lines.join(newline)
}

function tokenize(text: string): PdnToken[] {
  const tokens: PdnToken[] = []
  let i = 0
  while (i < text.length) {
    const c = text[i]
    if (c === ' ' || c === '\t' || c === '\n') {
      i++
      continue
    }
    if (c === ';') {
      while (i < text.length && text[i] !== '\n') i++
      continue
    }
    if (c === '%') {
      while (i < text.length && text[i] !== '\n') i++
      continue
    }
    if (c === '{') {
      const close = text.indexOf('}', i + 1)
      if (close < 0) throw new Error('PDN: unclosed comment')
      tokens.push({ type: 'comment', text: text.slice(i + 1, close).trim() })
      i = close + 1
      continue
    }
    if (c === '(') {
      tokens.push({ type: 'lparen' })
      i++
      continue
    }
    if (c === ')') {
      tokens.push({ type: 'rparen' })
      i++
      continue
    }
    if (c === '$') {
      i++
      while (i < text.length && text[i] >= '0' && text[i] <= '9') i++
      continue
    }
    const rest = text.slice(i)
    const result = /^(1\/2-1\/2|1-0|0-1|\*)(?![\d/])/.exec(rest)
    if (result) {
      tokens.push({ type: 'result', value: result[1] })
      i += result[1].length
      continue
    }
    const number = /^(\d+)(\.+)(?=\s|\d|\{|\(|$)/.exec(rest)
    if (number) {
      i += number[0].length
      continue
    }
    const move = /^(\d+(?:[-x:]\d+)+)([!?+*=]+)?/.exec(rest)
    if (move) {
      tokens.push({ type: 'move', san: move[1], suffix: move[2] ?? '' })
      i += move[0].length
      continue
    }
    throw new Error(`PDN: invalid text near "${rest.slice(0, 24)}"`)
  }
  return tokens
}
