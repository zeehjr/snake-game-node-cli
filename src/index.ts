import {
  createGame,
  tiles,
  Tile,
  nextGameState,
  PlayerDirection,
  tailDirection,
} from "./game";
import * as readline from "readline";
import chalk from "chalk";
import { isSome } from "fp-ts/lib/Option";

readline.createInterface(process.stdin, process.stdout);

let game = createGame({
  columns: Math.floor(process.stdout.columns / 2),
  rows: process.stdout.rows - 3,
});

const SPRITE: { [key in Tile]: string } = {
  [Tile.Ground]: chalk.bgGreen("  "),
  [Tile.SnakeHead]: chalk.bgYellow("  "),
  [Tile.Apple]: chalk.bgRed("  "),
  [Tile.SnakeTail]: chalk.bgBlue("  "),
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
  game = nextGameState(game);
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

const directionByInputKeyName = (input: string): PlayerDirection => {
  switch (input) {
    case "up":
      return PlayerDirection.UP;
    case "left":
      return PlayerDirection.LEFT;
    case "down":
      return PlayerDirection.DOWN;
    case "right":
      return PlayerDirection.RIGHT;
    default:
      return PlayerDirection.UP;
  }
};

process.stdin.on("keypress", (e, key) => {
  const forbiddenDirection = tailDirection(game.player);
  const newDirection = directionByInputKeyName(key.name);

  if (isSome(forbiddenDirection) && forbiddenDirection.value === newDirection) {
    return;
  }

  game = {
    ...game,
    player: { ...game.player, direction: newDirection },
  };
});
