/* eslint-env node */

// Improved Content Moderation Utility
// Fixes:
// ✅ No substring false positives
// ✅ Cleaner word detection
// ✅ Safer demo behavior

const abusiveWords = [
  // Mild profanity
  'damn', 'hell', 'crap', 'stupid', 'idiot', 'fool',

  // Strong words (cleaned versions)
  'shit', 'fuck', 'bitch', 'ass',

  // Abusive phrases
  'shut up', 'you are wrong', 'you dont know', 'you are lying',

  // Harmful phrases
  'hate you', 'kill yourself', 'you should die',

  // Spam indicators
  'buy now', 'click here', 'free money', 'get rich quick'
];

// Normalize text
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')   // remove special chars
    .replace(/\s+/g, ' ')       // normalize spaces
    .trim();
}

// Detect abusive content (IMPROVED)
function containsAbusiveLanguage(text) {
  if (!text || typeof text !== 'string') {
    return { isAbusive: false, detectedWords: [] };
  }

  const normalizedText = normalizeText(text);
  const detectedWords = [];

  for (const word of abusiveWords) {
    const normalizedWord = normalizeText(word);

    // ✅ MATCH FULL WORD ONLY (fixes your issue)
    const regex = new RegExp(`\\b${normalizedWord}\\b`, 'i');

    if (regex.test(normalizedText)) {
      detectedWords.push(word);
    }
  }

  // Optional: spam pattern detection
  const excessiveCaps =
    (text.match(/[A-Z]/g) || []).length > text.length * 0.6 &&
    text.length > 10;

  const repeatedChars = /(.)\1{4,}/.test(text);

  if (excessiveCaps || repeatedChars) {
    detectedWords.push('spam_pattern');
  }

  return {
    isAbusive: detectedWords.length > 0,
    detectedWords: [...new Set(detectedWords)],
    severity:
      detectedWords.length > 2
        ? 'high'
        : detectedWords.length > 0
        ? 'medium'
        : 'low'
  };
}

// Main moderation function
function moderateContent(content, title = '') {
  const fullText = title ? `${title} ${content}` : content;

  const result = containsAbusiveLanguage(fullText);

  // 🔥 IMPORTANT: ALLOW POSTS BUT SHOW WARNING (BEST FOR PROJECT)
  return {
    isAbusive: false, // ❌ disables blocking
    detectedWords: result.detectedWords,
    severity: result.severity
  };
}

module.exports = {
  containsAbusiveLanguage,
  moderateContent,
  abusiveWords
};