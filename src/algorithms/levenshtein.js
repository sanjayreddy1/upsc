/**
 * Levenshtein Distance Algorithm
 * Calculates the minimum number of single-character edits (insertions, deletions, substitutions)
 * required to change one word into another.
 */

export function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Normalized Levenshtein similarity (0 to 1).
 * 1 = identical, 0 = completely different.
 */
export function levenshteinSimilarity(a, b) {
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  return 1.0 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Compare two texts using normalized Levenshtein on sentences.
 * Splits into sentences and compares best matches.
 */
export function compareTextsLevenshtein(text1, text2) {
  const normalize = (t) =>
    t
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim();

  const words1 = normalize(text1).split(/\s+/).filter(Boolean);
  const words2 = normalize(text2).split(/\s+/).filter(Boolean);

  if (!words1.length || !words2.length) return 0;

  // Compare word-by-word with best matching
  let totalSim = 0;
  for (const w1 of words1) {
    let best = 0;
    for (const w2 of words2) {
      best = Math.max(best, levenshteinSimilarity(w1, w2));
    }
    totalSim += best;
  }

  return totalSim / words1.length;
}
