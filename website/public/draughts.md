# draughts.js

The draughts.js manual in one file. Sections follow the documentation sidebar, in order: Overview, Installation, Rules, Notation, FEN, PDN, API.

https://kato-111.github.io/draughts.js/draughts.md

# Overview

draughts.js is a TypeScript international draughts library used for move generation/validation, piece placement/movement, and draw detection. It was inspired by [chess.js](https://github.com/jhlywa/chess.js), and it follows the official rules of international draughts in [FMJD Annex 1](https://www.fmjd.org/docs/Annex_1.pdf).

The library has no board on screen and no computer opponent.

The same manual is one Markdown file, in the same order as this sidebar (Overview, Installation, Rules, Notation, FEN, PDN, API), for a person or an agent:

https://kato-111.github.io/draughts.js/draughts.md

# Installation

Run the following command to install the most recent version of draughts.js from NPM:

```sh
npm install draughts.js
```

Node.js 18 or newer.

## Importing

### Import (as ESM)

```js
import { Draughts } from 'draughts.js'
```

ECMAScript modules can be imported in a browser:

```html
<script type="module">
  import { Draughts } from 'draughts.js'
</script>
```

### Import (as CommonJS)

```js
const { Draughts } = require('draughts.js')
```

## Example Code

The code below plays a random game of draughts:

```js
import { Draughts } from 'draughts.js'

const game = new Draughts()

while (!game.isGameOver()) {
  const moves = game.moves()
  const move = moves[Math.floor(Math.random() * moves.length)]
  game.move(move)
}

console.log(game.pdn())
```

# Rules

draughts.js follows the official rules of international draughts, [FMJD Annex 1](https://www.fmjd.org/docs/Annex_1.pdf). This page is what those rules mean for a move the library will accept.

## The board

Play is on the 50 dark squares. They are numbered 1 to 50. Square 1 is at the top, on black's side. Square 46 is the dark square in the bottom-left corner.

White's 20 men start on 31–50. Black's 20 men start on 1–20. White moves first.

## Men

A man moves one square diagonally forward. White moves toward the smaller numbers, the row 1–5. Black moves toward the larger numbers, the row 46–50.

A man captures by jumping over an enemy piece on a neighbouring diagonal square, forward or backward, and stopping on the empty square immediately past it.

## Kings

A king moves any number of empty squares along a diagonal.

A king captures from a distance. It jumps one enemy piece and may stop on any empty square beyond that piece. It may then turn 90 degrees and capture again. It cannot turn back over the piece it just jumped, because that piece is still on the board until the move is finished.

## Captures

Several jumps in a row are still one move. The player picks each landing square, and the whole sequence counts as a single turn.

A captured piece stays where it is until the sequence ends. It still blocks a square, and it cannot be jumped a second time. An empty square may be crossed more than once.

The move must take as many pieces as possible. A king counts as one piece, the same as a man. When two sequences take the same number, either may be played, and the piece may finish on any legal square.

## Promotion

A man becomes a king only when the move ends on the opponent's back row. White promotes on 1–5. Black promotes on 46–50.

If a man only passes through that row while capturing, it stays a man. A piece that has just promoted does not go on capturing as a king in the same turn.

## Winning

The player to move loses in two cases. They have no pieces left, or they have pieces but no legal move. That player has lost. It is not a draw.

## Draws

These draws are automatic. They are articles 6.1 to 6.4 of FMJD Annex 1.

**6.1 Threefold repetition.** The same pieces are on the same squares, and the same player is to move, for the third time.

**6.2 Twenty-five quiet king moves.** Each player has made 25 moves in a row, and every one of those moves was a king move that took nothing. That is 50 moves. A capture, or any move by a man, starts the count again.

**6.3 Sixteen moves.** One player has only a king. The other has three kings, or two kings and a man, or one king and two men. After 16 further moves by each player, the game is drawn. The move that first reached this material does not count. A capture that leaves the material in this same group does not start the count again.

**6.4 Five moves.** One player has only a king. The other has two kings, or a king and a man, or only a king. The count works the same way, with 5 moves by each player. Moving from article 6.3 into article 6.4 starts the 5-move count from zero.

If the move that would complete one of these counts also leaves the opponent with no pieces or no legal move, the opponent loses.

After a draw, `moves()` still lists moves the pieces could make. `move()` refuses them, because the game is over.

`setHeader('Result', ...)` can store a result the players agreed. That note stays until the rules themselves end the game.

A position loaded from a FEN starts the 25-move count and the endgame count at zero. A FEN has no field for those counts. A whole game loaded from PDN counts them from the moves.

Touch-move, j'adoube, placing a second piece on a new king, clocks, and the way a player resigns are outside this library. It records the board, the moves, and the result.

# Notation

Notation is the text of one move. A quiet move uses a hyphen. A capture uses `x`.

`32-28` means the piece on 32 moves to 28 and takes nothing. `23x18` means the piece on 23 captures and lands on 18. `32x28x23` writes each landing of a longer capture. A colon is accepted in place of `x`, so `23:18` is the same move as `23x18`.

`move` accepts that text, or an object `{ from, to, path? }`. The text it gives back always uses `-` or `x`.

A capture has one result: the square it starts on, the set of pieces it takes, and the square it finishes on. Two different orders that take the same pieces and finish on the same square are the same move. `moves()` lists that move once. The path it stores is the landing order that comes first alphabetically. Another legal order of the same result is still accepted when you play it.

A short form such as `27x1` is refused when more than one result starts on 27 and ends on 1. `move(text, { strict: true })` also refuses a spelling that is legal but not the one the library would write. The written form is `from-to` or `fromxto` when that pair belongs to only one result. Otherwise it is the full list of landings.

`board()` returns 10 rows and 10 columns. Row 0 is the top of the board, black's side. A light square is `null`, and so is an empty dark square. `ascii()` prints the same orientation. A white man is `w`, a white king is `W`, a black man is `b`, and a black king is `B`.

# FEN

A FEN is one line of text for a single position. It says who is to move and which squares are occupied. It does not list the moves that were played to reach that position.

draughts.js uses the FEN defined for Portable Draughts Notation. The line has three fields, separated by colons:

```text
W:WK10,K15,18,24,27,28:B12,16,20,K22,K25,K29
```

- The first field is `W` or `B`: the side to move.
- The second field is white. It starts with `W`. A king is marked with `K` and is written before the men. Square numbers are separated by commas.
- The third field is black, written the same way and starting with `B`.

The opening position is white to move, white men on 31–50, and black men on 1–20. `START_FEN` is that position written out in full, with every square listed.

A FEN you load may use a few shortcuts. `31-50` means every square from 31 through 50. The black field may be written before the white field. A side with no pieces is still present, as in `W:W:B1`.

A FEN the library writes does not use those shortcuts. The side to move comes first, then white, then black. Kings come before men, squares are in numerical order, and there are no spaces, no ranges, and no dot at the end.

`validateFen(fen)` checks a string without changing a game. It returns `{ ok: true }` or `{ ok: false, error }`. `new Draughts(fen)`, `load(fen)`, and a PDN whose `FEN` tag is invalid all throw `Invalid FEN`.

# PDN

PDN is Portable Draughts Notation. It is the text of a whole game, the way a scoresheet is: tags for the players and the event, then the moves in order, then the result. A comment can sit next to a position. A FEN can name a starting position other than the opening.

```text
[GameType "20"]
[White "A"]
[Black "B"]
[Result "*"]

1. 32-28 18-23 2. 33-29 *
```

`GameType` 20 means international draughts on the 10×10 board. A file with no `GameType` is accepted. Any other value is rejected.

The movetext can contain:

- Move numbers, such as `1.` and `1...` when black is to move first.
- Moves in the notation on the Notation page.
- Comments in braces, `{like this}`. A `;` starts a comment that runs to the end of the line.
- Marks after a move: `!`, `?`, `!!`, `??`, `!?`, `?!`, and also `*`, `+`, and `=`. The library stores the mark. It does not change the move.
- A final result: `1-0`, `0-1`, `1/2-1/2`, or `*`.

Parentheses are a variation, another line the players did not play. `loadPdn` skips what is inside them. `loadPdn(pdn, { strict: true })` throws if a variation is present. There is no tree of variations to read back.

`pdn()` writes the tags, the comments, the moves, and the stored marks. If the game did not start from the opening, it adds `SetUp "1"` and a `FEN` tag for that start.

A result written in the file is kept as the `Result` tag even when the rules have not ended the game. `result()` answers from the rules, not from that tag.

`loadPdn` replaces the current game. `newlineChar` is the line break to normalise before reading. The default treats `\n` and `\r\n` as line breaks.

# API

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
