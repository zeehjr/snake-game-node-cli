import * as readline from "readline";
import * as chalk from "chalk";

/*
  TODO:

  - Collision with tail ✅
  - Don't allow apples to spawn below tail or player ✅
  - Better way to grow after eating apples. Actually it is "freezing" the tail
  - Menu Screen
  - Game Over Screen
  - Score
  - Leaderboard
  - Implement "old direction" to use when pressing keys to avoid allowing direction invertion while pressing allowed direction and then pressing unallowed direction in the same frame.
  - Use cursors to rewrite only changed "pixels"
  - Refactor with better practices

*/

type PlayerDirection = "UP" | "DOWN" | "LEFT" | "RIGHT";

type PlayerState = {
  x: number;
  y: number;
  direction: PlayerDirection;
  oldState?: PlayerState;
  tail?: PlayerState;
};

type AppleState = {
  x: number;
  y: number;
};

type State = {
  columns: number;
  rows: number;
  player: PlayerState;
  apple: AppleState;
};

const getTableBoundings = () => ({
  width: Math.floor(process.stdout.columns / 2),
  height: process.stdout.rows,
});

const refreshTableBoundings = (state: State): State => {
  const boundings = getTableBoundings();

  return {
    ...state,
    rows: boundings.height,
    columns: boundings.width,
  };
};

const reset = (): State => {
  const boundings = getTableBoundings();

  const playerX = Math.floor(Math.random() * (boundings.width - 2)) + 1;
  const playerY = Math.floor(Math.random() * (boundings.height - 2)) + 1;
  const appleX = Math.floor(Math.random() * (boundings.width - 2)) + 1;
  const appleY = Math.floor(Math.random() * (boundings.height - 2)) + 1;

  const playerDirectionNumber = Math.round(Math.random() * 3);

  const playerDirectionArray: Array<PlayerDirection> = [
    "UP",
    "DOWN",
    "LEFT",
    "RIGHT",
  ];

  const playerDirection = playerDirectionArray[playerDirectionNumber];

  return {
    apple: {
      x: appleX,
      y: appleY,
    },
    player: {
      x: playerX,
      y: playerY,
      direction: playerDirection,
    },
    rows: boundings.height,
    columns: boundings.width,
  };
};

const nextPlayer = (player: PlayerState): PlayerState => ({
  ...player,
  x:
    player.direction === "LEFT"
      ? player.x - 1
      : player.direction === "RIGHT"
      ? player.x + 1
      : player.x,
  y:
    player.direction === "UP"
      ? player.y - 1
      : player.direction === "DOWN"
      ? player.y + 1
      : player.y,
  oldState: { ...player },
  tail: player.tail
    ? nextPlayer({
        ...player.tail,
        direction: player.oldState?.direction ?? player.tail.direction,
      })
    : undefined,
});

const getPlayerPositions = (player?: PlayerState): Array<[number, number]> =>
  player ? [[player.x, player.y], ...getPlayerPositions(player.tail)] : [];

const next = (state: State): State => {
  const newPlayer = nextPlayer(state.player);

  if (
    newPlayer.x <= 0 ||
    newPlayer.y <= 0 ||
    newPlayer.x >= state.columns - 1 ||
    newPlayer.y >= state.rows - 1
  ) {
    return reset();
  }

  const tailPositions = getPlayerPositions(newPlayer.tail);

  if (tailPositions.some(([x, y]) => x === newPlayer.x && y === newPlayer.y)) {
    return reset();
  }

  const newState = {
    ...state,
    player: newPlayer,
  };

  if (state.player.x === state.apple.x && state.player.y === state.apple.y) {
    const playerPositions = getPlayerPositions(newPlayer);

    let newApple = reset().apple;

    while (
      playerPositions.some(([x, y]) => x === newApple.x && y === newApple.y)
    ) {
      newApple = reset().apple;
    }
    return {
      ...newState,
      player: {
        ...newState.player,
        tail: { ...state.player },
      },
      apple: newApple,
    };
  }

  return newState;
};

const setPlayerDirection =
  (newPlayerDirection: PlayerDirection) =>
  (state: State): State => ({
    ...state,
    player: {
      ...state.player,
      direction: newPlayerDirection,
    },
  });

const draw = (state: State, rd: readline.ReadLine) => {
  const lines = new Array<string>(state.rows);

  for (let y = 0; y < state.rows; y++) {
    lines[y] = "";
    for (let x = 0; x < state.columns; x++) {
      if (
        x === 0 ||
        x === state.columns - 1 ||
        y === 0 ||
        y === state.rows - 1
      ) {
        lines[y] = lines[y] + chalk.bgWhite("  ");
        continue;
      }

      if (state.player.x === x && state.player.y === y) {
        lines[y] = lines[y] + chalk.bgCyan("  ");
        continue;
      }

      if (
        getPlayerPositions(state.player).some(
          ([tailX, tailY]) => x === tailX && y === tailY
        )
      ) {
        lines[y] = lines[y] + chalk.bgYellow("  ");
        continue;
      }

      if (state.apple.x === x && state.apple.y === y) {
        lines[y] = lines[y] + chalk.bgRed("  ");
        continue;
      }

      lines[y] = lines[y] + chalk.bgBlack("  ");
    }
  }

  process.stdout.cursorTo(0, 0);

  for (const line of lines.slice(0, lines.length - 1)) {
    console.log(line);
  }

  process.stdout.write(lines[lines.length - 1]);
};

const snakeGame = () => {
  let state = reset();

  const rd = readline.createInterface(process.stdin, process.stdout);

  const handleInterval = () => {
    state = next(state);

    draw(state, rd);
  };

  const INTERVAL_MS = 100;

  setInterval(handleInterval, INTERVAL_MS);

  process.stdin.setEncoding("utf-8");

  process.stdin.on("keypress", (e, key) => {
    if (key.name === "up") {
      if (state.player.direction === "UP" || state.player.direction === "DOWN")
        return;
      state = setPlayerDirection("UP")(state);
    }

    if (key.name === "down") {
      if (state.player.direction === "UP" || state.player.direction === "DOWN")
        return;
      state = setPlayerDirection("DOWN")(state);
    }

    if (key.name === "left") {
      if (
        state.player.direction === "LEFT" ||
        state.player.direction === "RIGHT"
      )
        return;
      state = setPlayerDirection("LEFT")(state);
    }

    if (key.name === "right") {
      if (
        state.player.direction === "LEFT" ||
        state.player.direction === "RIGHT"
      )
        return;
      state = setPlayerDirection("RIGHT")(state);
    }
  });

  process.stdout.on("resize", () => {
    state = refreshTableBoundings(state);
    draw(state, rd);
  });

  draw(state, rd);
};

snakeGame();
