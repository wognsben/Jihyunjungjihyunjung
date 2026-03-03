import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { fetchWorks, fetchTexts } from '@/services/wp-api';
import { Work } from '@/data/works';
import { TextItem } from '@/data/texts';

type Language = 'ko' | 'en' | 'jp';

interface WorkContextType {
  works: Work[];
  texts: TextItem[];
  isLoading: boolean;
  error: string | null;
  getWorkById: (id: string) => Work | undefined;
  // Keep these for backward compatibility, but they now do nothing
  // since all multilingual data comes directly from WordPress ACF fields
  translateWorksByIds: (ids: string[], lang: Language) => Promise<void>;
  translateTextsByIds: (ids: string[], lang: Language) => Promise<void>;
  currentLang: Language;
}

const WorkContext = createContext<WorkContextType | undefined>(undefined);

// Default fallback values to prevent crashes during HMR/hot reload
const defaultContextValue: WorkContextType = {
  works: [],
  texts: [],
  isLoading: true,
  error: null,
  getWorkById: () => undefined,
  translateWorksByIds: async () => {},
  translateTextsByIds: async () => {},
  currentLang: 'ko',
};

export const WorkProvider = ({ children }: { children: ReactNode }) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<Language>('ko');

  // Fetch data only once - all multilingual data is already in ACF fields
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      console.log('[WorkProvider] Fetching WordPress data (all languages from ACF fields)...');
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

  // No-op: All multilingual data is already fetched from ACF fields
  // These functions are kept for backward compatibility with existing components
  const translateWorksByIds = useCallback(async (_ids: string[], lang: Language) => {
    setCurrentLang(lang);
    // No translation needed - data already contains _ko, _en, _jp from ACF
  }, []);

  const translateTextsByIds = useCallback(async (_ids: string[], lang: Language) => {
    setCurrentLang(lang);
    // No translation needed - data already contains ko, en, jp from ACF
  }, []);

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
    console.warn('[useWorks] Context is undefined — returning default fallback. This may happen during HMR.');
    return defaultContextValue;
  }
  return context;
};