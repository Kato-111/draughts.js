---
title: PDN
description: What Portable Draughts Notation is, and what draughts.js keeps from a game file.
---

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
