import { Game, movePlayer, Player, PlayerDirection } from "./game";

const GAME_MOCK: Game = {
  board: {
    columns: 50,
    rows: 50,
  },
  player: {
    x: 5,
    y: 5,
    direction: PlayerDirection.RIGHT,
  },
  apple: {
    x: 49,
    y: 49,
  },
};

describe("Game", () => {
  describe("movePlayer(player)", () => {
    describe("given player with playerDirection RIGHT", () => {
      const player: Player = {
        ...GAME_MOCK.player,
        direction: PlayerDirection.RIGHT,
      };
      const nextPlayer = movePlayer(player);

      it("should increase X position by 1", () => {
        const expected = player.x + 1;

        expect(nextPlayer.x).toBe(expected);
      });

      it("should keep the same Y position", () => {
        const expected = player.y;

        expect(nextPlayer.y).toBe(expected);
      });
    });

    describe("given player with playerDirection LEFT", () => {
      const player: Player = {
        ...GAME_MOCK.player,
        direction: PlayerDirection.LEFT,
      };
      const nextPlayer = movePlayer(player);

      it("should decrease X position by 1", () => {
        const expected = player.x - 1;

        expect(nextPlayer.x).toBe(expected);
      });

      it("should keep the same Y position", () => {
        const expected = player.y;

        expect(nextPlayer.y).toBe(expected);
      });
    });

    describe("given player with playerDirection UP", () => {
      const player: Player = {
        ...GAME_MOCK.player,
        direction: PlayerDirection.UP,
      };
      const nextPlayer = movePlayer(player);

      it("should decrease Y position by 1", () => {
        const expected = player.y - 1;

        expect(nextPlayer.y).toBe(expected);
      });

      it("should keep the same X position", () => {
        const expected = player.x;

        expect(nextPlayer.x).toBe(expected);
      });
    });

    describe("given player with playerDirection DOWN", () => {
      const player: Player = {
        ...GAME_MOCK.player,
        direction: PlayerDirection.DOWN,
      };
      const nextPlayer = movePlayer(player);

      it("should increase Y position by 1", () => {
        const expected = player.y + 1;

        expect(nextPlayer.y).toBe(expected);
      });

      it("should keep the same X position", () => {
        const expected = player.x;

        expect(nextPlayer.x).toBe(expected);
      });
    });
  });
});
