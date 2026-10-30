/** Side to move. White moves first from the starting position. */
export type Color = 'w' | 'b'

/** `'m'` is a man, `'k'` is a king. */
export type PieceSymbol = 'm' | 'k'

/** FMJD square number, 1 through 50. */
export type Square = number

export type Piece = {
  color: Color
  type: PieceSymbol
}

/**
 * One legal move.
 * `path` is the landing squares of a capture, including `to`. A quiet move has `path: [to]`.
 * `captured` lists the squares of taken pieces, in the order of the stored path.
 */
export type Move = {
  color: Color
  piece: PieceSymbol
  from: Square
  to: Square
  path: Square[]
  captured: Square[]
  promotion: boolean
  san: string
  flags: string
  suffix: string
  before: string
  after: string
}

/** String notation (`32-28`, `23x18`, `32x28x23`) or an explicit square path. */
export type MoveInput =
  | string
  | {
      from: Square
      to?: Square
      path?: Square[]
    }

export function opposite(color: Color): Color {
  return color === 'w' ? 'b' : 'w'
}
