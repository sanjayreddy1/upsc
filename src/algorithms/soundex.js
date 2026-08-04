/**
 * Soundex Phonetic Encoding Algorithm
 * Converts a word into a 4-character code based on how it sounds.
 * Useful for matching phonetically similar words.
 */

const SOUNDEX_MAP = {
  B: '1', F: '1', P: '1', V: '1',
  C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
  D: '3', T: '3',
  L: '4',
  M: '5', N: '5',
  R: '6',
};

export function soundexEncode(word) {
  if (!word || typeof word !== 'string') return '';

  const upper = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (!upper.length) return '';

  let code = upper[0];
  let lastDigit = SOUNDEX_MAP[upper[0]] || '';

  for (let i = 1; i < upper.length; i++) {
    const digit = SOUNDEX_MAP[upper[i]];
    if (digit && digit !== lastDigit) {
      code += digit;
      if (code.length === 4) break;
    }
    lastDigit = digit || '';
  }

  // Pad with zeros to ensure 4 characters
  return (code + '000').slice(0, 4);
}

/**
 * Compare two words phonetically using Soundex.
 * Returns 1 if codes match, 0 otherwise.
 */
export function soundexMatch(word1, word2) {
  return soundexEncode(word1) === soundexEncode(word2) ? 1 : 0;
}

/**
 * Compare two texts phonetically.
 * Returns the fraction of words in text1 that have a phonetic match in text2.
 */
export function compareTextsSoundex(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  if (!words1.length || !words2.length) return 0;

  const codes2 = words2.map(w => soundexEncode(w));
  let matches = 0;

  for (const w1 of words1) {
    const code1 = soundexEncode(w1);
    if (code1 && codes2.includes(code1)) {
      matches++;
    }
  }

  return matches / words1.length;
}
