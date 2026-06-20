// ============================================================
// Topic Extractor Service
// ============================================================

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
  'these', 'those', 'it', 'its', 'i', 'we', 'you', 'he', 'she', 'they',
  'me', 'us', 'him', 'her', 'them', 'my', 'our', 'your', 'his', 'their',
  'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'not',
  'no', 'yes', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'than', 'too', 'very', 'just', 'about', 'also',
  'new', 'used', 'using', 'use', 'based', 'via', 'like', 'github', 'com',
  'http', 'https', 'www', 'arxiv', 'org', 'pdf', 'abs', 'paper', 'research',
]);

/**
 * Extracts key topics and subtopics from page titles, notes, and highlights.
 * It detects single keywords and multi-word phrases (bigrams/trigrams).
 */
export function extractTopics(text: string): { topic: string; subtopics: string[] }[] {
  if (!text) return [];

  const cleanText = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleanText.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w));
  
  // Frequency counting for single words
  const wordFreq = new Map<string, number>();
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }

  // Frequency counting for bigrams (two-word phrases)
  const bigramFreq = new Map<string, number>();
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    bigramFreq.set(bigram, (bigramFreq.get(bigram) || 0) + 1);
  }

  // Sort bigrams and pick top ones
  const sortedBigrams = Array.from(bigramFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .filter(([phrase, freq]) => freq > 1);

  // Group single words as subtopics under key phrases or dominant words
  const result: { topic: string; subtopics: string[] }[] = [];

  // Use top bigrams as main topics
  const usedWords = new Set<string>();
  
  for (const [phrase] of sortedBigrams.slice(0, 5)) {
    const phraseWords = phrase.split(' ');
    // Find related subtopics: words that often co-occur in the list but are not part of the phrase itself
    const subtopics: string[] = [];
    phraseWords.forEach(w => usedWords.add(w));

    // Find other frequent words related to this topic contextually
    // For simplicity, find the next most frequent single words that aren't stop words or in the phrase
    const candidates = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .filter(([w]) => !phraseWords.includes(w) && !usedWords.has(w))
      .slice(0, 3)
      .map(([w]) => w);

    result.push({
      topic: capitalizePhrase(phrase),
      subtopics: candidates.map(capitalizePhrase),
    });
  }

  // If no bigrams were found, fallback to top single words
  if (result.length === 0) {
    const sortedWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    for (const [word] of sortedWords) {
      result.push({
        topic: capitalizePhrase(word),
        subtopics: [],
      });
    }
  }

  return result;
}

function capitalizePhrase(phrase: string): string {
  return phrase
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
