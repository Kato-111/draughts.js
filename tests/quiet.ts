import { Draughts } from '../src/draughts'

function hasCapture(game: Draughts): boolean {
  return game.moves({ verbose: true }).some((move) => move.captured.length > 0)
}

/** Quiet king moves that keep the opponent from being forced to capture. */
export function walkStrict(game: Draughts, plies: number): void {
  const seen = new Set<string>([game.fen()])
  for (let i = 0; i < plies; i++) {
    const moves = game.moves({ verbose: true }).filter((move) => move.captured.length === 0)
    let played = false
    for (const move of moves) {
      game.move(move.san)
      const now = game.fen()
      if (!seen.has(now) && !hasCapture(game) && !game.isGameOver()) {
        seen.add(now)
        played = true
        break
      }
      game.undo()
    }
    if (!played) throw new Error(`no strict quiet move at ply ${i} from ${game.fen()}`)
  }
}

/**
 * Like `walkStrict`, except the last ply may leave a capture, and may repeat
 * a position once. The completing ply of a draw clock is allowed to do both.
 */
export function walkToDraw(game: Draughts, plies: number, onPly?: (index: number) => void): void {
  const seen = new Map<string, number>([[game.fen(), 1]])
  for (let i = 0; i < plies; i++) {
    const last = i === plies - 1
    const moves = game.moves({ verbose: true }).filter((move) => move.captured.length === 0)
    let played = false
    for (const move of moves) {
      game.move(move.san)
      const now = game.fen()
      const times = seen.get(now) ?? 0
      const repeatOk = last ? times < 2 : times === 0
      const safe = last ? !game.isBlocked() : !hasCapture(game)
      if (repeatOk && safe && (last || !game.isGameOver())) {
        seen.set(now, times + 1)
        onPly?.(i)
        played = true
        break
      }
      game.undo()
    }
    if (!played) throw new Error(`no quiet move at ply ${i} from ${game.fen()}`)
  }
}
