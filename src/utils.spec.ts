import { random } from "./utils";

describe("Utils", () => {
  it("should work", () => {
    const data = [...new Array(5000)].map(() => random(1, 5));

    data.forEach((randomNumber) => {
      expect(randomNumber).toBeGreaterThanOrEqual(1);
      expect(randomNumber).toBeLessThanOrEqual(5);
    });

    expect(data.some((n) => n === 1)).toBe(true);

    expect(data.some((n) => n === 5)).toBe(true);
  });
});
