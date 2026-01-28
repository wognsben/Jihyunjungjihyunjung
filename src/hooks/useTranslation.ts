/**
 * Translation Hook
 * - Integrates DeepL translation with language context
 * - Auto-translates when language changes
 * - Returns translated text with loading state
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translate } from '@/services/translation';

interface UseTranslationResult {
  text: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Translate a single text based on current language
 */
export const useTranslation = (originalText: string): UseTranslationResult => {
  const { lang } = useLanguage();
  const [text, setText] = useState<string>(originalText);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performTranslation = async () => {
      if (!originalText || originalText.trim() === '') {
        setText('');
        return;
      }

      // Korean: return original
      if (lang === 'ko') {
        setText(originalText);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const translated = await translate(originalText, lang);
        setText(translated);
      } catch (err) {
        console.error('[useTranslation] Error:', err);
        setError(err instanceof Error ? err.message : 'Translation failed');
        setText(originalText); // Fallback to original
      } finally {
        setIsLoading(false);
      }
    };

    performTranslation();
  }, [originalText, lang]);

  return { text, isLoading, error };
};

/**
 * Translate multiple texts based on current language
 */
export const useTranslationBatch = (originalTexts: string[]): UseTranslationResult[] => {
  const { lang } = useLanguage();
  const [results, setResults] = useState<UseTranslationResult[]>(
    originalTexts.map(text => ({ text, isLoading: false, error: null }))
  );

  useEffect(() => {
    const performTranslations = async () => {
      // Korean: return originals
      if (lang === 'ko') {
        setResults(originalTexts.map(text => ({ text, isLoading: false, error: null })));
        return;
      }

      // Set loading state
      setResults(originalTexts.map(text => ({ text, isLoading: true, error: null })));

      // Translate each text
      const newResults: UseTranslationResult[] = [];
      for (const originalText of originalTexts) {
        if (!originalText || originalText.trim() === '') {
          newResults.push({ text: '', isLoading: false, error: null });
          continue;
        }

        try {
          const translated = await translate(originalText, lang);
          newResults.push({ text: translated, isLoading: false, error: null });
        } catch (err) {
          console.error('[useTranslationBatch] Error:', err);
          newResults.push({ 
            text: originalText, 
            isLoading: false, 
            error: err instanceof Error ? err.message : 'Translation failed' 
          });
        }
      }

      setResults(newResults);
    };

    performTranslations();
  }, [JSON.stringify(originalTexts), lang]);

  return results;
};

/**
 * Get translation function (imperatively call translation)
 */
export const useTranslator = () => {
  const { lang } = useLanguage();

  const translateText = async (text: string): Promise<string> => {
    if (!text || text.trim() === '' || lang === 'ko') {
      return text;
    }
    return translate(text, lang);
  };

  return { translateText, currentLang: lang };
};
