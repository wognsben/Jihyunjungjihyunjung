import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchWorks, fetchTexts } from '@/services/wp-api';
import { translateDeepL } from '@/services/deepl-direct';
import { Work } from '@/data/works';
import { TextItem } from '@/data/texts';

type Language = 'ko' | 'en' | 'jp';

interface WorkContextType {
  works: Work[];
  texts: TextItem[];
  isLoading: boolean;
  error: string | null;
  getWorkById: (id: string) => Work | undefined;
  translateWorksToLanguage: (lang: Language) => Promise<void>;
  translateWorksByIds: (workIds: string[], lang: Language) => Promise<void>;
  translateTextsByIds: (textIds: string[], lang: Language) => Promise<void>;
  currentLang: Language;
}

// Create context with undefined default value
const WorkContext = createContext<WorkContextType | undefined>(undefined);

export const WorkProvider = ({ children }: { children: ReactNode }) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<Language>('ko');

  // Fetch Korean data only once on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      console.log('[WorkProvider] Starting data fetch...');
      setIsLoading(true);
      setError(null);
      try {
        // Fetch Korean data only (source language)
        const [fetchedWorks, fetchedTexts] = await Promise.all([
          fetchWorks('ko'),
          fetchTexts('ko')
        ]);
        
        if (isMounted) {
          console.log(`[WorkProvider] Fetched ${fetchedWorks.length} works and ${fetchedTexts.length} texts`);
          if (fetchedWorks.length === 0 && fetchedTexts.length === 0) {
             console.warn('WordPress API returned no data.');
             setWorks([]);
             setTexts([]);
          } else {
             setWorks(fetchedWorks);
             setTexts(fetchedTexts);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load WordPress data', err);
          setError('Failed to load data');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []); // Fetch only once

  // Translate works to target language
  const translateWorksToLanguage = async (lang: Language) => {
    if (lang === 'ko') {
      setCurrentLang('ko');
      return;
    }

    console.log(`[WorkContext] 🌐 Translating to ${lang.toUpperCase()}...`);
    setCurrentLang(lang);

    try {
      const translatedWorks = await Promise.all(
        works.map(async (work) => {
          try {
            const translatedTitle = await translateDeepL(work.title_ko || '', lang);
            const translatedOneLine = await translateDeepL(work.oneLineInfo_ko || '', lang);
            const translatedDesc = await translateDeepL(work.description_ko || '', lang);

            return {
              ...work,
              [`title_${lang}`]: translatedTitle || work.title_ko,
              [`oneLineInfo_${lang}`]: translatedOneLine || work.oneLineInfo_ko,
              [`description_${lang}`]: translatedDesc || work.description_ko,
            };
          } catch (error) {
            console.error(`[WorkContext] ❌ Failed to translate work ${work.id}:`, error);
            return work;
          }
        })
      );

      setWorks(translatedWorks);

      const translatedTexts = await Promise.all(
        texts.map(async (text) => {
          try {
            const [translatedTitle, translatedSummary] = await Promise.all([
              translateDeepL(text.title.ko || '', lang),
              translateDeepL(text.summary.ko || '', lang),
            ]);

            return {
              ...text,
              title: {
                ...text.title,
                [lang]: translatedTitle || text.title.ko,
              },
              summary: {
                ...text.summary,
                [lang]: translatedSummary || text.summary.ko,
              },
            };
          } catch (error) {
            console.error(`[WorkContext] Failed to translate text ${text.id}:`, error);
            return text;
          }
        })
      );

      setTexts(translatedTexts);
    } catch (error) {
      console.error('[WorkContext] Translation failed:', error);
    }
  };

  // Translate specific works by IDs
  const translateWorksByIds = async (workIds: string[], lang: Language) => {
    if (lang === 'ko') {
      setCurrentLang('ko');
      return;
    }

    console.log(`[WorkContext] 🌐 Translating specific works to ${lang.toUpperCase()}...`);
    setCurrentLang(lang);

    try {
      const translatedWorks = await Promise.all(
        works.map(async (work) => {
          if (workIds.includes(work.id)) {
            const langKey = `title_${lang}` as keyof Work;
            const existingTranslation = work[langKey] as string | undefined;
            if (existingTranslation && existingTranslation.trim() !== '' && existingTranslation !== work.title_ko) {
              return work;
            }

            try {
              const translatedTitle = await translateDeepL(work.title_ko || '', lang);
              const translatedOneLine = await translateDeepL(work.oneLineInfo_ko || '', lang);
              const translatedDesc = await translateDeepL(work.description_ko || '', lang);

              return {
                ...work,
                [`title_${lang}`]: translatedTitle || work.title_ko,
                [`oneLineInfo_${lang}`]: translatedOneLine || work.oneLineInfo_ko,
                [`description_${lang}`]: translatedDesc || work.description_ko,
              };
            } catch (error) {
              console.error(`[WorkContext] ❌ Failed to translate work ${work.id}:`, error);
              return work;
            }
          } else {
            return work;
          }
        })
      );

      setWorks(translatedWorks);
    } catch (error) {
      console.error('[WorkContext] Translation failed:', error);
    }
  };

  // Translate specific texts by IDs
  const translateTextsByIds = async (textIds: string[], lang: Language) => {
    if (lang === 'ko') {
      setCurrentLang('ko');
      return;
    }

    console.log(`[WorkContext] 🌐 Translating specific texts to ${lang.toUpperCase()}...`);
    setCurrentLang(lang);

    try {
      const translatedTexts = await Promise.all(
        texts.map(async (text) => {
          if (textIds.includes(text.id)) {
            const existingTranslation = text.title[lang];
            if (existingTranslation && existingTranslation.trim() !== '' && existingTranslation !== text.title.ko) {
              return text;
            }

            try {
              const translatedTitle = await translateDeepL(text.title.ko || '', lang);
              const translatedSummary = await translateDeepL(text.summary.ko || '', lang);

              return {
                ...text,
                title: {
                  ...text.title,
                  [lang]: translatedTitle || text.title.ko,
                },
                summary: {
                  ...text.summary,
                  [lang]: translatedSummary || text.summary.ko,
                },
              };
            } catch (error) {
              console.error(`[WorkContext] Failed to translate text ${text.id}:`, error);
              return text;
            }
          } else {
            return text;
          }
        })
      );

      setTexts(translatedTexts);
    } catch (error) {
      console.error('[WorkContext] Translation failed:', error);
    }
  };

  const getWorkById = (id: string) => works.find(w => w.id === id);

  return (
    <WorkContext.Provider 
      value={{ 
        works, 
        texts, 
        isLoading, 
        error, 
        getWorkById,
        translateWorksToLanguage,
        translateWorksByIds,
        translateTextsByIds,
        currentLang,
      }}
    >
      {children}
    </WorkContext.Provider>
  );
};

export const useWorks = () => {
  const context = useContext(WorkContext);
  if (context === undefined) {
    throw new Error('useWorks must be used within a WorkProvider');
  }
  return context;
};
