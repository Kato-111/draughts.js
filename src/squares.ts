import type { Color } from './types'

export const EMPTY = 0
export const WHITE_MAN = 1
export const WHITE_KING = 2
export const BLACK_MAN = 3
export const BLACK_KING = 4

export type PieceCode = 0 | 1 | 2 | 3 | 4

/** NW, NE, SW, SE. White men move NW and NE. */
export const DIRS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const

const WHITE_FORWARD = [0, 1]
const BLACK_FORWARD = [2, 3]

export function rowOf(sq: number): number {
  return Math.floor((sq - 1) / 5)
}

export function colOf(sq: number): number {
  const row = rowOf(sq)
  const index = (sq - 1) % 5
  return row % 2 === 0 ? index * 2 + 1 : index * 2
}

/** Dark square at this 10×10 coordinate, or null when the square is light or off the board. */
export function squareAt(row: number, col: number): number | null {
  if (row < 0 || row > 9 || col < 0 || col > 9) return null
  const dark = row % 2 === 0 ? col % 2 === 1 : col % 2 === 0
  if (!dark) return null
  const index = row % 2 === 0 ? (col - 1) / 2 : col / 2
  return row * 5 + index + 1
}

export function isSquare(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 50
}

export function isKing(piece: number): boolean {
  return piece === WHITE_KING || piece === BLACK_KING
}

export function sideOf(piece: number): Color | null {
  if (piece === WHITE_MAN || piece === WHITE_KING) return 'w'
  if (piece === BLACK_MAN || piece === BLACK_KING) return 'b'
  return null
}

export function isSide(piece: number, color: Color): boolean {
  return sideOf(piece) === color
}

export function isOpponent(piece: number, color: Color): boolean {
  const side = sideOf(piece)
  return side !== null && side !== color
}

/** White promotes on 1–5. Black promotes on 46–50. */
export function isPromotionRow(sq: number, color: Color): boolean {
  return color === 'w' ? sq <= 5 : sq >= 46
}

export function pieceCode(color: Color, type: 'm' | 'k'): PieceCode {
  if (color === 'w') return type === 'k' ? WHITE_KING : WHITE_MAN
  return type === 'k' ? BLACK_KING : BLACK_MAN
}

export function asciiChar(piece: number): string {
  switch (piece) {
    case WHITE_MAN:
      return 'w'
    case WHITE_KING:
      return 'W'
    case BLACK_MAN:
      return 'b'
    case BLACK_KING:
      return 'B'
    default:
      return '.'
  }
}

/** rays[square][direction] lists squares walking outward, nearest first. Index 0 is unused. */
export const RAYS: number[][][] = Array.from({ length: 51 }, () => [[], [], [], []])

for (let sq = 1; sq <= 50; sq++) {
  const row = rowOf(sq)
  const col = colOf(sq)
  for (let d = 0; d < 4; d++) {
    const [dr, dc] = DIRS[d]
    let r = row + dr
    let c = col + dc
    for (;;) {
      const next = squareAt(r, c)
      if (next === null) break
      RAYS[sq][d].push(next)
      r += dr
      c += dc
    }
  }
}

export function forwardDirs(color: Color): readonly number[] {
  return color === 'w' ? WHITE_FORWARD : BLACK_FORWARD
}
