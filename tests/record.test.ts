import { describe, expect, it } from 'vitest'
import { Draughts, START_FEN, validateFen } from '../src/index'
import { maximalCaptures } from '../src/generate'
import { parseFen } from '../src/fen'

const GILBERT = 'B:W6,9,10,11,20,21,22,23,30,K31,33,37,41,42,43,44,46:BK17,K24'

describe('FEN', () => {
  it('expands ranges and accepts either colour first', () => {
    expect(new Draughts('W:W31-50:B1-20').fen()).toBe(START_FEN)
    expect(new Draughts('W:B1-20:W31-50').fen()).toBe(START_FEN)
    expect(new Draughts('w:wk10:b1').fen()).toBe('W:WK10:B1')
  })

  it('writes kings before men, sorted, with no ranges', () => {
    const fen = 'B:W18,24,27,28,K10,K15:B12,16,20,K22,K25,K29'
    expect(new Draughts(fen).fen()).toBe('B:WK10,K15,18,24,27,28:B12,16,20,K22,K25,K29')
  })

  it('round-trips an empty side', () => {
    const game = new Draughts('W:W:B1')
    expect(game.fen()).toBe('W:W:B1')
    expect(validateFen('  W:W1:B  ').ok).toBe(true)
    expect(validateFen('W:W1:B2.').ok).toBe(false)
    expect(validateFen('W:W1:B 2').ok).toBe(false)
    expect(validateFen('W:W1:W2').ok).toBe(false)
    expect(validateFen('W:W1-3,2:B10').ok).toBe(false)
    expect(validateFen('W:W0:B1').ok).toBe(false)
    expect(validateFen('W:W1').ok).toBe(false)
  })

  it('throws from the constructor and leaves a failed load in place', () => {
    expect(() => new Draughts('nope')).toThrow(/Invalid FEN/)
    const game = new Draughts()
    game.move('32-28')
    expect(() => game.load('nope')).toThrow(/Invalid FEN/)
    expect(game.history()).toEqual(['32-28'])
  })
})

describe('board', () => {
  it('orients white at the bottom', () => {
    const game = new Draughts()
    expect(game.board()[0][0]).toBeNull()
    expect(game.board()[0][1]).toEqual({ color: 'b', type: 'm' })
    expect(game.board()[9][0]).toEqual({ color: 'w', type: 'm' })
    expect(game.get(1)).toEqual({ color: 'b', type: 'm' })
    expect(game.get(46)).toEqual({ color: 'w', type: 'm' })
    expect(game.get(0)).toBeUndefined()
    const lines = game.ascii().split('\n')
    expect(lines[0].startsWith(' ')).toBe(true)
    expect(lines[0]).toContain('b')
    expect(lines[9].startsWith('w')).toBe(true)
  })

  it('edits with put, remove, clear, and reset', () => {
    const game = new Draughts()
    game.setHeader('White', 'A')
    game.move('32-28')
    expect(game.turn()).toBe('b')
    expect(game.put({ color: 'w', type: 'k' }, 15)).toBe(true)
    expect(game.get(15)).toEqual({ color: 'w', type: 'k' })
    expect(game.history()).toEqual([])
    expect(game.undo()).toBeNull()
    expect(game.turn()).toBe('b')
    expect(game.moveNumber()).toBe(1)
    expect(game.put({ color: 'w', type: 'm' }, 0)).toBe(false)
    expect(game.remove(15)).toEqual({ color: 'w', type: 'k' })
    expect(game.remove(15)).toBeUndefined()

    game.clear()
    expect(game.fen()).toBe('W:W:B')
    expect(game.turn()).toBe('w')
    expect(game.result()).toBe('0-1')
    expect(game.getHeaders().White).toBe('A')

    game.reset()
    expect(game.fen()).toBe(START_FEN)
    expect(game.getHeaders().White).toBe('A')
    expect(game.result()).toBe('*')
  })
})

describe('history and headers', () => {
  it('records verbose moves, suffixes, and an agreed result', () => {
    const game = new Draughts()
    game.setHeader('Result', '1/2-1/2')
    const first = game.move('32-28!')
    expect(game.getHeaders().Result).toBe('1/2-1/2')
    expect(first.suffix).toBe('!')
    expect(first.before.startsWith('W:')).toBe(true)
    expect(first.after.startsWith('B:')).toBe(true)
    game.move('18-23')
    expect(game.moveNumber()).toBe(2)
    expect(game.history()).toEqual(['32-28', '18-23'])
    const verbose = game.history({ verbose: true })
    expect(verbose[0].suffix).toBe('!')
    expect(verbose[0].before).toBe(START_FEN)
    expect(verbose[1].before).toBe(verbose[0].after)
    game.undo()
    expect(game.getHeaders().Result).toBe('1/2-1/2')
    expect(game.history()).toEqual(['32-28'])
  })

  it('rejects a bad header or a comment brace', () => {
    const game = new Draughts()
    expect(() => game.setHeader('Result', '1"0')).toThrow(/double quote/)
    expect(() => game.setHeader('White Name', 'A')).toThrow(/Invalid header/)
    expect(() => game.setComment('a {b}')).toThrow(/braces/)
    game.setComment('  opening  ')
    expect(game.getComment()).toBe('opening')
    expect(game.removeComment()).toBe('opening')
    expect(game.getComment()).toBeUndefined()
  })
})

describe('PDN', () => {
  it('writes a game and reads it back', () => {
    const game = new Draughts()
    game.setHeader('White', 'A')
    game.setHeader('Black', 'B')
    game.setComment('before')
    game.move('32-28!')
    game.setComment('after white')
    game.move('18-23')
    const text = game.pdn()
    expect(text).toContain('[White "A"]')
    expect(text).toContain('{before}')
    expect(text).toContain('1. 32-28! {after white} 18-23')

    const again = new Draughts()
    again.loadPdn(text.replace(/\n/g, '\r\n'))
    expect(again.fen()).toBe(game.fen())
    expect(again.history()).toEqual(['32-28', '18-23'])
    expect(again.history({ verbose: true })[0].suffix).toBe('!')
    expect(again.getHeaders().White).toBe('A')
    expect(again.getComments().map((entry) => entry.comment)).toEqual(['before', 'after white'])
  })

  it('skips a variation unless strict mode is on', () => {
    const pdn = '[GameType "20"]\n\n1. 32-28 (32-27) 18-23 *'
    const loose = new Draughts()
    loose.loadPdn(pdn)
    expect(loose.history()).toEqual(['32-28', '18-23'])
    expect(loose.getHeaders().Result).toBe('*')
    expect(loose.result()).toBe('*')

    const strict = new Draughts()
    expect(() => strict.loadPdn(pdn, { strict: true })).toThrow(/variations are not supported/)
  })

  it('reads a black move number and a trailing result', () => {
    const game = new Draughts()
    game.loadPdn('[FEN "B:W50:B18"]\n[SetUp "1"]\n\n1... 18-23')
    expect(game.history()).toEqual(['18-23'])
    expect(game.fen()).toBe('W:W50:B23')
    expect(game.result()).toBe('*')

    const won = new Draughts('B:W:B18')
    won.move('18-22')
    expect(won.result()).toBe('0-1')
    expect(won.winner()).toBe('b')
    expect(won.pdn()).toContain('1... 18-22')
    expect(won.pdn()).toContain('[FEN "B:W:B18"]')
    expect(won.pdn()).toContain('[SetUp "1"]')
  })

  it('keeps a result token that the rules have not reached', () => {
    const game = new Draughts()
    game.loadPdn('1. 32-28 18-23 1/2-1/2')
    expect(game.result()).toBe('*')
    expect(game.getHeaders().Result).toBe('1/2-1/2')
  })

  it('rejects the wrong game type, a broken comment, and moves after the result', () => {
    const game = new Draughts()
    expect(() => game.loadPdn('[GameType "21"]\n\n1. 32-28')).toThrow(/GameType 20/)
    game.loadPdn('[GameType "20, international"]\n\n1. 32-28')
    expect(game.history()).toEqual(['32-28'])
    expect(() => new Draughts().loadPdn('1. 32-28 {hello')).toThrow(/unclosed comment/)
    expect(() => new Draughts().loadPdn('1. 32-28 1-0 18-23')).toThrow(/moves follow the result/)
  })
})

describe('capture notation', () => {
  it('throws when from-to names more than one result', () => {
    const game = new Draughts('W:WK27:B7,32,33,39')
    expect(game.moves()).toEqual(['27x38x29x1', '27x43x34x1'])
    expect(() => game.move('27x1')).toThrow(/Ambiguous move: 27x1/)
    expect(() => game.move({ from: 27, to: 1 })).toThrow(/Ambiguous move: 27x1/)
    game.move('27x38x29x1', { strict: true })
    expect(game.fen()).toBe('B:WK1:B39')
  })

  it('plays another capture order of the same result', () => {
    const parsed = parseFen(GILBERT)
    if (!parsed.ok) throw new Error(parsed.error)
    const caps = maximalCaptures(parsed.board, 'b').filter((move) => move.to === 29)
    const groups = new Map<string, typeof caps>()
    for (const move of caps) {
      const key = move.mask.toString()
      const list = groups.get(key) ?? []
      list.push(move)
      groups.set(key, list)
    }
    const pair = [...groups.values()].find((list) => list.length >= 2)
    if (!pair) throw new Error('expected two orders')
    const [first, second] = pair
    const left = new Draughts(GILBERT)
    const right = new Draughts(GILBERT)
    const a = [first.from, ...first.path].join('x')
    const b = [second.from, ...second.path].join('x')
    expect(a).not.toBe(b)
    left.move(a)
    right.move(b)
    expect(left.fen()).toBe(right.fen())
    expect(left.fen()).toBe('W:W6,37,46:BK17,K29')
    expect(() => new Draughts(GILBERT).move(a, { strict: true })).toThrow(/Non-canonical/)
    const canonical = new Draughts(GILBERT)
    canonical.move('24x29', { strict: true })
    expect(canonical.fen()).toBe(left.fen())
  })

  it('matches the Gilbert capture coun', () => {
    expect(new Draughts(GILBERT).moves()).toHaveLength(14)
    const withEight = 'B:W6,8,9,10,11,20,21,22,23,30,K31,33,37,41,42,43,44,46:BK17,K24'
    expect(new Draughts(withEight).moves()).toHaveLength(17)
  })
})
