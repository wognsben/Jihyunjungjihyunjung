import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const [works, setWorks] = useState<Work[]>([]);
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data only once on mount (Korean data only)
  // Translation will be handled at component level using DeepL
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch Korean data only (no longer depends on lang)
        const [fetchedWorks, fetchedTexts] = await Promise.all([
          fetchWorks('ko'),
          fetchTexts('ko')
        ]);
        
        if (isMounted) {
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
  }, []); // Removed lang dependency - fetch only once

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