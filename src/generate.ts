import type { Color } from './types'
import { opposite } from './types'
import {
  DIRS,
  BLACK_KING,
  EMPTY,
  RAYS,
  WHITE_KING,
  forwardDirs,
  isKing,
  isOpponent,
  isPromotionRow,
  isSide,
  rowOf,
  colOf,
  squareAt,
} from './squares'

export type RawMove = {
  from: number
  to: number
  path: number[]
  captured: number[]
  mask: bigint
  piece: number
  promotion: boolean
  san: string
}

type Step = { victim: number; land: number }

function bit(sq: number): bigint {
  return 1n << BigInt(sq - 1)
}

/**
 * Legal moves. Captures that differ only by the order of the same pieces
 * and finish on the same square are one move. The kept path is the
 * lexicographically smallest landing sequence.
 */
export function generateMoves(board: Uint8Array, turn: Color): RawMove[] {
  const caps = collectCaptures(board, turn)
  const moves = caps.length > 0 ? dedupe(caps) : collectQuiet(board, turn)
  annotate(moves)
  moves.sort((a, b) => a.from - b.from || a.to - b.to || (a.san < b.san ? -1 : a.san > b.san ? 1 : 0))
  return moves
}

/** Every maximal capture path, including orders that dedupe to one result. */
export function maximalCaptures(board: Uint8Array, turn: Color): RawMove[] {
  return collectCaptures(board, turn)
}

export function perft(board: Uint8Array, turn: Color, depth: number): number {
  if (depth === 0) return 1
  const moves = generateShallow(board, turn)
  if (depth === 1) return moves.length
  let nodes = 0
  for (const move of moves) {
    const codes = applyMove(board, move, turn)
    nodes += perft(board, opposite(turn), depth - 1)
    undoMove(board, move, codes)
  }
  return nodes
}

/** Depth-1 listing without notation, used by perft. */
function generateShallow(board: Uint8Array, turn: Color): RawMove[] {
  const caps = collectCaptures(board, turn)
  return caps.length > 0 ? dedupe(caps) : collectQuiet(board, turn)
}

export function applyMove(board: Uint8Array, move: RawMove, turn: Color): number[] {
  const codes = move.captured.map((sq) => board[sq])
  const piece = board[move.from]
  board[move.from] = EMPTY
  for (const sq of move.captured) board[sq] = EMPTY
  board[move.to] =
    !isKing(piece) && isPromotionRow(move.to, turn)
      ? turn === 'w'
        ? WHITE_KING
        : BLACK_KING
      : piece
  return codes
}

export function undoMove(board: Uint8Array, move: RawMove, codes: number[]): void {
  board[move.to] = EMPTY
  board[move.from] = move.piece
  for (let i = 0; i < move.captured.length; i++) board[move.captured[i]] = codes[i]
}

export function selectMove(
  board: Uint8Array,
  turn: Color,
  input: string | { from: number; to?: number; path?: number[] },
  legal: RawMove[],
  strict: boolean,
): RawMove {
  if (typeof input === 'string') return selectSan(board, turn, input, legal, strict)
  return selectObject(board, turn, input, legal)
}

function selectSan(
  board: Uint8Array,
  turn: Color,
  input: string,
  legal: RawMove[],
  strict: boolean,
): RawMove {
  const text = input.trim()
  const matched = /^(\d+(?:[-x:]\d+)+)([!?+*=]+)?$/.exec(text)
  if (!matched) throw new Error(`Invalid move: ${input}`)
  const body = matched[1]
  const capture = body.includes('x') || body.includes(':')
  const quiet = body.includes('-')
  if (capture === quiet) throw new Error(`Invalid move: ${input}`)
  const squares = body.split(/[-x:]/).map((part) => Number(part))
  if (squares.some((sq) => !Number.isInteger(sq) || sq < 1 || sq > 50)) {
    throw new Error(`Invalid move: ${input}`)
  }
  const from = squares[0]
  const landings = squares.slice(1)
  const chosen = capture
    ? matchCapture(board, turn, from, landings, legal, squares.length === 2)
    : matchQuiet(from, landings, legal)
  if (strict) {
    const canonical = normalize(body)
    if (canonical !== chosen.san) {
      throw new Error(`Non-canonical move: ${canonical}. Expected ${chosen.san}`)
    }
  }
  return chosen
}

function selectObject(
  board: Uint8Array,
  turn: Color,
  input: { from: number; to?: number; path?: number[] },
  legal: RawMove[],
): RawMove {
  if (!Number.isInteger(input.from) || input.from < 1 || input.from > 50) {
    throw new Error(`Invalid square: ${input.from}`)
  }
  const capturing = legal.some((move) => move.captured.length > 0)
  if (input.path && input.path.length > 0) {
    for (const sq of input.path) {
      if (!Number.isInteger(sq) || sq < 1 || sq > 50) throw new Error(`Invalid square: ${sq}`)
    }
    const to = input.path[input.path.length - 1]
    if (input.to !== undefined && input.to !== to) {
      throw new Error(`Invalid move: path ends on ${to}, not ${input.to}`)
    }
    if (!capturing) return matchQuiet(input.from, input.path, legal)
    return matchCapture(board, turn, input.from, input.path, legal, input.path.length === 1)
  }
  if (input.to === undefined || !Number.isInteger(input.to) || input.to < 1 || input.to > 50) {
    throw new Error(`Invalid square: ${String(input.to)}`)
  }
  const matches = legal.filter((move) => move.from === input.from && move.to === input.to)
  if (matches.length === 1) return matches[0]
  if (matches.length > 1) {
    throw new Error(`Ambiguous move: ${input.from}x${input.to}. Include the intermediate squares.`)
  }
  const sep = capturing ? 'x' : '-'
  throw new Error(`Illegal move: ${input.from}${sep}${input.to}`)
}

function matchQuiet(from: number, landings: number[], legal: RawMove[]): RawMove {
  if (landings.length !== 1) throw new Error(`Invalid move: ${from}-${landings.join('-')}`)
  const found = legal.find(
    (move) => move.from === from && move.to === landings[0] && move.captured.length === 0,
  )
  if (!found) throw new Error(`Illegal move: ${from}-${landings[0]}`)
  return found
}

function matchCapture(
  board: Uint8Array,
  turn: Color,
  from: number,
  landings: number[],
  legal: RawMove[],
  short: boolean,
): RawMove {
  if (short) {
    const matches = legal.filter(
      (move) => move.from === from && move.to === landings[0] && move.captured.length > 0,
    )
    if (matches.length === 1) return matches[0]
    if (matches.length > 1) {
      throw new Error(`Ambiguous move: ${from}x${landings[0]}. Include the intermediate squares.`)
    }
    throw new Error(`Illegal move: ${from}x${landings[0]}`)
  }
  const interpreted = interpret(board, turn, from, landings)
  if (!interpreted) throw new Error(`Illegal move: ${from}x${landings.join('x')}`)
  const found = legal.find(
    (move) => move.from === from && move.to === interpreted.to && move.mask === interpreted.mask,
  )
  if (!found) throw new Error(`Illegal move: ${from}x${landings.join('x')}`)
  return found
}

function interpret(
  board: Uint8Array,
  turn: Color,
  from: number,
  landings: number[],
): { to: number; mask: bigint } | null {
  const piece = board[from]
  if (!isSide(piece, turn)) return null
  const man = !isKing(piece)
  board[from] = EMPTY
  let at = from
  let mask = 0n
  try {
    for (const land of landings) {
      const victim = jumpVictim(board, at, land, mask, turn, man)
      if (victim === null) return null
      mask |= bit(victim)
      at = land
    }
  } finally {
    board[from] = piece
  }
  return { to: at, mask }
}

function jumpVictim(
  board: Uint8Array,
  at: number,
  land: number,
  mask: bigint,
  turn: Color,
  man: boolean,
): number | null {
  const dr = rowOf(land) - rowOf(at)
  const dc = colOf(land) - colOf(at)
  if (dr === 0 || Math.abs(dr) !== Math.abs(dc)) return null
  const steps = Math.abs(dr)
  if (man ? steps !== 2 : steps < 2) return null
  const sr = Math.sign(dr)
  const sc = Math.sign(dc)
  const row = rowOf(at)
  const col = colOf(at)
  let victim = 0
  for (let i = 1; i < steps; i++) {
    const sq = squareAt(row + sr * i, col + sc * i)
    if (sq === null) return null
    const piece = board[sq]
    if (piece === EMPTY) continue
    if (!isOpponent(piece, turn) || (mask & bit(sq)) !== 0n) return null
    if (victim !== 0) return null
    victim = sq
  }
  if (victim === 0 || board[land] !== EMPTY) return null
  return victim
}

function normalize(body: string): string {
  const capture = body.includes('x') || body.includes(':')
  return body
    .split(/[-x:]/)
    .map((part) => String(Number(part)))
    .join(capture ? 'x' : '-')
}

function annotate(moves: RawMove[]): void {
  const counts = new Map<string, number>()
  for (const move of moves) {
    const key = move.captured.length === 0 ? `${move.from}-${move.to}` : `${move.from}x${move.to}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  for (const move of moves) {
    if (move.captured.length === 0) {
      move.san = `${move.from}-${move.to}`
      continue
    }
    const short = `${move.from}x${move.to}`
    move.san = counts.get(short) === 1 ? short : [move.from, ...move.path].join('x')
  }
}

function dedupe(moves: RawMove[]): RawMove[] {
  const kept = new Map<string, RawMove>()
  for (const move of moves) {
    const key = `${move.from}:${move.mask}:${move.to}`
    const previous = kept.get(key)
    if (!previous || pathBefore(move.path, previous.path)) kept.set(key, move)
  }
  return [...kept.values()]
}

function pathBefore(a: number[], b: number[]): boolean {
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) return a[i] < b[i]
  }
  return a.length < b.length
}

function collectQuiet(board: Uint8Array, turn: Color): RawMove[] {
  const moves: RawMove[] = []
  for (let sq = 1; sq <= 50; sq++) {
    const piece = board[sq]
    if (!isSide(piece, turn)) continue
    if (isKing(piece)) {
      for (let d = 0; d < 4; d++) {
        for (const dest of RAYS[sq][d]) {
          if (board[dest] !== EMPTY) break
          moves.push(quiet(sq, dest, piece, turn))
        }
      }
    } else {
      for (const d of forwardDirs(turn)) {
        const dest = RAYS[sq][d][0]
        if (dest !== undefined && board[dest] === EMPTY) moves.push(quiet(sq, dest, piece, turn))
      }
    }
  }
  return moves
}

function quiet(from: number, to: number, piece: number, turn: Color): RawMove {
  return {
    from,
    to,
    path: [to],
    captured: [],
    mask: 0n,
    piece,
    promotion: !isKing(piece) && isPromotionRow(to, turn),
    san: '',
  }
}

function collectCaptures(board: Uint8Array, turn: Color): RawMove[] {
  const found: RawMove[] = []
  let max = 0
  const path: number[] = []
  const captured: number[] = []

  const record = (from: number, piece: number, mask: bigint) => {
    const n = captured.length
    if (n === 0 || n < max) return
    const move: RawMove = {
      from,
      to: path[path.length - 1],
      path: path.slice(),
      captured: captured.slice(),
      mask,
      piece,
      promotion: !isKing(piece) && isPromotionRow(path[path.length - 1], turn),
      san: '',
    }
    if (n > max) {
      max = n
      found.length = 0
    }
    found.push(move)
  }

  const walk = (at: number, mask: bigint, from: number, piece: number, king: boolean) => {
    const steps = king
      ? kingSteps(board, at, mask, turn)
      : manSteps(board, at, mask, turn)
    if (steps.length === 0) {
      record(from, piece, mask)
      return
    }
    for (const step of steps) {
      path.push(step.land)
      captured.push(step.victim)
      walk(step.land, mask | bit(step.victim), from, piece, king)
      path.pop()
      captured.pop()
    }
  }

  for (let sq = 1; sq <= 50; sq++) {
    const piece = board[sq]
    if (!isSide(piece, turn)) continue
    board[sq] = EMPTY
    walk(sq, 0n, sq, piece, isKing(piece))
    board[sq] = piece
  }
  return found
}

function manSteps(board: Uint8Array, at: number, mask: bigint, turn: Color): Step[] {
  const steps: Step[] = []
  for (let d = 0; d < 4; d++) {
    const ray = RAYS[at][d]
    if (ray.length < 2) continue
    const victim = ray[0]
    const land = ray[1]
    const piece = board[victim]
    if (!isOpponent(piece, turn) || (mask & bit(victim)) !== 0n) continue
    if (board[land] !== EMPTY) continue
    steps.push({ victim, land })
  }
  return steps
}

function kingSteps(board: Uint8Array, at: number, mask: bigint, turn: Color): Step[] {
  const steps: Step[] = []
  const row = rowOf(at)
  const col = colOf(at)
  for (let d = 0; d < 4; d++) {
    const [dr, dc] = DIRS[d]
    let r = row + dr
    let c = col + dc
    let victim = 0
    for (;;) {
      const sq = squareAt(r, c)
      if (sq === null) break
      const piece = board[sq]
      if (victim === 0) {
        if (piece === EMPTY) {
          r += dr
          c += dc
          continue
        }
        if (!isOpponent(piece, turn) || (mask & bit(sq)) !== 0n) break
        victim = sq
        r += dr
        c += dc
        continue
      }
      if (piece !== EMPTY) break
      steps.push({ victim, land: sq })
      r += dr
      c += dc
    }
  }
  return steps
}
