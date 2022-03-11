import { createGame, tiles, Tile, nextFrame, PlayerDirection } from "./game";
import * as readline from "readline";
import chalk from "chalk";

readline.createInterface(process.stdin, process.stdout);

let game = createGame({
  columns: Math.floor(process.stdout.columns / 2),
  rows: process.stdout.rows - 3,
});

const SPRITE: { [key in Tile]: string } = {
  [Tile.Ground]: chalk.bgBlue("  "),
  [Tile.SnakeHead]: chalk.bgYellow("  "),
  [Tile.Apple]: chalk.bgRed("  "),
  [Tile.SnakeTail]: chalk.bgGreen("  "),
};

const draw = (
  tiles: Array<Array<Tile>>,
  previousTiles: Array<Array<Tile>> | null
) => {
  process.stdout.cursorTo(0, 0);

  if (!previousTiles) {
    console.clear();

    for (const [index, row] of tiles.entries()) {
      process.stdout.cursorTo(0, index + 3);

      process.stdout.write(row.map((tile) => SPRITE[tile]).join(""));
    }
    return;
  }

  for (let y = 0; y < game.board.rows; y++) {
    let changed = false;

    for (let x = 0; x < game.board.columns; x++) {
      const currentTile = tiles[y][x];
      if (!previousTiles || currentTile !== previousTiles[y][x]) {
        process.stdout.cursorTo(x * 2, y + 3);
        process.stdout.write(SPRITE[currentTile]);
        changed = true;
      }
    }
    if (changed) {
      process.stdout.cursorTo(0, 0);
    }
  }
};

let previousTiles: Array<Array<Tile>> | null;

console.clear();

setInterval(() => {
  if (game.gameOver) {
    game = createGame({
      columns: Math.floor(process.stdout.columns / 2),
      rows: process.stdout.rows - 3,
    });
    return;
  }

  draw(tiles(game), previousTiles);

  previousTiles = tiles(game);
  game = nextFrame(game);
}, 50);

process.stdout.on("resize", () => {
  game = {
    ...game,
    board: {
      columns: Math.floor(process.stdout.columns / 2),
      rows: process.stdout.rows - 3,
    },
  };

  previousTiles = null;
});

process.stdin.setEncoding("utf-8");

process.stdin.on("keypress", (e, key) => {
  const previousDirection = game.player.previousState?.direction;

  if (key.name === "up") {
    if (
      previousDirection === PlayerDirection.UP ||
      previousDirection === PlayerDirection.DOWN
    )
      return;
    game = {
      ...game,
      player: { ...game.player, direction: PlayerDirection.UP },
    };
  }

  if (key.name === "down") {
    if (
      previousDirection === PlayerDirection.UP ||
      previousDirection === PlayerDirection.DOWN
    )
      return;
    game = {
      ...game,
      player: { ...game.player, direction: PlayerDirection.DOWN },
    };
  }

  if (key.name === "left") {
    if (
      previousDirection === PlayerDirection.LEFT ||
      previousDirection === PlayerDirection.RIGHT
    )
      return;
    game = {
      ...game,
      player: { ...game.player, direction: PlayerDirection.LEFT },
    };
  }

  if (key.name === "right") {
    if (
      previousDirection === PlayerDirection.LEFT ||
      previousDirection === PlayerDirection.RIGHT
    )
      return;
    game = {
      ...game,
      player: { ...game.player, direction: PlayerDirection.RIGHT },
    };
  }
});
