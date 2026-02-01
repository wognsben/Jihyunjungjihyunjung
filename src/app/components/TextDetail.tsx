import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { fetchTextById } from '@/services/wp-api';
import { TextItem } from '@/data/texts';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface TextDetailProps {
  textId: string | null;
  isPage?: boolean;
}

const cleanText = (text: string) => {
  if (!text) return "";
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
};

export const TextDetail = ({ textId, isPage = false }: TextDetailProps) => {
  const { lang } = useLanguage();
  const { texts, works, translateTextsByIds, currentLang } = useWorks();

  const [localText, setLocalText] = useState<TextItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Try to find in context
  const contextText = texts.find(t => t.id === textId);

  // 2. Resolve text data (Context > Local Fetch)
  useEffect(() => {
    if (!textId) return;

    if (contextText) {
      setLocalText(contextText);
      setLoading(false);
      return;
    }

    // Not found in context -> Fetch individually
    const loadSingleText = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetched = await fetchTextById(textId);
        if (fetched) {
          setLocalText(fetched);
        } else {
          setError('Text not found on server');
        }
      } catch (err) {
        setError('Failed to load text');
      } finally {
        setLoading(false);
      }
    };
    
    loadSingleText();
  }, [textId, contextText]);

  const text = localText;

  // Translate this text when language changes
  useEffect(() => {
    if (textId && lang !== 'ko' && lang !== currentLang && contextText) {
      translateTextsByIds([textId], lang);
    }
  }, [textId, lang, currentLang, contextText, translateTextsByIds]);

  // Loading State
  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-pulse text-xs tracking-[0.2em] uppercase opacity-50">
          Loading from Archive...
        </div>
      </div>
    );
  }

  // Error State
  if (!text) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <h1 className="text-lg font-light">Content Unavailable</h1>
        <p className="text-[10px] text-muted-foreground font-mono">ID: {textId}</p>
        {error && <p className="text-[10px] text-red-400/50">{error}</p>}
      </div>
    );
  }

  const title = text.title[lang] || text.title['ko'];
  const content = text.content 
    ? (text.content[lang] || text.content['ko']) 
    : (text.summary ? (text.summary[lang] || text.summary['ko']) : '');

  const paragraphs = content ? content.split('\n\n').filter(p => p.trim()) : [];

  // Compute related works (Reverse Lookup + Explicit)
  const reverseRelatedWorks = works.filter(work => 
    work.relatedArticles?.some(article => article.id === textId)
  ).map(work => {
    const workTitle = lang === 'en' ? work.title_en : (lang === 'jp' ? work.title_jp : work.title_ko);
    const workMedium = lang === 'en' ? work.medium_en : (lang === 'jp' ? work.medium_jp : work.medium_ko);
    return {
      id: work.id,
      title: workTitle || work.title_ko,
      thumbnail: work.thumbnail,
      year: String(work.year),
      medium: workMedium || work.medium_ko
    };
  });

  const allRelatedWorks = text ? [
    ...(text.relatedWorks || []),
    ...reverseRelatedWorks
  ].filter((work, index, self) => 
    index === self.findIndex((w) => w.id === work.id)
  ) : [];

  return (
    <div className="relative w-full h-full bg-background text-foreground overflow-y-auto selection:bg-foreground/10 custom-scrollbar">
      {isPage && (
          <div className="fixed top-24 md:top-32 left-6 md:left-16 z-40 mix-blend-difference text-white dark:text-white">
            <button
              onClick={() => window.location.hash = '#/text'}
              className="group flex items-center gap-3 px-4 py-2 bg-transparent focus:outline-none"
            >
              <ArrowLeft className="w-3 h-3 transition-transform duration-500 ease-out group-hover:-translate-x-1 opacity-70 group-hover:opacity-100" />
              <span className="text-[10px] tracking-[0.25em] uppercase font-light opacity-70 group-hover:opacity-100 transition-opacity duration-300">BACK</span>
            </button>
          </div>
      )}
      <div className={`px-6 md:px-8 max-w-2xl mx-auto ${isPage ? 'pt-32 md:pt-40 pb-32' : 'py-8 md:py-10'}`}>
        
        <article>
          {/* Header */}
          <header className="mb-8 md:mb-12 space-y-6">
            {/* Meta Info */}
            <div className="flex items-center justify-between text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-mono">
              <div className="flex gap-3">
                <span>{text.category}</span>
                <span className="opacity-30">/</span>
                <span>{text.year}</span>
              </div>
            </div>

            {/* Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-2xl md:text-3xl font-serif font-light text-foreground/90 leading-tight"
            >
              {cleanText(title)}
            </motion.h1>

            {/* Featured Image - Compact */}
            {text.image && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className="relative w-full aspect-[2/1] rounded-sm overflow-hidden bg-foreground/5 mt-6"
              >
                <img 
                  src={text.image} 
                  alt={title}
                  className="w-full h-full object-cover grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
                />
              </motion.div>
            )}
            
            <div className="h-px w-full bg-foreground/5 mt-8" />
          </header>

          {/* Content Body */}
          <div className="space-y-6">
            {paragraphs.map((paragraph, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.3 + (index * 0.1), // Staggered delay for reading flow
                  ease: "easeOut" 
                }}
                className="font-serif text-sm md:text-[0.95rem] leading-[1.8] text-foreground/80 text-justify"
              >
                {cleanText(paragraph)}
              </motion.p>
            ))}
          </div>

          {/* Related Works */}
          {allRelatedWorks.length > 0 && (
            <div className="mt-24 pt-12 border-t border-foreground/5">
               <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-mono mb-8">Related Works</h2>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-8">
                 {allRelatedWorks.map(work => (
                    <a 
                      href={`#/work/${work.id}`} 
                      key={work.id} 
                      className="group block"
                    >
                       <div className="aspect-[4/3] bg-foreground/5 mb-3 overflow-hidden rounded-sm">
                          {work.thumbnail ? (
                            <img 
                              src={work.thumbnail} 
                              alt={work.title}
                              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500 ease-out" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-foreground/5 text-muted-foreground/30 text-[8px]">NO IMAGE</div>
                          )}
                       </div>
                       <div className="space-y-1">
                         <div className="text-[11px] tracking-wide font-medium leading-tight group-hover:underline underline-offset-4 decoration-foreground/30">{cleanText(work.title)}</div>
                         <div className="text-[10px] text-muted-foreground/60 font-mono flex gap-2">
                           <span>{work.year}</span>
                           <span className="opacity-30">/</span>
                           <span className="truncate">{work.medium}</span>
                         </div>
                       </div>
                    </a>
                 ))}
               </div>
            </div>
          )}

          {/* Footer Decoration */}
          <div className="mt-16 pt-8 border-t border-foreground/5 flex justify-center opacity-30">
             <div className="w-1 h-1 rounded-full bg-foreground" />
          </div>
        </article>
      </div>
    </div>
  );
};
