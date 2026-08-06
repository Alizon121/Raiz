// PLU codes are 4 digits (conventional) or 5 digits (94/93-prefix organic,
// 83-prefix historically GMO). Validate on that shape rather than trying to
// track the full IFPS-assigned range, which changes over time.
export function isValidPluFormat(text: string): boolean {
  return /^\d{4,5}$/.test(text.trim());
}

/**
 * Pulls every 4-5 digit run out of raw OCR text, in the order they appear.
 * A PLU sticker often has other numbers on it (price, weight), so this is
 * just candidate extraction — resolveBestPluCandidate narrows it down.
 */
export function extractPluCandidates(ocrText: string): string[] {
  const matches = ocrText.match(/\b\d{4,5}\b/g) ?? [];
  return [...new Set(matches)];
}

/**
 * Picks the most likely real PLU out of a set of OCR candidates. A
 * candidate that matches a code we actually have crop data for is a much
 * stronger signal than an arbitrary 4-5 digit read (which could easily be
 * a price or weight on the same sticker) — prefer that whenever one exists,
 * and only fall back to "first candidate found" when nothing matches.
 */
export function resolveBestPluCandidate(candidates: string[], knownPlus: ReadonlySet<string>): string | null {
  const knownMatch = candidates.find((c) => knownPlus.has(c));
  return knownMatch ?? candidates[0] ?? null;
}
