---
title: Installation
description: Install draughts.js, import it from ESM or CommonJS, and play a game.
---

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
