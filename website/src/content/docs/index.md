---
title: draughts.js
description: International draughts move generation, validation, FEN, PDN, and the draw rules.
---

International draughts (10×10), inspired by [chess.js](https://github.com/jhlywa/chess.js): move generation, validation, FEN, PDN, and the draw rules. No board UI and no engine.

It follows the official rules of international draughts in [FMJD Annex 1](https://www.fmjd.org/docs/Annex_1.pdf). Fifty dark squares, numbered 1–50. White sits at the bottom, on 31–50, and moves first. Black starts on 1–20. Square 46 is the lower-left dark square.

```ts
import { Draughts } from 'draughts.js'

const game = new Draughts()
while (!game.isGameOver()) {
  const moves = game.moves()
  game.move(moves[Math.floor(Math.random() * moves.length)])
}
console.log(game.pdn())
```

## Rules that the move generator has to get right

A man steps one square diagonally forward. White steps toward 1–5, black toward 46–50. A man captures one square diagonally forward or backward, and lands on the empty square immediately beyond.

A capture is one move. Captured pieces stay on the board until the sequence ends, so they still block squares and cannot be jumped again. An empty square may be passed more than once.

A king slides any number of empty squares. It captures at a distance: over one enemy piece, then any empty square beyond it. Between captures it may continue on the same diagonal or turn onto a perpendicular one. It cannot reverse over the piece just jumped, because that piece is still there.

Only a sequence that captures the most pieces is legal. A king counts as one piece. A man capture and a king capture of equal length are both legal. When several sequences take the same number, any of them may be played, and any legal final square.

A man promotes only when the move ends on the opponent's promotion row. White promotes on 1–5, black on 46–50. Passing through that row during a capture leaves it a man. The new king moves on a later turn.

The side to move loses when it has no pieces, or when it has pieces and no legal move.

Draws, also from Annex 1:

- The same placement with the same side to move occurs for the third time.
- 25 successive moves by each player, 50 plies, and every one of them is a non-capturing king move.
- One side has a lone king and the other has three kings, or two kings and a man, or one king and two men. After 16 further moves by each player in that endgame, the game is a draw. A capture that stays inside the endgame does not reset the count. The move that enters the endgame does not count.
- Two kings against one king, a king and a man against one king, or king against king. Same mechanism, with 5 moves each. Entering this from the 16-move endgame starts the 5-move count over.

King against king plays out the five moves. A shuttle that repeats the position usually hits the threefold rule on the way there.

If the move that exhausts a count leaves the opponent with no pieces or no move, that player loses.

`move()` throws once the game is over. The draws above are automatic. `moves()` still lists the piece-legal moves after a draw, so a UI can show them, but they cannot be played. `setHeader('Result', ...)` records a result the players agreed, the same way chess.js records one. It stays until a rules finish overwrites it.

Loading a FEN sets the 25-move clock and the endgame clock to zero. PDN FEN has no clock fields. A PDN played from the starting position counts those clocks from the moves.

Touch-move, j'adoube, crowning with a second physical piece, clocks, and resignation are table procedure. This library records the board, the moves, and the result.

## Notation

`move` accepts `'32-28'`, `'23x18'`, `'32x28x23'`, a capture written with `:`, or `{ from, to, path? }`. Output uses `-` and `x`.

`moves()` returns one entry per result. Two sequences that start on the same square, capture the same set, and finish on the same square are one move. The stored path is the lexicographically smallest landing sequence. Playing another legal order of that same result is accepted. A short `fromxto` that matches more than one result throws. Pass `{ strict: true }` to require the canonical spelling. The written form is `from-to` or `fromxto` when that pair is unique, and the full landing path when it is not.

`board()` is a 10×10 array. Row 0 is the top, black's side. Light squares are `null`. `ascii()` uses the same orientation, with `w`/`W` and `b`/`B`.

## FEN

PDN FEN, for example `W:W31-50:B1-20`. Loading accepts ranges, either colour first, a `K` prefix, and an empty side (`W:W:B1`). Writing is canonical: side to move, then `W`, then `B`, kings prefixed with `K` and written before the men, squares sorted, no spaces, no ranges, no trailing dot.

`validateFen` reports a bad string without throwing. The constructor, `load`, and `loadPdn` throw.

## PDN

One main line: tags, move numbers, `{comments}`, `;` line comments, a `FEN` tag with `SetUp`, a trailing result, and the suffix marks `! ? !! ?? !? ?!`. Parentheses are variations. `loadPdn` skips them. `loadPdn(pdn, { strict: true })` throws if one is present. `pdn()` writes the main line, the headers, the comments, and the stored suffix marks.

`GameType` other than 20 is rejected. A missing `GameType` is allowed. A result token in the file is kept even when the rules have not finished the game. `result()` follows the rules, not that header.

## API

| chess.js | draughts.js |
| --- | --- |
| `Chess` | `Draughts` |
| `load` / `fen` / `validateFen` | same, PDN FEN |
| `move` / `moves` / `undo` / `history` | same, numeric notation |
| `pgn` / `loadPgn` | `pdn` / `loadPdn` |
| `isCheckmate` / `isStalemate` | `isBlocked`. The side to move has no legal move, and has lost |
| `isDraw` / `isThreefoldRepetition` | same |
| `isDrawByFiftyMoves` | `isDrawByTwentyFiveMoves` |
| `isInsufficientMaterial` | `isDrawByEndgameRule` (the 16-move and 5-move endgames) |
| `isGameOver` | blocked, or any draw above |
| `turn`, `board`, `get`, `put`, `remove`, `clear`, `reset`, `ascii`, `moveNumber` | same roles |
| headers and comments | same roles, PDN tags and `{comments}` |

`inCheck`, `isAttacked`, and castling are absent. A capture is legal only as part of a maximal sequence, so a square-is-attacked query would lie.

Also `result(): '1-0' | '0-1' | '1/2-1/2' | '*'` and `winner(): 'w' | 'b' | null`.

`put`, `remove`, `load`, and `clear` drop the undo stack and the draw clocks. `reset` returns to the start. `load` keeps the player headers and rewrites `Result` from the rules.

```ts
const game = new Draughts()
game.move('35-30')
game.moves({ verbose: true })
game.fen()
game.undo()
```

Perft from the start, with duplicate capture orders removed: 9, 81, 658, 4265, 27117, 167140, 1049442.
