---
title: API
description: What each Draughts method does, with the value it returns.
---

Everything public is the `Draughts` class, plus `START_FEN`, `validateFen`, and the types `Color`, `Move`, `MoveInput`, `Piece`, `PieceSymbol`, and `Square`.

```ts
import { Draughts, START_FEN, validateFen } from 'draughts.js'
```

A square is a number from 1 to 50. A colour is `'w'` or `'b'`. A piece is `{ color, type }`, and `type` is `'m'` for a man or `'k'` for a king.

## Constructor: new Draughts(fen?)

Starts a game. With no argument, the board is the opening and white is to move. A FEN starts from that position, with the 25-move count and the endgame count at zero. An invalid FEN throws, and no game is created.

The new game has the tags `GameType` `20`, `White` `?`, `Black` `?`, and `Result` `*`. If the position is already over, `Result` matches the rules.

```ts
import { Draughts } from 'draughts.js'

const draughts = new Draughts()
draughts.fen()
// -> 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20'

const late = new Draughts('W:W28:B33')
late.turn()
// -> 'w'

// throws Error: Invalid FEN: FEN must be turn:white:black
new Draughts('nope')
```

## .ascii()

Returns the board as text. Row 0, black's side, is the first line. A light square is two spaces. An empty dark square is `.`. A white man is `w`, a white king is `W`, a black man is `b`, and a black king is `B`.

```ts
const draughts = new Draughts()
console.log(draughts.ascii())
```

```text
  b   b   b   b   b
b   b   b   b   b
  b   b   b   b   b
b   b   b   b   b
  .   .   .   .   .
.   .   .   .   .
  w   w   w   w   w
w   w   w   w   w
  w   w   w   w   w
w   w   w   w   w
```

## .board()

Returns ten rows of ten squares. Row 0 is the top of the board, black's side. Each cell is a piece, or `null` when the square is light or empty. Use `get(square)` when you want the piece on a numbered square.

```ts
const draughts = new Draughts()

draughts.board()[0]
// -> [null, { color: 'b', type: 'm' }, null, { color: 'b', type: 'm' },
//     null, { color: 'b', type: 'm' }, null, { color: 'b', type: 'm' },
//     null, { color: 'b', type: 'm' }]
```

The other nine rows follow. Square 1 is the black man in the second cell of row 0.

## .clear()

Removes every piece and sets white to move. White then has no pieces, so white has lost. History, comments, and both draw counts are cleared. Tags other than `Result` are kept. `Result` becomes `0-1`.

```ts
const draughts = new Draughts()

draughts.clear()
draughts.fen()
// -> 'W:W:B'
draughts.result()
// -> '0-1'
draughts.winner()
// -> 'b'
```

## .fen()

Returns the current position in the written FEN form. See the FEN page for the fields. The string has no move history and no draw counts.

```ts
const draughts = new Draughts()
draughts.move('32-28')

draughts.fen()
// -> 'B:W28,31,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20'
```

## .get(square)

Returns the piece on `square`, or `undefined` when that square is empty, light, or outside 1–50.

```ts
const draughts = new Draughts()

draughts.get(32)
// -> { color: 'w', type: 'm' }
draughts.get(26)
// -> undefined
draughts.get(99)
// -> undefined
```

## .getComment()

Returns the comment on the current position, or `undefined` when that position has none.

```ts
const draughts = new Draughts()
draughts.move('32-28')
draughts.setComment('a quiet step')

draughts.getComment()
// -> 'a quiet step'
```

## .getComments()

Returns every stored comment, in the order the positions were reached. Each entry is `{ fen, comment }`.

```ts
const draughts = new Draughts()
draughts.setComment('start')
draughts.move('32-28')
draughts.setComment('after white')

draughts.getComments()
// -> [
//      { fen: 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20', comment: 'start' },
//      { fen: 'B:W28,31,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20', comment: 'after white' },
//    ]
```

## .getHeaders()

Returns the PDN tags as an object.

```ts
const draughts = new Draughts()

draughts.getHeaders()
// -> { GameType: '20', White: '?', Black: '?', Result: '*' }
```

## .history(options?)

Returns the moves already played, oldest first. With no options, the entries are notation strings. `{ verbose: true }` returns `Move` objects. See Move object below.

```ts
const draughts = new Draughts()
draughts.move('32-28')
draughts.move('18-23')

draughts.history()
// -> ['32-28', '18-23']
```

## .isBlocked()

Returns `true` when the player to move has no legal move. That includes having no pieces. That player has lost. It is a loss, and the draw checks below stay `false` in that position.

```ts
const draughts = new Draughts('W:W1:BK50')

draughts.isBlocked()
// -> true
draughts.moves()
// -> []
```

## .isDraw()

Returns `true` when article 6.1, 6.2, 6.3, or 6.4 applies and the player to move is not blocked. A loss is decided first, so a blocked player is never reported as a draw.

```ts
new Draughts().isDraw()
// -> false
```

## .isDrawByEndgameRule()

Returns `true` when article 6.3 or 6.4 has run out. Article 6.3 is one king against three kings, two kings and a man, or one king and two men, after 16 moves by each player. Article 6.4 is one king against two kings, a king and a man, or one king, after 5 moves by each player. The move that first reaches the material does not count. A capture that stays in the same article does not start the count again. Moving from 6.3 into 6.4 starts the 5-move count from zero. Returns `false` when the player to move is blocked. Loading a FEN starts this count at zero.

```ts
const draughts = new Draughts('W:WK50:BK5')

draughts.isDrawByEndgameRule()
// -> false
```

## .isDrawByTwentyFiveMoves()

Returns `true` after 25 successive non-capturing king moves by each player, which is 50 plies. A capture, or any move by a man, starts the count again. Returns `false` when the player to move is blocked. Loading a FEN starts this count at zero.

```ts
const draughts = new Draughts('W:WK46,K47:BK49,K50')

draughts.isDrawByTwentyFiveMoves()
// -> false
```

## .isGameOver()

Returns `true` when the player to move is blocked, or when the position is a draw.

```ts
new Draughts().isGameOver()
// -> false

new Draughts('W:W1:BK50').isGameOver()
// -> true
```

## .isThreefoldRepetition()

Returns `true` the third time the same pieces stand on the same squares with the same player to move. That is article 6.1. Returns `false` when the player to move is blocked, because the loss comes first.

```ts
const draughts = new Draughts('W:WK50:BK5')
const shuttle = ['50-44', '5-10', '44-50', '10-5']

for (const move of shuttle) draughts.move(move)
draughts.isThreefoldRepetition()
// -> false

for (const move of shuttle) draughts.move(move)
draughts.isThreefoldRepetition()
// -> true
draughts.result()
// -> '1/2-1/2'
```

## .load(fen)

Replaces the board with `fen`. The move history, the comments, and both draw counts are cleared. The tags are kept, and `Result` is rewritten from the rules. An invalid FEN throws and leaves the old game in place.

```ts
const draughts = new Draughts()
draughts.setHeader('White', 'A')
draughts.move('32-28')

draughts.load('W:W28:B33')
draughts.fen()
// -> 'W:W28:B33'
draughts.history()
// -> []
draughts.getHeaders().White
// -> 'A'

// throws, and the position above is still loaded
draughts.load('nope')
```

## .loadPdn(pdn, options?)

Reads a PDN string and replaces the current game. Tags in the file become the headers. A `FEN` tag, when present, is the starting position. Otherwise the game starts from the opening. A final result token is stored as the `Result` tag even when the rules have not ended the game.

`strict` defaults to `false`. Parentheses are a variation. The default skips what is inside them. `{ strict: true }` throws `PDN variations are not supported` when it reaches a variation. Moves before that parenthesis are already on the board. There is no variation tree to read back. `loadPdn` has already replaced the previous game by the time a later token throws.

`newlineChar` is the line break to normalise before reading. It defaults to `'\\r?\\n'`, so `\n` and `\r\n` are both line breaks. The value is a regular expression source.

A `GameType` other than `20` throws. A missing `GameType` is accepted. See the PDN page for comments, marks, and `SetUp`.

```ts
const draughts = new Draughts()

draughts.loadPdn('[White "A"]\n[Black "B"]\n\n1. 32-28 18-23 *')
draughts.history()
// -> ['32-28', '18-23']
draughts.getHeaders()
// -> { GameType: '20', White: 'A', Black: 'B', Result: '*' }

draughts.loadPdn('1. 32-28 (18-22) 18-23 *')
draughts.history()
// -> ['32-28', '18-23']

const strict = new Draughts()
// throws Error: PDN variations are not supported
// history is then ['32-28'], because that move was read before the parenthesis
strict.loadPdn('1. 32-28 (18-22) 18-23 *', { strict: true })
```

## .move(move, options?)

Plays one move and returns it as a `Move`. The argument is notation or an object `{ from, to, path? }`.

Notation uses a hyphen for a quiet move and `x` for a capture. A colon is accepted in place of `x`, so `'28:39'` is the same move as `'28x39'`. A longer capture may list every landing, as in `'32x28x23'`. The `san` in the returned move always uses `-` or `x`.

A mark glued to the notation, such as `'32-28!'`, is stored on `suffix`. The mark does not change the board. The marks are `!`, `?`, `!!`, `??`, `!?`, `?!`, `*`, `+`, and `=`.

`{ strict: true }` accepts only the spelling `moves()` would print. Another legal order of the same capture is refused with `Non-canonical move`.

The call throws `Game is over` when the game is already decided. It throws `Illegal move` when the move cannot be played, `Ambiguous move` when a short capture matches more than one result, and `Invalid move` when the text is not a move.

```ts
const draughts = new Draughts()

draughts.move('32-28')
// -> {
//      color: 'w',
//      piece: 'm',
//      from: 32,
//      to: 28,
//      path: [28],
//      captured: [],
//      promotion: false,
//      san: '32-28',
//      flags: '',
//      suffix: '',
//      before: 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20',
//      after: 'B:W28,31,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20',
//    }

draughts.undo()
draughts.move({ from: 32, to: 28 }).san
// -> '32-28'

const capture = new Draughts('W:W28:B33')
const taken = capture.move('28:39')
taken.san
// -> '28x39'
taken.flags
// -> 'c'
taken.captured
// -> [33]

const marked = new Draughts()
marked.move('32-28!').suffix
// -> '!'

const sequence = new Draughts('W:W11:B7,8')
sequence.move('11x2x13').san
// -> '11x13'
// throws Error: Non-canonical move: 11x2x13. Expected 11x13
new Draughts('W:W11:B7,8').move('11x2x13', { strict: true })
```

## .moveNumber()

Returns the move number, starting at 1. It increases after black moves.

```ts
const draughts = new Draughts()

draughts.moveNumber()
// -> 1
draughts.move('32-28')
draughts.moveNumber()
// -> 1
draughts.move('18-23')
draughts.moveNumber()
// -> 2
```

## .moves(options?)

Returns the legal moves for the player to move.

With no options, the result is an array of notation strings. `{ verbose: true }` returns `Move` objects. `{ square: 32 }` keeps only the moves that start on 32. An invalid square throws `Invalid square`.

When a capture can be played, only captures are returned, and each entry is one result: the same start square, the same set of captured pieces, and the same end square. The stored path is the landing order that comes first alphabetically.

After a draw, this list is still filled with the moves the pieces could make. `move()` refuses them, because the game is over.

```ts
const draughts = new Draughts()

draughts.moves()
// -> ['31-26', '31-27', '32-27', '32-28', '33-28', '33-29', '34-29', '34-30', '35-30']

draughts.moves({ square: 32 })
// -> ['32-27', '32-28']

const one = new Draughts('W:W32:B')
one.moves({ verbose: true })[0]
// -> {
//      color: 'w', piece: 'm', from: 32, to: 27, path: [27],
//      captured: [], promotion: false, san: '32-27', flags: '', suffix: '',
//      before: 'W:W32:B', after: 'B:W27:B',
//    }
```

## Move object

`moves({ verbose: true })`, `move()`, `undo()`, and `history({ verbose: true })` use this shape.

`color` is the player who made the move, `'w'` or `'b'`.

`piece` is `'m'` or `'k'`, the piece that moved, before promotion.

`from` is the start square. `to` is the square the piece ends on.

`path` is each landing square. A quiet move has `path: [to]`. A capture lists every landing, and the last one is `to`.

`captured` is the squares of the taken pieces, in the order of `path`.

`promotion` is `true` when a man ends the move as a king.

`san` is the notation, without a mark such as `!`. It is `from-to` or `fromxto` when that pair belongs to only one result. Otherwise it is the full list of landings.

`flags` is `'c'` for a capture, `'p'` for promotion, `'cp'` for both, and `''` when neither happens.

`suffix` is the mark that was attached to the notation, or `''`.

`before` is the FEN before the move. `after` is the FEN after it.

## .pdn(options?)

Returns the game as PDN text. The text has the tags, then a blank line, then the moves, the comments, the stored marks, and the `Result` tag.

`newline` defaults to `'\n'`. `maxWidth` wraps the movetext. `0`, the default, means no wrapping.

If the game did not start from the opening, the output adds `SetUp "1"` and a `FEN` tag for that start.

```ts
const draughts = new Draughts()
draughts.setHeader('White', 'A')
draughts.setHeader('Black', 'B')
draughts.move('32-28')
draughts.move('18-23')

console.log(draughts.pdn())
```

```text
[GameType "20"]
[White "A"]
[Black "B"]
[Result "*"]

1. 32-28 18-23 *
```

```ts
console.log(draughts.pdn({ maxWidth: 12 }))
```

```text
[GameType "20"]
[White "A"]
[Black "B"]
[Result "*"]

1. 32-28
18-23 *
```

```ts
const fromFen = new Draughts('W:W28:B33')
fromFen.move('28x39')
console.log(fromFen.pdn())
```

```text
[GameType "20"]
[White "?"]
[Black "?"]
[Result "1-0"]
[SetUp "1"]
[FEN "W:W28:B33"]

1. 28x39 1-0
```

## .put(piece, square)

Places a piece on a dark square from 1 to 50. `piece` is `{ color, type }`. Returns `true` when the piece is placed. Returns `false` when the square or the piece is not valid, and changes nothing in that case.

A successful placement clears the history, the comments, and both draw counts, and rewrites `Result`. The side to move stays as it was.

```ts
const draughts = new Draughts()

draughts.put({ type: 'q', color: 'w' }, 26)
// -> false

draughts.put({ type: 'k', color: 'w' }, 26)
// -> true
draughts.get(26)
// -> { color: 'w', type: 'k' }
```

## .remove(square)

Lifts the piece on `square` and returns it. Returns `undefined` when the square is empty or not a dark square from 1 to 50.

A successful removal clears the history, the comments, and both draw counts, and rewrites `Result`.

```ts
const draughts = new Draughts()
draughts.put({ type: 'k', color: 'w' }, 26)

draughts.remove(26)
// -> { color: 'w', type: 'k' }
draughts.remove(26)
// -> undefined
```

## .removeComment()

Deletes the comment on the current position and returns it. Returns `undefined` when that position had no comment.

```ts
const draughts = new Draughts()
draughts.move('32-28')
draughts.setComment('a quiet step')

draughts.removeComment()
// -> 'a quiet step'
draughts.getComment()
// -> undefined
```

## .removeComments()

Deletes every comment and returns what was stored, in play order. A later `getComments()` returns `[]`.

```ts
const draughts = new Draughts()
draughts.setComment('start')
draughts.move('32-28')
draughts.setComment('after white')

draughts.removeComments()
// -> [
//      {
//        fen: 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20',
//        comment: 'start',
//      },
//      {
//        fen: 'B:W28,31,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20',
//        comment: 'after white',
//      },
//    ]
draughts.getComments()
// -> []
```

## .removeHeader(key)

Removes one tag. Returns `true` when the tag was present, and `false` when it was not.

```ts
const draughts = new Draughts()

draughts.removeHeader('White')
// -> true
draughts.removeHeader('White')
// -> false
```

## .reset()

Returns to the opening. The history, the comments, and both draw counts are cleared. `White`, `Black`, and `GameType` are kept. `Result` is rewritten from the rules.

```ts
const draughts = new Draughts()
draughts.setHeader('White', 'A')
draughts.move('32-28')

draughts.reset()
draughts.fen()
// -> 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20'
draughts.history()
// -> []
draughts.getHeaders()
// -> { GameType: '20', White: 'A', Black: '?', Result: '*' }
```

## .result()

Returns the result from the rules. It does not read the `Result` tag.

`'0-1'` when white is blocked. `'1-0'` when black is blocked. `'1/2-1/2'` for a draw. `'*'` while the game continues.

If the move that finishes a draw count also leaves the opponent with no pieces or no legal move, the opponent has lost, and this method returns the loss.

```ts
new Draughts().result()
// -> '*'

new Draughts('W:W1:BK50').result()
// -> '0-1'

const capture = new Draughts('W:W28:B33')
capture.move('28x39')
capture.result()
// -> '1-0'
```

## .setComment(comment)

Sets the comment on the current position. The text is trimmed. An empty comment removes the comment for that position. Braces throw `Comment cannot contain braces`, because a PDN comment is wrapped in `{}`.

```ts
const draughts = new Draughts()
draughts.move('32-28')
draughts.setComment('a quiet step')

console.log(draughts.pdn())
```

```text
[GameType "20"]
[White "?"]
[Black "?"]
[Result "*"]

1. 32-28 {a quiet step} *
```

## .setHeader(key, value)

Sets one tag and returns all of them. The name must match `[A-Za-z0-9_]+`. The value must not contain `"`. `setHeader('Result', ...)` stores a result the players agreed. The rules replace that tag when the game actually ends. `result()` still answers from the rules.

```ts
const draughts = new Draughts()

draughts.setHeader('White', 'A')
// -> { GameType: '20', White: 'A', Black: '?', Result: '*' }
```

## .turn()

Returns `'w'` or `'b'`, whoever moves next.

```ts
const draughts = new Draughts()

draughts.turn()
// -> 'w'
draughts.move('32-28')
draughts.turn()
// -> 'b'
```

## .undo()

Takes back the last move and returns it. Returns `null` when the game is still at the start. If that move had ended the game, `Result` goes back to `*`.

```ts
const draughts = new Draughts()

draughts.undo()
// -> null

draughts.move('32-28')
draughts.undo().san
// -> '32-28'
draughts.fen()
// -> 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20'
```

## .winner()

Returns `'w'` or `'b'` when the other player is blocked. Returns `null` when the game is unfinished or drawn.

```ts
new Draughts().winner()
// -> null

new Draughts('W:W1:BK50').winner()
// -> 'b'

const capture = new Draughts('W:W28:B33')
capture.move('28x39')
capture.winner()
// -> 'w'
```

## START_FEN

The opening position, written out in full. White to move, white men on 31–50, black men on 1–20. No ranges.

```ts
import { START_FEN } from 'draughts.js'

START_FEN
// -> 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20'
```

## validateFen(fen)

Checks a FEN without building a game. Returns `{ ok: true }` or `{ ok: false, error }`. `new Draughts(fen)`, `load(fen)`, and a PDN whose `FEN` tag is invalid all throw `Invalid FEN` with that same `error` text.

```ts
import { validateFen } from 'draughts.js'

validateFen('W:W:B1')
// -> { ok: true }

validateFen('nope')
// -> { ok: false, error: 'FEN must be turn:white:black' }
```
