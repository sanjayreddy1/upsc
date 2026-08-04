/**
 * Jaro-Winkler Similarity Algorithm
 * Measures similarity between two strings, prioritizing prefix matches.
 * Returns a value between 0 (no similarity) and 1 (identical).
 */

export function jaroSimilarity(s1, s2) {
  if (s1 === s2) return 1.0;
  if (!s1.length || !s2.length) return 0.0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions / 2) / matches) /
    3.0
  );
}

export function jaroWinklerSimilarity(s1, s2, prefixScale = 0.1) {
  const jaroScore = jaroSimilarity(s1, s2);

  // Calculate common prefix (up to 4 characters)
  let prefix = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length, 4); i++) {
    if (s1[i] === s2[i]) {
      prefix++;
    } else {
      break;
    }
  }

  return jaroScore + prefix * prefixScale * (1 - jaroScore);
}

/**
 * Compare two texts using Jaro-Winkler on individual words.
 * Returns average similarity across all words.
 */
export function compareTextsJaroWinkler(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/).filter(Boolean);
  const words2 = text2.toLowerCase().split(/\s+/).filter(Boolean);

  if (!words1.length || !words2.length) return 0;

  let totalSimilarity = 0;
  let comparisons = 0;

  for (const w1 of words1) {
    let bestMatch = 0;
    for (const w2 of words2) {
      const sim = jaroWinklerSimilarity(w1, w2);
      bestMatch = Math.max(bestMatch, sim);
    }
    totalSimilarity += bestMatch;
    comparisons++;
  }

  return comparisons > 0 ? totalSimilarity / comparisons : 0;
}
