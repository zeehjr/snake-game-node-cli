import { random } from "./utils";

/*
  TODO:

  - Collision with tail ✅
  - Don't allow apples to spawn below tail or player ✅
  - Use cursors to rewrite only changed "pixels" ✅
  - Implement "old direction" to use when pressing keys to avoid allowing direction invertion while pressing allowed direction and then pressing unallowed direction in the same frame. ✅
  - Old states and tails should be moved to arrays instead of being nested.
  - Menu Screen
  - Game Over Screen
  - Score
  - Leaderboard
  - Refactor with better practices
*/

export type Position = [x: number, y: number];

export enum Tile {
  Ground = 0,
  SnakeHead = 1,
  SnakeTail = 2,
  Apple = 3,
}

export type Board = {
  rows: number;
  columns: number;
};

export enum PlayerDirection {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

export const PlayerDirectionsArray = [
  PlayerDirection.UP,
  PlayerDirection.DOWN,
  PlayerDirection.LEFT,
  PlayerDirection.RIGHT,
];

export type Player = {
  x: number;
  y: number;
  direction: PlayerDirection;
  tail?: Player;
  previousState?: Player;
};

export type Apple = {
  x: number;
  y: number;
};

export type Game = {
  board: Board;
  player: Player;
  apple: Apple;
  gameOver?: boolean;
};

export function createGame(
  { rows, columns }: { rows: number; columns: number } = {
    rows: 50,
    columns: 50,
  }
): Game {
  const board: Board = {
    columns,
    rows,
  };
  const player = createPlayer(board);

  // createApple will replace apple position
  const apple = createApple({ board, player, apple: { x: 0, y: 0 } });

  return {
    board,
    apple,
    player,
  };
}

export function createBoard(
  size: { rows: number; columns: number } = { rows: 50, columns: 50 }
): Board {
  return {
    columns: size.columns,
    rows: size.rows,
  };
}

export function createPlayer(board: Board): Player {
  return {
    x: random(0, board.columns - 1),
    y: random(0, board.rows - 1),
    direction: PlayerDirectionsArray[random(0, 3)],
  };
}

export function playerPositions(
  player?: Player
): Array<[x: number, y: number]> {
  if (!player) return [];

  return [[player.x, player.y], ...playerPositions(player.tail)];
}

export function isPositionOcuppiedByPlayer(
  player: Player,
  [x, y]: [x: number, y: number]
): boolean {
  const positions = playerPositions(player);

  return positions.some(([pX, pY]) => pX === x && pY === y);
}

export function createApple(game: Game): Apple {
  const { board, player } = game;

  const x = random(0, board.columns - 1);
  const y = random(0, board.rows - 1);

  if (isPositionOcuppiedByPlayer(player, [x, y])) {
    return createApple(game);
  }

  return {
    x,
    y,
  };
}

export function movePlayer(player: Player): Player {
  return {
    ...player,
    x:
      player.direction === PlayerDirection.LEFT
        ? player.x - 1
        : player.direction === PlayerDirection.RIGHT
        ? player.x + 1
        : player.x,
    y:
      player.direction === PlayerDirection.UP
        ? player.y - 1
        : player.direction === PlayerDirection.DOWN
        ? player.y + 1
        : player.y,
    previousState: { ...player },
    tail: player.tail
      ? movePlayer({
          ...player.tail,
          direction: player.previousState?.direction ?? player.tail.direction,
        })
      : undefined,
  };
}

const hasPlayerHitTail = ({ player }: Game): boolean =>
  playerPositions(player.tail).some(
    ([x, y]) => player.x === x && player.y === y
  );

const hasPlayerHitBoard = ({ player, board }: Game): boolean =>
  player.x <= 0 ||
  player.x >= board.columns ||
  player.y <= 0 ||
  player.y >= board.rows;

export function hasPlayerHitApple({ player, apple }: Game): boolean {
  return player.x === apple.x && player.y === apple.y;
}

const hasPlayerFailed = (game: Game) =>
  hasPlayerHitTail(game) || hasPlayerHitBoard(game);

export function nextFrame(game: Game): Game {
  const { player, gameOver } = game;

  if (gameOver) return game;

  const newGame = { ...game, player: movePlayer(player) };

  if (hasPlayerFailed(newGame)) {
    return {
      // Return game instead of newGame because this can be Game Over screen,
      // so the snake head will not hide the object it hit.
      ...game,
      gameOver: true,
    };
  }

  if (hasPlayerHitApple(newGame)) {
    return {
      ...newGame,
      player: { ...newGame.player, tail: { ...player } },
      apple: createApple(newGame),
    };
  }

  return newGame;
}

export function tiles(game: Game): Array<Array<Tile>> {
  const { board, player, apple } = game;
  return [...new Array(board.rows)].map((_, y) =>
    [...new Array(board.columns)].map((_, x) => {
      if (player.x === x && player.y === y) {
        return Tile.SnakeHead;
      }

      if (
        playerPositions(player.tail).some(
          ([tailX, tailY]) => tailX === x && tailY === y
        )
      ) {
        return Tile.SnakeTail;
      }

      if (apple.x === x && apple.y === y) {
        return Tile.Apple;
      }

      return Tile.Ground;
    })
  );
}
