/* eslint-env node */

// backend/utils/contentModeration.js

// Content Moderation Utility
// Used by the Community Forum for:
// ✅ Detecting inappropriate language
// ✅ Detecting abusive phrases
// ✅ Detecting basic spam patterns
// ✅ Avoiding normal substring false positives
// ✅ Providing the same moderation result to the backend
//    and the frontend

const abusiveWords = [
  // -----------------------------------------
  // MILD PROFANITY / INSULTS
  // -----------------------------------------
  'damn',
  'hell',
  'crap',
  'stupid',
  'idiot',
  'fool',

  // -----------------------------------------
  // STRONG PROFANITY
  // -----------------------------------------
  'shit',
  'fuck',
  'bitch',
  'ass',

  // -----------------------------------------
  // ABUSIVE PHRASES
  // -----------------------------------------
  'shut up',
  'you are wrong',
  'you dont know',
  'you are lying',

  // -----------------------------------------
  // HARMFUL PHRASES
  // -----------------------------------------
  'hate you',
  'kill yourself',
  'you should die',

  // -----------------------------------------
  // SPAM INDICATORS
  // -----------------------------------------
  'buy now',
  'click here',
  'free money',
  'get rich quick'
];

// -----------------------------------------
// NORMALIZE TEXT
// -----------------------------------------
// Converts text into a consistent format before
// checking it for inappropriate content.
//
// Example:
// "You ARE  Lying!!!"
// becomes:
// "you are lying"
//
function normalizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// -----------------------------------------
// ESCAPE REGEX SPECIAL CHARACTERS
// -----------------------------------------
// This prevents words/phrases containing special
// characters from accidentally becoming regex patterns.
//
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// -----------------------------------------
// DETECT ABUSIVE CONTENT
// -----------------------------------------
function containsAbusiveLanguage(text) {
  if (!text || typeof text !== 'string') {
    return {
      isAbusive: false,
      detectedWords: [],
      severity: 'low'
    };
  }

  const normalizedText = normalizeText(text);
  const detectedWords = [];

  // -----------------------------------------
  // CHECK ABUSIVE WORDS / PHRASES
  // -----------------------------------------
  for (const word of abusiveWords) {
    const normalizedWord = normalizeText(word);

    if (!normalizedWord) {
      continue;
    }

    // Escape regex characters and match complete words.
    //
    // This prevents examples such as:
    // "class" being detected because it contains "ass".
    //
    const escapedWord = escapeRegex(normalizedWord);

    const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');

    if (regex.test(normalizedText)) {
      detectedWords.push(word);
    }
  }

  // -----------------------------------------
  // BASIC SPAM PATTERN DETECTION
  // -----------------------------------------

  // Excessive capital letters.
  const letterCharacters = text.match(/[A-Za-z]/g) || [];
  const upperCaseCharacters = text.match(/[A-Z]/g) || [];

  const excessiveCaps =
    letterCharacters.length >= 10 &&
    upperCaseCharacters.length / letterCharacters.length > 0.6;

  // Repeated characters such as:
  // "helloooooo"
  // "!!!!!!!"
  // "aaaaaa"
  const repeatedChars = /(.)\1{4,}/.test(text);

  if (excessiveCaps || repeatedChars) {
    detectedWords.push('spam_pattern');
  }

  const uniqueDetectedWords = [...new Set(detectedWords)];

  let severity = 'low';

  if (uniqueDetectedWords.length > 2) {
    severity = 'high';
  } else if (uniqueDetectedWords.length > 0) {
    severity = 'medium';
  }

  return {
    isAbusive: uniqueDetectedWords.length > 0,
    detectedWords: uniqueDetectedWords,
    severity
  };
}

// -----------------------------------------
// MAIN MODERATION FUNCTION
// -----------------------------------------
// This is the function currently used by
// backend/routes/forum.js.
//
// IMPORTANT:
// Unlike the previous version, this function now
// correctly returns isAbusive: true when inappropriate
// content is detected.
//
// The backend will use this result to:
// 1st violation -> warning
// 2nd violation -> warning
// 3rd violation -> 7-day suspension
// 4th violation -> permanent forum ban
//
function moderateContent(content, title = '') {
  const safeContent =
    typeof content === 'string' ? content : '';

  const safeTitle =
    typeof title === 'string' ? title : '';

  const fullText = safeTitle
    ? `${safeTitle} ${safeContent}`
    : safeContent;

  const result = containsAbusiveLanguage(fullText);

  return {
    isAbusive: result.isAbusive,
    detectedWords: result.detectedWords,
    severity: result.severity
  };
}

// -----------------------------------------
// EXPORTS
// -----------------------------------------
module.exports = {
  containsAbusiveLanguage,
  moderateContent,
  abusiveWords,
  normalizeText
};