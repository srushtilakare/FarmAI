/* eslint-env node */
// Content moderation utility for detecting abusive language
// This is a basic implementation - in production, consider using ML-based solutions or APIs

const abusiveWords = [
  // Profanity (common words - this is a basic list)
  'damn', 'hell', 'crap', 'stupid', 'idiot', 'fool',
  // More severe words (censored for safety)
  'f***', 's***', 'b****', 'a**', 'a***',
  // Abusive phrases
  'shut up', 'you are wrong', 'you dont know', 'you are lying',
  // Hate speech indicators
  'hate you', 'kill yourself', 'you should die',
  // Spam indicators
  'buy now', 'click here', 'free money', 'get rich quick'
];

// Normalize text for comparison
function normalizeText(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Check if text contains abusive language
function containsAbusiveLanguage(text) {
  if (!text || typeof text !== 'string') {
    return { isAbusive: false, detectedWords: [] };
  }

  const normalizedText = normalizeText(text);
  const detectedWords = [];

  // Check for exact word matches
  for (const word of abusiveWords) {
    const normalizedWord = normalizeText(word);
    if (normalizedText.includes(normalizedWord)) {
      detectedWords.push(word);
    }
  }

  // Check for patterns (e.g., repeated characters, excessive caps)
  const excessiveCaps = (text.match(/[A-Z]/g) || []).length > text.length * 0.5 && text.length > 10;
  const repeatedChars = /(.)\1{4,}/.test(text); // Same character repeated 5+ times
  
  if (excessiveCaps || repeatedChars) {
    detectedWords.push('spam_pattern');
  }

  return {
    isAbusive: detectedWords.length > 0,
    detectedWords: [...new Set(detectedWords)], // Remove duplicates
    severity: detectedWords.length > 2 ? 'high' : detectedWords.length > 0 ? 'medium' : 'low'
  };
}

// Check content for both posts and replies
function moderateContent(content, title = '') {
  const fullText = title ? `${title} ${content}` : content;
  return containsAbusiveLanguage(fullText);
}

module.exports = {
  containsAbusiveLanguage,
  moderateContent,
  abusiveWords
};

