import { flow, pipe } from "fp-ts/lib/function";
import * as N from "fp-ts/lib/number";
import { random } from "./utils";
import { or, Predicate } from "fp-ts/lib/Predicate";
import { eq, option } from "fp-ts";

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

// Try semigroups https://dev.to/gcanti/getting-started-with-fp-ts-semigroup-2mf7
// Categories, applicatives, monads

export type Position = [x: number, y: number];

const eqPosition = eq.tuple<Position>(N.Eq, N.Eq);

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
  position: Position;
  direction: PlayerDirection;
  tail?: Player;
  previousState?: Player;
};

export type Apple = {
  position: Position;
};

export type Game = {
  board: Board;
  player: Player;
  apple: Apple;
  gameOver: boolean;
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

  const apple = createApple({
    board,
    player,
  });

  return {
    board,
    apple,
    player,
    gameOver: false,
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

export function randomPosition(board: Board): Position {
  return [random(0, board.columns - 1), random(0, board.rows - 1)];
}

export function createPlayer(board: Board): Player {
  return {
    position: randomPosition(board),
    direction: PlayerDirectionsArray[random(0, 3)],
  };
}

export function playerPositions(player?: Player): Array<Position> {
  if (!player) return [];

  return [player.position, ...playerPositions(player.tail)];
}

export function isPositionOcuppiedByPlayer(
  player: Player,
  position: Position
): boolean {
  const positions = playerPositions(player);

  return positions.some((playerPosition) =>
    eqPosition.equals(position, playerPosition)
  );
}

export function createApple(game: Pick<Game, "board" | "player">): Apple {
  const { board, player } = game;

  const position = randomPosition(board);

  if (isPositionOcuppiedByPlayer(player, position)) {
    return createApple(game);
  }

  return { position };
}

function nextPlayerPosition(player: Player): Position {
  const [playerX, playerY] = player.position;

  return [
    player.direction === PlayerDirection.LEFT
      ? playerX - 1
      : player.direction === PlayerDirection.RIGHT
      ? playerX + 1
      : playerX,
    player.direction === PlayerDirection.UP
      ? playerY - 1
      : player.direction === PlayerDirection.DOWN
      ? playerY + 1
      : playerY,
  ];
}

export function movePlayer(player: Player): Player {
  return {
    ...player,
    position: nextPlayerPosition(player),
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
  playerPositions(player.tail).some((tailPosition) =>
    eqPosition.equals(player.position, tailPosition)
  );

const hasPlayerHitBoard = ({
  player: {
    position: [playerX, playerY],
  },
  board,
}: Game): boolean =>
  playerX < 0 ||
  playerX >= board.columns ||
  playerY < 0 ||
  playerY >= board.rows;

export const hasPlayerHitApple: Predicate<Game> = ({ player, apple }) =>
  eqPosition.equals(player.position, apple.position);

const hasPlayerFailed: Predicate<Game> = pipe(
  hasPlayerHitTail,
  or(hasPlayerHitBoard)
);

const movePlayerInGame = (game: Game): Game => ({
  ...game,
  player: movePlayer(game.player),
});

const setGameOver = (game: Game): Game => ({
  ...game,
  gameOver: true,
});

const addTail = (game: Game): Game => ({
  ...game,
  player: {
    ...game.player,
    tail: game.player.previousState ? { ...game.player.previousState } : void 0,
  },
});

const newApplePosition = (game: Game): Game => ({
  ...game,
  apple: createApple(game),
});

const checkApple = (game: Game): Game =>
  pipe(
    game,
    option.fromPredicate(hasPlayerHitApple),
    option.map(addTail),
    option.map(newApplePosition),
    option.getOrElse(() => game)
  );

const checkGameOver = (game: Game): Game =>
  pipe(
    game,
    option.fromPredicate(hasPlayerFailed),
    option.map(setGameOver),
    option.getOrElse(() => game)
  );

export const nextGameState = flow(movePlayerInGame, checkApple, checkGameOver);

export const tailDirection = (
  player: Player
): option.Option<PlayerDirection> => {
  if (!player.tail) return option.none;

  const [playerX, playerY] = player.position;
  const [tailX, tailY] = player.tail.position;

  if (playerX > tailX) return option.some(PlayerDirection.LEFT);

  if (playerX < tailX) return option.some(PlayerDirection.RIGHT);

  if (playerY > tailY) return option.some(PlayerDirection.DOWN);

  if (playerY < tailY) return option.some(PlayerDirection.UP);

  return option.none;
};

export function tiles(game: Game): Array<Array<Tile>> {
  const { board, player, apple } = game;

  return [...new Array(board.rows)].map((_, y) =>
    [...new Array(board.columns)].map((_, x) => {
      const currentPosition: Position = [x, y];

      if (eqPosition.equals(player.position, currentPosition)) {
        return Tile.SnakeHead;
      }

      if (
        playerPositions(player.tail).some((tailPosition) =>
          eqPosition.equals(tailPosition, currentPosition)
        )
      ) {
        return Tile.SnakeTail;
      }

      if (eqPosition.equals(apple.position, currentPosition)) {
        return Tile.Apple;
      }

      return Tile.Ground;
    })
  );
}
