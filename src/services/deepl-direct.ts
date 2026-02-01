/**
 * MyMemory Translation API Integration (Frontend)
 * - Free translation API with no API key required
 * - CORS enabled (works directly from browser)
 * - 1000 requests/day free limit
 * - Uses localStorage for persistent caching
 * - Rate limiting: 500ms between requests (increased for free API)
 * 
 * API: https://mymemory.translated.net/doc/spec.php
 */

import axios from 'axios';

// MyMemory API endpoint
const TRANSLATION_API_URL = 'https://api.mymemory.translated.net/get';

// Cache configuration
const CACHE_VERSION = 'v1_mymemory';
const CACHE_PREFIX = `translation_${CACHE_VERSION}_`;
const STATS_KEY = 'translation_stats';

// Rate limiting
const REQUEST_DELAY_MS = 500; // 500ms between requests (increased for free API)
let lastRequestTime = 0;

type Language = 'ko' | 'en' | 'jp';

// Language codes for MyMemory API
const LANG_MAP: Record<Language, string> = {
  ko: 'ko',
  en: 'en',
  jp: 'ja',
};

interface TranslationStats {
  totalCached: number;
  totalApiCalls: number;
  lastUpdate: string;
  dailyRequests: number;
  dailyLimit: number;
}

interface CacheEntry {
  text: string;
  timestamp: number;
}

// Log service initialization
console.log('✅ [Translation] MyMemory API service loaded (Frontend mode)');
console.log('🌐 [Translation] API URL:', TRANSLATION_API_URL);
console.log('📊 [Translation] Free tier: 1000 requests/day');

/**
 * Generate cache key
 */
const getCacheKey = (text: string, targetLang: Language): string => {
  // Use first 100 chars + length for key (avoid too long keys)
  const textKey = text.substring(0, 100) + `_len${text.length}`;
  return `${CACHE_PREFIX}ko_${targetLang}_${textKey}`;
};

/**
 * Get cached translation
 */
const getCache = (text: string, targetLang: Language): string | null => {
  try {
    const key = getCacheKey(text, targetLang);
    const cached = localStorage.getItem(key);
    if (cached) {
      const entry: CacheEntry = JSON.parse(cached);
      // Cache never expires (translations don't change)
      return entry.text;
    }
    return null;
  } catch (error) {
    console.warn('[Translation] Cache read error:', error);
    return null;
  }
};

/**
 * Set cached translation
 */
const setCache = (text: string, targetLang: Language, translated: string): void => {
  try {
    const key = getCacheKey(text, targetLang);
    const entry: CacheEntry = {
      text: translated,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
    
    // Update stats
    updateStats(text.length, true);
  } catch (error) {
    console.warn('[Translation] Cache write error:', error);
  }
};

/**
 * Get translation statistics
 */
export const getDeepLStats = (): TranslationStats => {
  try {
    const stats = localStorage.getItem(STATS_KEY);
    if (stats) {
      return JSON.parse(stats);
    }
  } catch (error) {
    console.warn('[Translation] Stats read error:', error);
  }
  
  return {
    totalCached: 0,
    totalApiCalls: 0,
    lastUpdate: '',
    dailyRequests: 0,
    dailyLimit: 1000, // MyMemory Free: 1000 requests/day
  };
};

/**
 * Update translation statistics
 */
const updateStats = (charCount: number, fromCache: boolean): void => {
  try {
    const stats = getDeepLStats();
    
    const now = new Date();
    const currentDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const lastDay = stats.lastUpdate.substring(0, 10);
    
    // Reset daily usage if new day
    if (currentDay !== lastDay) {
      stats.dailyRequests = 0;
      stats.totalApiCalls = 0;
    }
    
    if (fromCache) {
      stats.totalCached += 1;
    } else {
      stats.totalApiCalls += 1;
      stats.dailyRequests += 1;
    }
    
    stats.lastUpdate = now.toISOString();
    
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    
    // Warn if approaching limit
    if (stats.dailyRequests > stats.dailyLimit * 0.8) {
      console.warn(`[Translation] ⚠️ Approaching daily limit: ${stats.dailyRequests}/${stats.dailyLimit} requests`);
    }
  } catch (error) {
    console.warn('[Translation] Stats update error:', error);
  }
};

/**
 * Clear translation cache
 */
export const clearDeepLCache = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem(STATS_KEY);
    console.log('[Translation] Cache cleared');
  } catch (error) {
    console.error('[Translation] Cache clear error:', error);
  }
};

/**
 * Call MyMemory Translation API
 */
const callTranslationAPI = async (text: string, targetLang: Language): Promise<string> => {
  // Check daily limit
  const stats = getDeepLStats();
  if (stats.dailyRequests >= stats.dailyLimit) {
    throw new Error(`Translation daily limit reached: ${stats.dailyRequests}/${stats.dailyLimit} requests`);
  }
  
  // Rate limiting: wait if needed
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
  
  try {
    const response = await axios.get(TRANSLATION_API_URL, {
      params: {
        q: text,
        langpair: `${LANG_MAP.ko}|${LANG_MAP[targetLang]}`,
      },
      timeout: 15000, // 15s timeout
    });
    
    if (response.data?.responseData?.translatedText) {
      return response.data.responseData.translatedText;
    }
    
    throw new Error('Invalid response from translation API');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Translation rate limit exceeded. Please try again later');
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error('Translation request timeout. Please try again');
      }
    }
    throw error;
  }
};

/**
 * Translate text from Korean to target language
 * - Uses cache first (localStorage)
 * - Falls back to MyMemory API if not cached
 * - Auto-caches new translations
 */
export const translateDeepL = async (text: string, targetLang: Language): Promise<string> => {
  // No translation needed for Korean
  if (targetLang === 'ko') {
    return text;
  }
  
  // Empty text
  if (!text || text.trim() === '') {
    return text;
  }
  
  try {
    // Check cache first
    const cached = getCache(text, targetLang);
    if (cached) {
      console.log(`[Translation] 💾 Cache hit: ${text.substring(0, 30)}...`);
      updateStats(text.length, true);
      return cached;
    }
    
    // Call Translation API
    console.log(`[Translation] 🌐 Translating to ${targetLang}: ${text.substring(0, 30)}...`);
    const translated = await callTranslationAPI(text, targetLang);
    
    // Cache the result
    setCache(text, targetLang, translated);
    
    console.log(`[Translation] ✅ Translated: ${translated.substring(0, 30)}...`);
    
    return translated;
  } catch (error) {
    console.error('[Translation] Translation error:', error);
    
    // Fallback to original Korean text
    console.warn(`[Translation] ⚠️ Fallback to original: ${text.substring(0, 30)}...`);
    return text;
  }
};

/**
 * Translate multiple texts in batch
 * - Includes rate limiting to avoid overwhelming API
 * - Uses cache when available
 */
export const translateDeepLBatch = async (
  texts: string[],
  targetLang: Language,
  delayMs: number = 500 // Delay between API calls (increased for free API)
): Promise<string[]> => {
  const results: string[] = [];
  
  for (const text of texts) {
    try {
      const translated = await translateDeepL(text, targetLang);
      results.push(translated);
      
      // Small delay between API calls (only if not from cache)
      const cached = getCache(text, targetLang);
      if (!cached && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error('[Translation] Batch translation error:', error);
      results.push(text); // Fallback to original
    }
  }
  
  return results;
};

/**
 * Get remaining daily quota (estimated)
 */
export const getRemainingQuota = (): { used: number; limit: number; remaining: number } => {
  const stats = getDeepLStats();
  return {
    used: stats.dailyRequests,
    limit: stats.dailyLimit,
    remaining: stats.dailyLimit - stats.dailyRequests,
  };
};