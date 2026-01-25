import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchWorks, fetchTexts } from '@/services/wp-api';
import { Work } from '@/data/works';
import { TextItem } from '@/data/texts';

interface WorkContextType {
  works: Work[];
  texts: TextItem[];
  isLoading: boolean;
  error: string | null;
  getWorkById: (id: string) => Work | undefined;
}

const WorkContext = createContext<WorkContextType | undefined>(undefined);

export const WorkProvider = ({ children }: { children: ReactNode }) => {
  const { lang } = useLanguage();
  const [works, setWorks] = useState<Work[]>([]);
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedWorks, fetchedTexts] = await Promise.all([
          fetchWorks(lang),
          fetchTexts(lang)
        ]);
        
        if (isMounted) {
          // If API returns empty (e.g. connection error or no posts), 
          // consider falling back to mock data or just showing empty.
          // For production, we usually want to show empty or error.
          // But to be safe during dev if API fails:
          if (fetchedWorks.length === 0 && fetchedTexts.length === 0) {
             console.warn('WordPress API returned no data. Using mock data as fallback? No, serving empty.');
             // Uncomment to fallback: setWorks(mockWorks);
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
          // Fallback to mock data on error?
          // setWorks(mockWorks); 
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
  }, [lang]);

  const getWorkById = (id: string) => works.find(w => w.id === id);

  return (
    <WorkContext.Provider value={{ works, texts, isLoading, error, getWorkById }}>
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
