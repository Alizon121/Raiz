import { extractPluCandidates, isValidPluFormat, resolveBestPluCandidate } from "../plu";

describe("isValidPluFormat", () => {
  test.each(["4131", "94131", "0000"])("accepts 4-5 digit codes like %s", (code) => {
    expect(isValidPluFormat(code)).toBe(true);
  });

  test.each(["413", "941311", "abcd", "41a1", ""])("rejects everything that isn't 4-5 digits, like %s", (code) => {
    expect(isValidPluFormat(code)).toBe(false);
  });

  test("tolerates surrounding whitespace", () => {
    expect(isValidPluFormat("  4131  ")).toBe(true);
  });
});

describe("extractPluCandidates", () => {
  test("pulls 4-5 digit runs out of noisy OCR text", () => {
    expect(extractPluCandidates("PLU 4131\nGala Apple\n$1.99/lb")).toEqual(["4131"]);
  });

  test("returns multiple candidates when several plausible numbers appear", () => {
    expect(extractPluCandidates("4131 94131")).toEqual(["4131", "94131"]);
  });

  test("ignores numbers that aren't 4-5 digits (prices, single digits, long runs)", () => {
    expect(extractPluCandidates("1 23 199 123456")).toEqual([]);
  });

  test("de-duplicates repeated reads of the same code", () => {
    expect(extractPluCandidates("4131 4131 4131")).toEqual(["4131"]);
  });

  test("returns an empty array for text with no digits at all", () => {
    expect(extractPluCandidates("Organic Gala Apple")).toEqual([]);
  });
});

describe("resolveBestPluCandidate", () => {
  test("prefers a candidate that matches a known PLU over an arbitrary one", () => {
    const result = resolveBestPluCandidate(["1234", "4131"], new Set(["4131"]));
    expect(result).toBe("4131");
  });

  test("falls back to the first candidate when none match the known set", () => {
    const result = resolveBestPluCandidate(["1234", "5678"], new Set(["4131"]));
    expect(result).toBe("1234");
  });

  test("returns null when there are no candidates at all", () => {
    expect(resolveBestPluCandidate([], new Set(["4131"]))).toBeNull();
  });
});
