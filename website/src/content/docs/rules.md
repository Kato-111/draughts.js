---
title: Rules
description: The FMJD rules draughts.js enforces for men, kings, captures, promotion, wins, and draws.
---

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
