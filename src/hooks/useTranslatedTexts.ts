/**
 * Translated Texts Hook
 * - Automatically translates TextItem data based on current language
 * - Uses DeepL API with localStorage caching
 * - Only translates title and author (summary can be added if needed)
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translate } from '@/services/translation';
import { TextItem } from '@/data/texts';

interface TranslatedTextItem extends TextItem {
  _isTranslating?: boolean;
}

export const useTranslatedTexts = (originalTexts: TextItem[]): {
  texts: TranslatedTextItem[];
  isTranslating: boolean;
} => {
  const { lang } = useLanguage();
  const [translatedTexts, setTranslatedTexts] = useState<TranslatedTextItem[]>(originalTexts);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const performTranslation = async () => {
      // Korean: return original
      if (lang === 'ko') {
        setTranslatedTexts(originalTexts);
        setIsTranslating(false);
        return;
      }

      if (originalTexts.length === 0) {
        return;
      }

      setIsTranslating(true);

      try {
        // Translate all texts
        const translated = await Promise.all(
          originalTexts.map(async (item) => {
            // Translate title and author
            const [translatedTitle, translatedAuthor] = await Promise.all([
              translate(item.title.ko, lang),
              translate(item.author.ko, lang),
            ]);

            return {
              ...item,
              title: {
                ...item.title,
                [lang]: translatedTitle,
              },
              author: {
                ...item.author,
                [lang]: translatedAuthor,
              },
            };
          })
        );

        setTranslatedTexts(translated);
      } catch (error) {
        console.error('[useTranslatedTexts] Translation error:', error);
        // Fallback to original texts
        setTranslatedTexts(originalTexts);
      } finally {
        setIsTranslating(false);
      }
    };

    performTranslation();
  }, [lang, originalTexts]);

  return { texts: translatedTexts, isTranslating };
};