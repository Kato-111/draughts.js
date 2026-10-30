import type { Color } from './types'
import {
  BLACK_KING,
  BLACK_MAN,
  EMPTY,
  WHITE_KING,
  WHITE_MAN,
  isKing,
  sideOf,
} from './squares'

export const START_FEN =
  'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20'

export type FenResult =
  | { ok: true; board: Uint8Array; turn: Color }
  | { ok: false; error: string }

export function validateFen(fen: string): { ok: true } | { ok: false; error: string } {
  const parsed = parseFen(fen)
  if (!parsed.ok) return parsed
  return { ok: true }
}

export function parseFen(fen: string): FenResult {
  const text = fen.trim()
  if (/\s/.test(text)) return { ok: false, error: 'FEN must not contain spaces' }
  const parts = text.split(':')
  if (parts.length !== 3) {
    return { ok: false, error: 'FEN must be turn:white:black' }
  }
  const turn = parseColor(parts[0])
  if (turn === null || parts[0].length !== 1) {
    return { ok: false, error: 'side to move must be W or B' }
  }
  const board = new Uint8Array(51)
  const seen = new Set<number>()
  const colours = new Set<Color>()
  for (const section of [parts[1], parts[2]]) {
    const parsed = parseSection(section)
    if (typeof parsed === 'string') return { ok: false, error: parsed }
    if (colours.has(parsed.color)) {
      return { ok: false, error: `colour ${parsed.color.toUpperCase()} is listed twice` }
    }
    colours.add(parsed.color)
    for (const piece of parsed.pieces) {
      if (seen.has(piece.sq)) return { ok: false, error: `duplicate square ${piece.sq}` }
      seen.add(piece.sq)
      board[piece.sq] = piece.king
        ? parsed.color === 'w'
          ? WHITE_KING
          : BLACK_KING
        : parsed.color === 'w'
          ? WHITE_MAN
          : BLACK_MAN
    }
  }
  if (!colours.has('w') || !colours.has('b')) {
    return { ok: false, error: 'FEN must list both colours' }
  }
  return { ok: true, board, turn }
}

export function writeFen(board: Uint8Array, turn: Color): string {
  const white: { sq: number; code: number }[] = []
  const black: { sq: number; code: number }[] = []
  for (let sq = 1; sq <= 50; sq++) {
    const code = board[sq]
    if (code === EMPTY) continue
    const side = sideOf(code)
    if (side === 'w') white.push({ sq, code })
    else if (side === 'b') black.push({ sq, code })
  }
  return `${turn.toUpperCase()}:W${labels(white)}:B${labels(black)}`
}

export function emptyBoard(): Uint8Array {
  return new Uint8Array(51)
}

function labels(pieces: { sq: number; code: number }[]): string {
  pieces.sort((a, b) => a.sq - b.sq)
  return pieces.map((piece) => `${isKing(piece.code) ? 'K' : ''}${piece.sq}`).join(',')
}

function parseColor(text: string): Color | null {
  const value = text.toUpperCase()
  if (value === 'W') return 'w'
  if (value === 'B') return 'b'
  return null
}

function parseSection(
  section: string,
): { color: Color; pieces: { sq: number; king: boolean }[] } | string {
  if (section.length === 0) return 'missing colour marker'
  const color = parseColor(section[0])
  if (color === null) return 'colour marker must be W or B'
  const rest = section.slice(1)
  if (rest.length === 0) return { color, pieces: [] }
  const pieces: { sq: number; king: boolean }[] = []
  for (const token of rest.split(',')) {
    const placed = parseRange(token)
    if (typeof placed === 'string') return placed
    pieces.push(...placed)
  }
  return { color, pieces }
}

function parseRange(token: string): { sq: number; king: boolean }[] | string {
  const king = token[0] === 'K' || token[0] === 'k'
  const body = king ? token.slice(1) : token
  if (body.length === 0 || body.includes('K') || body.includes('k')) {
    return `invalid piece ${token}`
  }
  const bounds = body.split('-')
  if (bounds.length > 2 || bounds.some((part) => !/^\d+$/.test(part))) {
    return `invalid piece ${token}`
  }
  const start = Number(bounds[0])
  const end = Number(bounds.length === 2 ? bounds[1] : bounds[0])
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end > 50 || start > end) {
    return `square out of range in ${token}`
  }
  const pieces: { sq: number; king: boolean }[] = []
  for (let sq = start; sq <= end; sq++) pieces.push({ sq, king })
  return pieces
}
