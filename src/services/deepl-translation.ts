/**
 * DeepL Translation Service via WordPress API
 * - Calls WordPress REST API endpoint that uses DeepL
 * - WordPress caches translations in post meta to save API tokens
 * - Ensures translation consistency across sessions
 */

import axios from 'axios';

const WP_API_BASE = 'https://wognsben97.mycafe24.com/wp-json';
const DEEPL_ENDPOINT = `${WP_API_BASE}/deepl/v1/translate-post`;

type Language = 'ko' | 'en' | 'jp';

// Map our language codes to DeepL API format
const DEEPL_LANG_MAP: Record<Language, string> = {
  ko: 'KO',
  en: 'EN',
  jp: 'JA',
};

interface TranslatePostParams {
  post_id: number;
  target_lang: string;
  field: 'title' | 'content' | 'excerpt';
}

interface TranslatePostResponse {
  success: boolean;
  translated_text: string;
  from_cache: boolean;
}

/**
 * Translate a specific field of a WordPress post
 * WordPress handles caching, so repeated calls are free
 */
export const translatePostField = async (
  postId: number,
  field: 'title' | 'content' | 'excerpt',
  targetLang: Language
): Promise<string> => {
  // Korean doesn't need translation
  if (targetLang === 'ko') {
    throw new Error('Korean is the source language - no translation needed');
  }

  try {
    console.log(`[DeepL] 📡 Calling WordPress API for post ${postId}, field: ${field}, lang: ${targetLang}`);
    
    const response = await axios.post<TranslatePostResponse>(
      DEEPL_ENDPOINT,
      {
        post_id: postId,
        target_lang: DEEPL_LANG_MAP[targetLang],
        field,
      } as TranslatePostParams,
      {
        timeout: 30000, // 30s timeout for DeepL API
      }
    );

    if (response.data.success) {
      // Log if translation came from cache or fresh API call
      const source = response.data.from_cache ? '💾 Cache' : '🌐 DeepL API';
      console.log(`[Translation] ${source}: ${field} (${targetLang})`);
      
      return response.data.translated_text;
    }

    throw new Error('WordPress returned success: false');
  } catch (error) {
    console.error(`[Translation] ❌ Failed to translate ${field}:`, error);
    
    // Check if it's a network error (WordPress API not set up)
    if (axios.isAxiosError(error)) {
      if (error.code === 'ERR_NETWORK' || error.response?.status === 404) {
        console.warn(`[Translation] ⚠️ WordPress API not available. Please add the code to functions.php`);
        console.warn(`[Translation] 📝 See TRANSLATION_GUIDE.md for setup instructions`);
      }
    }
    
    throw error;
  }
};

/**
 * Translate multiple fields of a post at once
 * Returns a map of field -> translated text
 */
export const translatePost = async (
  postId: number,
  fields: Array<'title' | 'content' | 'excerpt'>,
  targetLang: Language
): Promise<Record<string, string>> => {
  // Korean doesn't need translation
  if (targetLang === 'ko') {
    return {};
  }

  const results: Record<string, string> = {};

  // Translate all fields in parallel
  const promises = fields.map(async (field) => {
    try {
      const translated = await translatePostField(postId, field, targetLang);
      results[field] = translated;
    } catch (error) {
      console.warn(`[Translation] Skipping ${field} due to error:`, error);
      results[field] = ''; // Empty string on error
    }
  });

  await Promise.all(promises);

  return results;
};

/**
 * Batch translate multiple posts
 * Useful for translating entire work/text lists
 */
export const translatePostBatch = async (
  posts: Array<{ id: number; fields: Array<'title' | 'content' | 'excerpt'> }>,
  targetLang: Language,
  delayMs: number = 100 // Small delay to avoid overwhelming the server
): Promise<Map<number, Record<string, string>>> => {
  const results = new Map<number, Record<string, string>>();

  for (const post of posts) {
    try {
      const translated = await translatePost(post.id, post.fields, targetLang);
      results.set(post.id, translated);

      // Small delay between posts
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`[Translation] Failed to translate post ${post.id}:`, error);
      results.set(post.id, {}); // Empty object on error
    }
  }

  return results;
};
