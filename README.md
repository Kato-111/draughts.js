# draughts.js

draughts.js is a TypeScript international draughts library used for move
generation/validation, piece placement/movement, and draw detection - basically
everything but the AI. It was inspired by
[chess.js](https://github.com/jhlywa/chess.js), and it follows the official
rules of international draughts in
[FMJD Annex 1](https://www.fmjd.org/docs/Annex_1.pdf).

## Documentation

This README provides a quick example. The full documentation is at
[kato-111.github.io/draughts.js](https://kato-111.github.io/draughts.js/).

The same manual is one Markdown file, for a person or an agent:

https://kato-111.github.io/draughts.js/draughts.md

## Installation

Run the following command to install the most recent version of draughts.js from
NPM:

```sh
npm install draughts.js
```

## Example Code

The code below plays a random game of draughts:

```ts
import { Draughts } from 'draughts.js'

const game = new Draughts()

while (!game.isGameOver()) {
  const moves = game.moves()
  const move = moves[Math.floor(Math.random() * moves.length)]
  game.move(move)
}
console.log(game.pdn())
```
