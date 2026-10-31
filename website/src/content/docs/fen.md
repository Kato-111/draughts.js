---
title: FEN
description: What a draughts FEN is, and the form draughts.js reads and writes.
---

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
