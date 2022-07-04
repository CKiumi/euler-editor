import { Suggestion } from "./../src/suggest/suggest";
import { expect, test } from "vitest";

test("children", () => {
  expect(Suggestion.distance("abcd", "abcd")).toBe(3);
  expect(Suggestion.distance("abcd", "ab")).toBe(2);
  expect(Suggestion.distance("abcd", "bc")).toBe(0.99);
  expect(Suggestion.distance("abcd", "cx")).toBe(0);
  expect(Suggestion.distance("beta", "e")).toBe(0.99);
  expect(Suggestion.distance("epsilon", "e")).toBe(2);
});
