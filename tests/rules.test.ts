import { describe, expect, it } from 'vitest'
import { Draughts } from '../src/draughts'
import { colOf, rowOf, squareAt } from '../src/squares'
import { walkStrict, walkToDraw } from './quiet'

function play(fen: string, moves: string[]): Draughts {
  const game = new Draughts(fen)
  for (const move of moves) game.move(move)
  return game
}

function flown(from: number, path: number[]): number[] {
  const squares: number[] = []
  let at = from
  for (const land of path) {
    const dr = rowOf(land) - rowOf(at)
    const dc = colOf(land) - colOf(at)
    const steps = Math.abs(dr)
    const sr = Math.sign(dr)
    const sc = Math.sign(dc)
    for (let i = 1; i <= steps; i++) {
      const sq = squareAt(rowOf(at) + sr * i, colOf(at) + sc * i)
      if (sq !== null) squares.push(sq)
    }
    at = land
  }
  return squares
}

describe('opening', () => {
  it('lists the nine white moves', () => {
    const game = new Draughts()
    expect(game.moves()).toEqual([
      '31-26',
      '31-27',
      '32-27',
      '32-28',
      '33-28',
      '33-29',
      '34-29',
      '34-30',
      '35-30',
    ])
    expect(game.turn()).toBe('w')
    expect(game.moveNumber()).toBe(1)
  })

  it('filters by square', () => {
    const game = new Draughts()
    expect(game.moves({ square: 31 })).toEqual(['31-26', '31-27'])
    expect(() => game.moves({ square: 0 })).toThrow(/Invalid square/)
  })
})

describe('movement and capture', () => {
  it('rejects a quiet move while a capture exis', () => {
    const game = new Draughts('W:W28:B33')
    expect(game.moves()).toEqual(['28x39'])
    expect(() => game.move('28-22')).toThrow(/Illegal move/)
    expect(() => game.move('28-23')).toThrow(/Illegal move/)
  })

  it('rejects a shorter capture', () => {
    const game = new Draughts('W:W11:B7,8')
    expect(game.moves()).toEqual(['11x13'])
    expect(() => game.move('11x2')).toThrow(/Illegal move/)
  })

  it('allows a man and a king when both capture the same number', () => {
    const game = new Draughts('W:W26,K45:B21,40')
    const moves = game.moves({ verbose: true })
    expect(moves.every((move) => move.captured.length === 1)).toBe(true)
    expect(moves.some((move) => move.piece === 'm' && move.san === '26x17')).toBe(true)
    expect(moves.some((move) => move.piece === 'k' && move.from === 45)).toBe(true)
  })

  it('lets a man capture backward and not move backward', () => {
    const quiet = new Draughts('W:W28:B')
    expect(quiet.moves()).toEqual(['28-22', '28-23'])
    expect(() => quiet.move('28-32')).toThrow(/Illegal move/)
    expect(() => quiet.move('28-33')).toThrow(/Illegal move/)

    const back = new Draughts('W:W28:B33')
    const move = back.move('28x39')
    expect(move.captured).toEqual([33])
    expect(back.fen()).toBe('B:W39:B')

    const blocked = new Draughts('W:W28,32:B33')
    expect(blocked.moves()).toEqual(['28x39'])
  })

  it('keeps a captured piece on the board until the sequence ends', () => {
    const game = new Draughts('W:WK33:B22,39')
    const moves = game.moves({ verbose: true })
    expect(moves.length).toBeGreaterThan(0)
    expect(moves.every((move) => move.captured.length === 1)).toBe(true)
    expect(new Set(moves.flatMap((move) => move.captured))).toEqual(new Set([22, 39]))
  })

  it('promotes a man only when the capture ends on the promotion row', () => {
    const through = new Draughts('W:W11:B7,8')
    const crossed = through.move({ from: 11, path: [2, 13] })
    expect(crossed.promotion).toBe(false)
    expect(crossed.flags).toBe('c')
    expect(crossed.path).toEqual([2, 13])
    expect(through.get(13)).toEqual({ color: 'w', type: 'm' })
    expect(through.fen()).toBe('B:W13:B')

    const stop = new Draughts('W:W11:B7')
    const crowned = stop.move('11x2')
    expect(crowned.promotion).toBe(true)
    expect(crowned.flags).toBe('cp')
    expect(stop.fen()).toBe('B:WK2:B')

    const stays = new Draughts('W:W11:B7,13')
    expect(stays.moves()).toEqual(['11x2'])
    stays.move('11x2')
    expect(stays.fen()).toBe('B:WK2:B13')
    expect(stays.get(2)?.type).toBe('k')
  })

  it('promotes a man on a quiet move to the back rank', () => {
    const game = new Draughts('W:W6:B')
    const move = game.move('6-1')
    expect(move.promotion).toBe(true)
    expect(move.flags).toBe('p')
    expect(game.fen()).toBe('B:WK1:B')
  })

  it('slides a king any distance and offers every landing beyond a capture', () => {
    const quiet = new Draughts('W:WK45:B')
    expect(quiet.moves()).toContain('45-1')
    expect(quiet.moves()).toContain('45-50')
    expect(quiet.moves()).toHaveLength(9)

    const capture = new Draughts('W:WK45:B34')
    expect(capture.moves()).toEqual(['45x1', '45x7', '45x12', '45x18', '45x23', '45x29'])
    expect(capture.moves()).not.toContain('45x40')
  })

  it('passes an empty square twice in one capture', () => {
    const game = new Draughts('W:WK27:B7,8,17,18')
    expect(game.moves()).toEqual(['27x22', '27x28', '27x33', '27x39', '27x44', '27x50'])
    const move = game.move('27x13x2x11x28')
    expect(move.captured).toEqual([18, 8, 7, 17])
    expect(move.san).toBe('27x28')
    expect(game.fen()).toBe('B:WK28:B')
    const squares = flown(27, move.path)
    const visits = squares.filter((sq) => sq === 22)
    expect(visits).toHaveLength(2)
    expect(move.captured).not.toContain(22)
  })

  it('accepts a colon and an object, and requires the canonical form when strict', () => {
    const quiet = new Draughts()
    quiet.move({ from: 32, to: 28 })
    expect(quiet.fen().startsWith('B:')).toBe(true)

    const capture = new Draughts('W:W11:B7,8')
    expect(() => capture.move('11x2x13', { strict: true })).toThrow(/Non-canonical/)
    capture.move('11x13', { strict: true })
    expect(capture.fen()).toBe('B:W13:B')

    const colon = new Draughts('W:W28:B33')
    colon.move('28:39')
    expect(colon.fen()).toBe('B:W39:B')

    expect(() => new Draughts().move('32-28-23')).toThrow(/Invalid move/)
  })
})

describe('loss and undo', () => {
  it('loses when the side to move has no pieces or no move', () => {
    const none = new Draughts('W:W:B1')
    expect(none.isBlocked()).toBe(true)
    expect(none.result()).toBe('0-1')
    expect(none.winner()).toBe('b')
    expect(none.isDraw()).toBe(false)

    const other = new Draughts('B:W1:B')
    expect(other.result()).toBe('1-0')
    expect(other.winner()).toBe('w')

    const stuck = new Draughts('W:W1:BK50')
    expect(stuck.moves()).toEqual([])
    expect(stuck.isBlocked()).toBe(true)
    expect(stuck.result()).toBe('0-1')
    expect(stuck.isDraw()).toBe(false)
  })

  it('restores a finished capture with undo', () => {
    const game = new Draughts('W:W28:B33')
    const move = game.move('28x39')
    expect(game.result()).toBe('1-0')
    expect(() => game.move('39-33')).toThrow(/Game is over/)
    expect(game.undo()).toEqual(move)
    expect(game.fen()).toBe('W:W28:B33')
    expect(game.result()).toBe('*')
    expect(game.getHeaders().Result).toBe('*')
    expect(game.undo()).toBeNull()
    game.move('28x39')
    expect(game.result()).toBe('1-0')
  })
})

describe('draws', () => {
  const shuttle = ['50-44', '5-10', '44-50', '10-5', '50-44', '5-10', '44-50', '10-5']

  it('draws a position the third time the same side is to move', () => {
    const game = new Draughts('W:WK50:BK5')
    for (const move of shuttle.slice(0, 4)) game.move(move)
    expect(game.isThreefoldRepetition()).toBe(false)
    for (const move of shuttle.slice(4)) game.move(move)
    expect(game.fen()).toBe('W:WK50:BK5')
    expect(game.isThreefoldRepetition()).toBe(true)
    expect(game.isDrawByEndgameRule()).toBe(false)
    expect(game.isDrawByTwentyFiveMoves()).toBe(false)
    expect(game.isDraw()).toBe(true)
    expect(game.result()).toBe('1/2-1/2')
    expect(game.winner()).toBeNull()
    expect(game.moves().length).toBeGreaterThan(0)
    expect(() => game.move(game.moves()[0])).toThrow(/Game is over/)
    game.undo()
    expect(game.isGameOver()).toBe(false)
  })

  it('draws after 25 quiet king moves by each player', () => {
    const game = new Draughts('W:WK46,K47:BK49,K50')
    walkToDraw(game, 50, (index) => {
      if (index === 48) {
        expect(game.isDrawByTwentyFiveMoves()).toBe(false)
        expect(game.isGameOver()).toBe(false)
      }
    })
    expect(game.isDrawByTwentyFiveMoves()).toBe(true)
    expect(game.isDrawByEndgameRule()).toBe(false)
    expect(game.isThreefoldRepetition()).toBe(false)
    expect(game.result()).toBe('1/2-1/2')
    expect(game.moves().length).toBeGreaterThan(0)
    expect(() => game.move(game.moves()[0])).toThrow(/Game is over/)
  })

  it('draws article 6.3 after 16 moves each', () => {
    const game = new Draughts('W:WK46,K47,K49:BK15')
    walkToDraw(game, 32, (index) => {
      if (index === 30) expect(game.isDrawByEndgameRule()).toBe(false)
    })
    expect(game.isDrawByEndgameRule()).toBe(true)
    expect(game.isDrawByTwentyFiveMoves()).toBe(false)
    expect(game.isThreefoldRepetition()).toBe(false)
    expect(game.result()).toBe('1/2-1/2')
  })

  it('counts a win on the move that would complete article 6.3', () => {
    const game = new Draughts('B:WK36,K46,K50:BK15')
    walkStrict(game, 30)
    expect(game.isGameOver()).toBe(false)
    game.move('1-18')
    expect(game.isGameOver()).toBe(false)
    expect(game.moves()).toContain('4x22')
    game.move('4x22')
    expect(game.isBlocked()).toBe(true)
    expect(game.isDraw()).toBe(false)
    expect(game.result()).toBe('1-0')
    expect(game.winner()).toBe('w')
    expect(game.fen()).toBe('B:WK22,K46,K50:B')
  })

  it('draws article 6.4 after five moves each, and the exhausting capture can win', () => {
    const line = ['4-9', '46-41', '9-4', '41-37', '4-9', '37-32', '9-4', '32-28']
    const approaching = play('B:WK46:BK4', line)
    expect(approaching.isGameOver()).toBe(false)

    const drawn = play('B:WK46:BK4', [...line, '4-9', '28-23'])
    expect(drawn.isDrawByEndgameRule()).toBe(true)
    expect(drawn.isThreefoldRepetition()).toBe(false)
    expect(drawn.isDrawByTwentyFiveMoves()).toBe(false)
    expect(drawn.result()).toBe('1/2-1/2')
    expect(() => drawn.move(drawn.moves()[0])).toThrow(/Game is over/)

    const ready = play('B:WK46:BK4', [...line, '4-10'])
    expect(ready.isGameOver()).toBe(false)
    expect(ready.moves()).toEqual(['28x5'])
    ready.move('28x5')
    expect(ready.result()).toBe('1-0')
    expect(ready.isDraw()).toBe(false)
    expect(ready.winner()).toBe('w')
    expect(ready.fen()).toBe('B:WK5:B')
  })

  it('starts the five-move count over when article 6.3 becomes article 6.4', () => {
    const game = new Draughts('W:WK46,K47,K49:BK15')
    const prefix = ['46-5', '15-4', '5-14', '4-13', '14-3', '13-2', '3-9', '2-7', '9-3', '7-1', '3-8', '1-6']
    for (const move of prefix) game.move(move)
    expect(game.isGameOver()).toBe(false)
    game.move('8-17')
    expect(game.isGameOver()).toBe(false)
    game.move('6x22')
    expect(game.isDrawByEndgameRule()).toBe(false)
    expect(game.isGameOver()).toBe(false)
    const rest = ['47-15', '22-4', '15-20', '4-10', '20-3', '10-4', '3-8', '4-9', '8-2', '9-3']
    for (const move of rest.slice(0, 9)) game.move(move)
    expect(game.isDrawByEndgameRule()).toBe(false)
    game.move(rest[9])
    expect(game.isDrawByEndgameRule()).toBe(true)
    expect(game.isThreefoldRepetition()).toBe(false)
    expect(game.isDrawByTwentyFiveMoves()).toBe(false)
    expect(game.result()).toBe('1/2-1/2')
  })

  it('restarts the draw clocks when a FEN is loaded', () => {
    const line = ['4-9', '46-41', '9-4', '41-37', '4-9', '37-32', '9-4', '32-28']
    const mid = play('B:WK46:BK4', line)
    const fresh = new Draughts(mid.fen())
    mid.move('4-9')
    mid.move('28-23')
    fresh.move('4-9')
    fresh.move('28-23')
    expect(mid.isDrawByEndgameRule()).toBe(true)
    expect(fresh.isDrawByEndgameRule()).toBe(false)
    expect(fresh.isGameOver()).toBe(false)
  })
})
