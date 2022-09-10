import { Suggestion } from "./../src/suggest/suggest";
import { expect, test } from "vitest";

test("children", () => {
  expect(Suggestion.d("abcd", "abcd")).toBe(3);
  expect(Suggestion.d("abcd", "ab")).toBe(2);
  expect(Suggestion.d("abcd", "bc")).toBe(0.99);
  expect(Suggestion.d("abcd", "cx")).toBe(0);
  expect(Suggestion.d("beta", "e")).toBe(0.99);
  expect(Suggestion.d("epsilon", "e")).toBe(2);
});
