import { parseFen, START_FEN, writeFen } from './fen'
import {
  applyMove,
  generateMoves,
  selectMove,
  undoMove,
  type RawMove,
} from './generate'
import { formatPdn, parsePdn, type PdnToken } from './pdn'
import {
  EMPTY,
  WHITE_MAN,
  WHITE_KING,
  BLACK_MAN,
  BLACK_KING,
  asciiChar,
  isKing,
  isSquare,
  pieceCode,
  sideOf,
  squareAt,
} from './squares'
import { opposite, type Color, type Move, type MoveInput, type Piece, type PieceSymbol } from './types'

type Category = 'none' | 'five' | 'sixteen'

type Hist = {
  move: Move
  raw: RawMove
  codes: number[]
  kingQuiet: number
  category: Category
  endgamePlies: number
  moveNumber: number
}

const FIVE_PLIES = 10
const SIXTEEN_PLIES = 32
const KING_QUIET_PLIES = 50

/**
 * International draughts (FMJD, 10×10).
 * The board is the 50 dark squares. White sits at the bottom and moves first.
 */
export class Draughts {
  private cells = new Uint8Array(51)
  private active: Color = 'w'
  private initialFen = START_FEN
  private initialTurn: Color = 'w'
  private hist: Hist[] = []
  private fens: string[] = []
  private keys: string[] = []
  private counts = new Map<string, number>()
  private comments = new Map<number, string>()
  private headers = new Map<string, string>()
  private kingQuiet = 0
  private category: Category = 'none'
  private endgamePlies = 0
  private fullmove = 1
  private cache: RawMove[] | null = null

  constructor(fen: string = START_FEN) {
    this.installFen(fen)
    this.headers = defaultHeaders()
    this.reflectResult()
  }

  /** Ten rows, top to bottom, white at the bottom. Light squares and empty squares are null. */
  board(): (Piece | null)[][] {
    const rows: (Piece | null)[][] = []
    for (let row = 0; row < 10; row++) {
      const line: (Piece | null)[] = []
      for (let col = 0; col < 10; col++) {
        const sq = squareAt(row, col)
        line.push(sq === null ? null : (this.pieceOn(sq) ?? null))
      }
      rows.push(line)
    }
    return rows
  }

  ascii(): string {
    const lines: string[] = []
    for (let row = 0; row < 10; row++) {
      let line = ''
      for (let col = 0; col < 10; col++) {
        const sq = squareAt(row, col)
        line += sq === null ? '  ' : `${asciiChar(this.cells[sq])} `
      }
      lines.push(line.trimEnd())
    }
    return lines.join('\n')
  }

  fen(): string {
    return writeFen(this.cells, this.active)
  }

  load(fen: string): void {
    this.installFen(fen)
    this.reflectResult()
  }

  reset(): void {
    this.installFen(START_FEN)
    this.reflectResult()
  }

  clear(): void {
    this.install(new Uint8Array(51), 'w', 'W:W:B')
    this.reflectResult()
  }

  turn(): Color {
    return this.active
  }

  moveNumber(): number {
    return this.fullmove
  }

  get(square: number): Piece | undefined {
    if (!isSquare(square)) return undefined
    return this.pieceOn(square)
  }

  put(piece: Piece, square: number): boolean {
    if (!isSquare(square)) return false
    if (piece.color !== 'w' && piece.color !== 'b') return false
    if (piece.type !== 'm' && piece.type !== 'k') return false
    this.cells[square] = pieceCode(piece.color, piece.type)
    this.reseat()
    return true
  }

  remove(square: number): Piece | undefined {
    if (!isSquare(square)) return undefined
    const piece = this.pieceOn(square)
    if (!piece) return undefined
    this.cells[square] = EMPTY
    this.reseat()
    return piece
  }

  moves(): string[]
  moves(options: { verbose: true; square?: number }): Move[]
  moves(options: { verbose?: false; square?: number }): string[]
  moves(options?: { verbose?: boolean; square?: number }): string[] | Move[] {
    if (options?.square !== undefined && !isSquare(options.square)) {
      throw new Error(`Invalid square: ${options.square}`)
    }
    let list = this.legal()
    if (options?.square !== undefined) list = list.filter((move) => move.from === options.square)
    if (options?.verbose) return list.map((move) => this.publish(move, ''))
    return list.map((move) => move.san)
  }

  move(input: MoveInput, { strict = false }: { strict?: boolean } = {}): Move {
    if (this.isGameOver()) throw new Error('Game is over')
    const { body, suffix } = splitInput(input)
    const raw = selectMove(this.cells, this.active, body, this.legal(), strict)
    return this.commit(raw, suffix)
  }

  undo(): Move | null {
    const entry = this.hist.pop()
    if (!entry) return null
    const ended = this.isGameOver()
    this.comments.delete(this.fens.length - 1)
    this.fens.pop()
    const key = this.keys.pop()
    if (key) this.bump(key, -1)
    undoMove(this.cells, entry.raw, entry.codes)
    this.active = entry.move.color
    this.kingQuiet = entry.kingQuiet
    this.category = entry.category
    this.endgamePlies = entry.endgamePlies
    this.fullmove = entry.moveNumber
    this.cache = null
    if (this.isGameOver()) this.reflectResult()
    else if (ended) this.headers.set('Result', '*')
    return entry.move
  }

  history(): string[]
  history(options: { verbose: true }): Move[]
  history(options?: { verbose?: boolean }): string[] | Move[] {
    if (options?.verbose) return this.hist.map((entry) => entry.move)
    return this.hist.map((entry) => entry.move.san)
  }

  isBlocked(): boolean {
    return this.legal().length === 0
  }

  isThreefoldRepetition(): boolean {
    return !this.isBlocked() && (this.counts.get(this.positionKey()) ?? 0) >= 3
  }

  /** Article 6.2: 25 moves by each player with only non-capturing king moves. */
  isDrawByTwentyFiveMoves(): boolean {
    return !this.isBlocked() && this.kingQuiet >= KING_QUIET_PLIES
  }

  /**
   * Articles 6.3 and 6.4. The move that enters the endgame does not count.
   * A capture that stays in the same article does not reset the count.
   * Entering 6.4 from 6.3 starts the five-move count over.
   */
  isDrawByEndgameRule(): boolean {
    if (this.isBlocked()) return false
    const limit = this.category === 'five' ? FIVE_PLIES : this.category === 'sixteen' ? SIXTEEN_PLIES : null
    return limit !== null && this.endgamePlies >= limit
  }

  isDraw(): boolean {
    if (this.isBlocked()) return false
    return this.isThreefoldRepetition() || this.isDrawByTwentyFiveMoves() || this.isDrawByEndgameRule()
  }

  isGameOver(): boolean {
    return this.isBlocked() || this.isDraw()
  }

  /** Rules result. This ignores a Result header that disagrees with the position. */
  result(): '1-0' | '0-1' | '1/2-1/2' | '*' {
    if (this.isBlocked()) return this.active === 'w' ? '0-1' : '1-0'
    if (this.isDraw()) return '1/2-1/2'
    return '*'
  }

  winner(): Color | null {
    if (!this.isBlocked()) return null
    return opposite(this.active)
  }

  pdn({ newline = '\n', maxWidth = 0 }: { newline?: string; maxWidth?: number } = {}): string {
    const headers = new Map(this.headers)
    if (this.initialFen !== START_FEN) {
      if (![...headers.keys()].some((key) => key.toLowerCase() === 'setup')) headers.set('SetUp', '1')
      if (![...headers.keys()].some((key) => key.toLowerCase() === 'fen')) headers.set('FEN', this.initialFen)
    }
    return formatPdn({
      headers,
      initialTurn: this.initialTurn,
      moves: this.hist.map((entry) => entry.move),
      comments: this.comments,
      newline,
      maxWidth,
    })
  }

  loadPdn(
    pdn: string,
    { strict = false, newlineChar = '\\r?\\n' }: { strict?: boolean; newlineChar?: string } = {},
  ): void {
    const parsed = parsePdn(pdn.replace(new RegExp(newlineChar, 'g'), '\n'))
    const gameType = parsed.headers.find((header) => header.key.toLowerCase() === 'gametype')
    if (gameType && gameType.value.split(',')[0].trim() !== '20') {
      throw new Error('Only international draughts (GameType 20) is supported')
    }
    const fen = parsed.headers.find((header) => header.key.toLowerCase() === 'fen')
    this.installFen(fen ? fen.value : START_FEN)
    this.headers = defaultHeaders()
    for (const header of parsed.headers) this.headers.set(header.key, header.value)
    if (![...this.headers.keys()].some((key) => key.toLowerCase() === 'result')) {
      this.headers.set('Result', '*')
    }
    this.playTokens(parsed.tokens, strict)
  }

  getHeaders(): Record<string, string> {
    return Object.fromEntries(this.headers)
  }

  setHeader(key: string, value: string): Record<string, string> {
    if (!/^[A-Za-z0-9_]+$/.test(key)) throw new Error(`Invalid header name: ${key}`)
    if (value.includes('"')) throw new Error('Header value cannot contain a double quote')
    this.headers.set(key, value)
    return this.getHeaders()
  }

  removeHeader(key: string): boolean {
    return this.headers.delete(key)
  }

  getComment(): string | undefined {
    return this.comments.get(this.fens.length - 1)
  }

  setComment(comment: string): void {
    if (comment.includes('}') || comment.includes('{')) {
      throw new Error('Comment cannot contain braces')
    }
    const text = comment.trim()
    const ply = this.fens.length - 1
    if (text) this.comments.set(ply, text)
    else this.comments.delete(ply)
  }

  removeComment(): string | undefined {
    const ply = this.fens.length - 1
    const comment = this.comments.get(ply)
    this.comments.delete(ply)
    return comment
  }

  getComments(): { fen: string; comment: string }[] {
    return [...this.comments.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([ply, comment]) => ({ fen: this.fens[ply], comment }))
  }

  removeComments(): { fen: string; comment: string }[] {
    const comments = this.getComments()
    this.comments.clear()
    return comments
  }

  private installFen(fen: string): void {
    const parsed = parseFen(fen)
    if (!parsed.ok) throw new Error(`Invalid FEN: ${parsed.error}`)
    this.install(parsed.board, parsed.turn, writeFen(parsed.board, parsed.turn))
  }

  private install(board: Uint8Array, turn: Color, fen: string): void {
    this.cells = new Uint8Array(board)
    this.active = turn
    this.initialFen = fen
    this.initialTurn = turn
    this.hist = []
    this.comments = new Map()
    this.fens = [fen]
    this.kingQuiet = 0
    this.category = endgameOf(board)
    this.endgamePlies = 0
    this.fullmove = 1
    this.cache = null
    const key = this.positionKey()
    this.keys = [key]
    this.counts = new Map([[key, 1]])
  }

  /** Keep the edited board, and drop the move history that no longer leads here. */
  private reseat(): void {
    const fen = writeFen(this.cells, this.active)
    const turn = this.active
    this.install(this.cells, turn, fen)
    this.reflectResult()
  }

  private legal(): RawMove[] {
    if (!this.cache) this.cache = generateMoves(this.cells, this.active)
    return this.cache
  }

  private commit(raw: RawMove, suffix: string): Move {
    const before = writeFen(this.cells, this.active)
    const color = this.active
    const saved = {
      kingQuiet: this.kingQuiet,
      category: this.category,
      endgamePlies: this.endgamePlies,
      moveNumber: this.fullmove,
    }
    const codes = applyMove(this.cells, raw, color)
    this.active = opposite(color)
    this.kingQuiet = isKing(raw.piece) && raw.captured.length === 0 ? this.kingQuiet + 1 : 0
    const next = endgameOf(this.cells)
    this.endgamePlies = next !== 'none' && next === saved.category ? this.endgamePlies + 1 : 0
    this.category = next
    if (color === 'b') this.fullmove++
    this.cache = null
    const after = writeFen(this.cells, this.active)
    const move = publicMove(raw, color, suffix, before, after)
    this.hist.push({ move, raw, codes, ...saved })
    this.fens.push(after)
    const key = this.positionKey()
    this.bump(key, 1)
    this.keys.push(key)
    if (this.isGameOver()) this.reflectResult()
    return move
  }

  private publish(raw: RawMove, suffix: string): Move {
    const before = writeFen(this.cells, this.active)
    const color = this.active
    const codes = applyMove(this.cells, raw, color)
    const after = writeFen(this.cells, opposite(color))
    undoMove(this.cells, raw, codes)
    return publicMove(raw, color, suffix, before, after)
  }

  private playTokens(tokens: PdnToken[], strict: boolean): void {
    let depth = 0
    let finished = false
    for (const token of tokens) {
      if (token.type === 'lparen') {
        if (strict && depth === 0) throw new Error('PDN variations are not supported')
        depth++
        continue
      }
      if (token.type === 'rparen') {
        if (depth === 0) throw new Error('PDN: unmatched )')
        depth--
        continue
      }
      if (depth > 0) continue
      if (token.type === 'comment') {
        if (token.text) this.comments.set(this.fens.length - 1, token.text)
        continue
      }
      if (token.type === 'result') {
        this.headers.set('Result', token.value)
        finished = true
        continue
      }
      if (finished) throw new Error('PDN: moves follow the result')
      const body = token.suffix ? `${token.san}${token.suffix}` : token.san
      this.move(body)
    }
    if (depth !== 0) throw new Error('PDN: unclosed variation')
  }

  private reflectResult(): void {
    this.headers.set('Result', this.result())
  }

  private positionKey(): string {
    let key = this.active
    for (let sq = 1; sq <= 50; sq++) key += this.cells[sq]
    return key
  }

  private bump(key: string, delta: number): void {
    const next = (this.counts.get(key) ?? 0) + delta
    if (next <= 0) this.counts.delete(key)
    else this.counts.set(key, next)
  }

  private pieceOn(square: number): Piece | undefined {
    const code = this.cells[square]
    const color = sideOf(code)
    if (!color) return undefined
    const type: PieceSymbol = isKing(code) ? 'k' : 'm'
    return { color, type }
  }
}

function publicMove(raw: RawMove, color: Color, suffix: string, before: string, after: string): Move {
  let flags = ''
  if (raw.captured.length > 0) flags += 'c'
  if (raw.promotion) flags += 'p'
  return {
    color,
    piece: isKing(raw.piece) ? 'k' : 'm',
    from: raw.from,
    to: raw.to,
    path: raw.path.slice(),
    captured: raw.captured.slice(),
    promotion: raw.promotion,
    san: raw.san,
    flags,
    suffix,
    before,
    after,
  }
}

function splitInput(input: MoveInput): { body: MoveInput; suffix: string } {
  if (typeof input !== 'string') return { body: input, suffix: '' }
  const matched = /^(\d+(?:[-x:]\d+)+)([!?+*=]+)?$/.exec(input.trim())
  if (!matched) throw new Error(`Invalid move: ${input}`)
  return { body: matched[1], suffix: matched[2] ?? '' }
}

function defaultHeaders(): Map<string, string> {
  return new Map([
    ['GameType', '20'],
    ['White', '?'],
    ['Black', '?'],
    ['Result', '*'],
  ])
}

function endgameOf(board: Uint8Array): Category {
  let whiteMen = 0
  let whiteKings = 0
  let blackMen = 0
  let blackKings = 0
  for (let sq = 1; sq <= 50; sq++) {
    const piece = board[sq]
    if (piece === WHITE_MAN) whiteMen++
    else if (piece === WHITE_KING) whiteKings++
    else if (piece === BLACK_MAN) blackMen++
    else if (piece === BLACK_KING) blackKings++
  }
  if (whiteMen === 0 && whiteKings === 1) return materialCategory(blackMen, blackKings)
  if (blackMen === 0 && blackKings === 1) return materialCategory(whiteMen, whiteKings)
  return 'none'
}

function materialCategory(men: number, kings: number): Category {
  if (men === 0 && (kings === 1 || kings === 2)) return 'five'
  if (men === 1 && kings === 1) return 'five'
  if (men === 0 && kings === 3) return 'sixteen'
  if (men === 1 && kings === 2) return 'sixteen'
  if (men === 2 && kings === 1) return 'sixteen'
  return 'none'
}
