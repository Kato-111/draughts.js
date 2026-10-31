---
title: Notation
description: How a draughts move is written, and how draughts.js reads it.
---

Notation is the text of one move. A quiet move uses a hyphen. A capture uses `x`.

`32-28` means the piece on 32 moves to 28 and takes nothing. `23x18` means the piece on 23 captures and lands on 18. `32x28x23` writes each landing of a longer capture. A colon is accepted in place of `x`, so `23:18` is the same move as `23x18`.

`move` accepts that text, or an object `{ from, to, path? }`. The text it gives back always uses `-` or `x`.

A capture has one result: the square it starts on, the set of pieces it takes, and the square it finishes on. Two different orders that take the same pieces and finish on the same square are the same move. `moves()` lists that move once. The path it stores is the landing order that comes first alphabetically. Another legal order of the same result is still accepted when you play it.

A short form such as `27x1` is refused when more than one result starts on 27 and ends on 1. `move(text, { strict: true })` also refuses a spelling that is legal but not the one the library would write. The written form is `from-to` or `fromxto` when that pair belongs to only one result. Otherwise it is the full list of landings.

`board()` returns 10 rows and 10 columns. Row 0 is the top of the board, black's side. A light square is `null`, and so is an empty dark square. `ascii()` prints the same orientation. A white man is `w`, a white king is `W`, a black man is `b`, and a black king is `B`.
