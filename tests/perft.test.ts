import { describe, expect, it } from 'vitest'
import { Draughts } from '../src/draughts'
import { START_FEN, parseFen } from '../src/fen'
import { perft } from '../src/generate'

const TABLE = [9, 81, 658, 4265, 27117, 167140, 1049442]

function nodes(game: Draughts, depth: number): number {
  if (depth === 0) return 1
  let count = 0
  for (const san of game.moves()) {
    game.move(san)
    count += nodes(game, depth - 1)
    game.undo()
  }
  return count
}

describe('perft', () => {
  it('matches the published counts through depth 6', () => {
    const parsed = parseFen(START_FEN)
    if (!parsed.ok) throw new Error(parsed.error)
    for (let depth = 1; depth <= 6; depth++) {
      const board = parsed.board.slice()
      expect(perft(board, 'w', depth)).toBe(TABLE[depth - 1])
    }
  })

  it('matches depth 7', () => {
    const parsed = parseFen(START_FEN)
    if (!parsed.ok) throw new Error(parsed.error)
    expect(perft(parsed.board.slice(), 'w', 7)).toBe(TABLE[6])
  }, 15_000)

  it('agrees with move and undo through depth 4', () => {
    const game = new Draughts()
    for (let depth = 1; depth <= 4; depth++) {
      expect(nodes(game, depth)).toBe(TABLE[depth - 1])
    }
  })
})
