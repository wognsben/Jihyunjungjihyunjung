import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { fetchWorks, fetchTexts } from '@/services/wp-api';
import { Work } from '@/data/works';
import { TextItem } from '@/data/texts';
import { translate } from '@/services/translation';

type Language = 'ko' | 'en' | 'jp';

interface WorkContextType {
  works: Work[];
  texts: TextItem[];
  isLoading: boolean;
  error: string | null;
  getWorkById: (id: string) => Work | undefined;
  translateWorksByIds: (ids: string[], lang: Language) => Promise<void>;
  translateTextsByIds: (ids: string[], lang: Language) => Promise<void>;
  currentLang: Language;
}

const WorkContext = createContext<WorkContextType | undefined>(undefined);

export const WorkProvider = ({ children }: { children: ReactNode }) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<Language>('ko'); // Track current translation language

  // Fetch data only once (Korean originals from WordPress)
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      console.log('[WorkProvider] Fetching WordPress data (Korean originals)...');
      setIsLoading(true);
      try {
        const [fetchedWorks, fetchedTexts] = await Promise.all([
          fetchWorks('ko'),
          fetchTexts('ko')
        ]);
        
        if (isMounted) {
          setWorks(fetchedWorks);
          setTexts(fetchedTexts);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load data', err);
          setError('Failed to load data');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => { isMounted = false; };
  }, []);

  const getWorkById = (id: string) => works.find(w => w.id === id);

  // Translate works by IDs
  const translateWorksByIds = useCallback(async (ids: string[], lang: Language) => {
    // Korean is the original - no translation needed
    if (lang === 'ko') {
      setCurrentLang('ko');
      return;
    }

    console.log(`[WorkProvider] Translating works ${ids.join(', ')} to ${lang}...`);
    
    const updatedWorks = await Promise.all(
      works.map(async (work) => {
        if (!ids.includes(work.id)) return work;

        // Translate title
        const translatedTitle = await translate(work.title_ko, lang);
        
        // Translate description if it exists
        let translatedDescription = work.description_ko;
        if (work.description_ko) {
          translatedDescription = await translate(work.description_ko, lang);
        }

        // Translate yearCaption if it exists
        let translatedYearCaption = work.yearCaption_ko;
        if (work.yearCaption_ko) {
          translatedYearCaption = await translate(work.yearCaption_ko, lang);
        }

        // Translate oneLineInfo if it exists
        let translatedOneLineInfo = work.oneLineInfo_ko;
        if (work.oneLineInfo_ko) {
          translatedOneLineInfo = await translate(work.oneLineInfo_ko, lang);
        }

        // Update the appropriate language fields
        if (lang === 'en') {
          return {
            ...work,
            title_en: translatedTitle,
            description_en: translatedDescription,
            yearCaption_en: translatedYearCaption,
            oneLineInfo_en: translatedOneLineInfo,
          };
        } else if (lang === 'jp') {
          return {
            ...work,
            title_jp: translatedTitle,
            description_jp: translatedDescription,
            yearCaption_jp: translatedYearCaption,
            oneLineInfo_jp: translatedOneLineInfo,
          };
        }

        return work;
      })
    );

    setWorks(updatedWorks);
    setCurrentLang(lang);
  }, [works]);

  // Translate texts by IDs
  const translateTextsByIds = useCallback(async (ids: string[], lang: Language) => {
    // Korean is the original - no translation needed
    if (lang === 'ko') {
      setCurrentLang('ko');
      return;
    }

    console.log(`[WorkProvider] Translating texts ${ids.join(', ')} to ${lang}...`);
    
    const updatedTexts = await Promise.all(
      texts.map(async (text) => {
        if (!ids.includes(text.id)) return text;

        // Translate title
        const translatedTitle = await translate(text.title.ko, lang);
        
        // Translate summary if it exists
        let translatedSummary = text.summary?.ko || '';
        if (text.summary?.ko) {
          translatedSummary = await translate(text.summary.ko, lang);
        }

        // Translate content if it exists
        let translatedContent = text.content?.ko || '';
        if (text.content?.ko) {
          translatedContent = await translate(text.content.ko, lang);
        }

        // Update the appropriate language fields
        if (lang === 'en') {
          return {
            ...text,
            title: { ...text.title, en: translatedTitle },
            summary: text.summary ? { ...text.summary, en: translatedSummary } : undefined,
            content: text.content ? { ...text.content, en: translatedContent } : undefined,
          };
        } else if (lang === 'jp') {
          return {
            ...text,
            title: { ...text.title, jp: translatedTitle },
            summary: text.summary ? { ...text.summary, jp: translatedSummary } : undefined,
            content: text.content ? { ...text.content, jp: translatedContent } : undefined,
          };
        }

        return text;
      })
    );

    setTexts(updatedTexts);
    setCurrentLang(lang);
  }, [texts]);

  return (
    <WorkContext.Provider value={{ 
      works, 
      texts, 
      isLoading, 
      error, 
      getWorkById,
      translateWorksByIds,
      translateTextsByIds,
      currentLang
    }}>
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