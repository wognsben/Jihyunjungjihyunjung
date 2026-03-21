import { useRef, useLayoutEffect, useMemo, useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { PremiumImage } from '@/app/components/ui/PremiumImage';
import { getLocalizedThumbnail } from '@/utils/getLocalizedImage';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const WorkGrid = () => {
  const { lang } = useLanguage();
  const { works } = useWorks();
  const containerRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('all');

  // Filter labels by language
  const filterLabels = {
    ko: {
      all: '전체',
      works: '작업',
      proj: '프로젝트',
      exhib: ' 전시'
    },
    en: {
      all: 'All',
      works: 'Works',
      proj: 'Projects',
      exhib: 'Exhibition'
    },
    jp: {
      all: 'すべて',
      works: '作品',
      proj: 'プロジェクト',
      exhib: '展示'
    }
  };

  useEffect(() => {
    const updateFilterFromUrl = () => {
      const hash = window.location.hash;
      const queryPart = hash.split('?')[1];
      if (queryPart) {
        const params = new URLSearchParams(queryPart);
        const filter = params.get('filter');
        if (filter) {
          setCurrentFilter(filter);
        } else {
          setCurrentFilter('all');
        }
      } else {
        setCurrentFilter('all');
      }
    };

    updateFilterFromUrl();
    window.addEventListener('hashchange', updateFilterFromUrl);
    return () => window.removeEventListener('hashchange', updateFilterFromUrl);
  }, []);

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
    const hashBase = window.location.hash.split('?')[0];
    window.location.hash = `${hashBase}?filter=${filter}`;
  };

  useEffect(() => {
    const checkMobile = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w <= 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sortedWorks = useMemo(() => {
    if (!works || works.length === 0) return [];

    const baseSorted = [...works].sort((a, b) => {
      // Sort by year descending
      const yearDiff = (b.year || 0) - (a.year || 0);
      if (yearDiff !== 0) return yearDiff;
      return b.id.localeCompare(a.id);
    });

    // The de-duplication logic might not be needed for API data, 
    // but let's keep it safe.
    const seenImages = new Set<string>();
    const uniqueWorks: any[] = [];
    const duplicateWorks: any[] = [];

    baseSorted.forEach(work => {
      const imgUrl = work.thumbnail || (work.galleryImages && work.galleryImages[0]);
      if (imgUrl && !seenImages.has(imgUrl)) {
        seenImages.add(imgUrl);
        uniqueWorks.push(work);
      } else {
        duplicateWorks.push(work);
      }
    });

    return [...uniqueWorks, ...duplicateWorks];
  }, [works]);

  const filteredWorks = useMemo(() => {
    if (!sortedWorks.length) return [];
    
    const source = [...sortedWorks];

    const getCat = (work: any): string => {
      const raw = work.category;
      if (!raw) return '';
      if (typeof raw === 'string') return raw.toLowerCase();
      if (Array.isArray(raw)) return raw.join(' ').toLowerCase();
      if (typeof raw === 'object' && raw.label) return String(raw.label).toLowerCase();
      return String(raw).toLowerCase();
    };
    
    switch (currentFilter.toLowerCase()) {
      case 'proj':
        return source.filter(work => getCat(work).includes('project'));
        
      case 'exhib':
        return source.filter(work => getCat(work).includes('exhibition'));
        
      case 'works':
        return source.filter(work => {
          const cat = getCat(work);
          return cat.includes('work') || cat === '';
        });
        
      case 'all':
      default:
        return source;
    }
  }, [sortedWorks, currentFilter]);

  const columns = useMemo(() => {
    const numCols = isMobile ? 1 : isTablet ? 2 : 4;
    const cols: Work[][] = Array.from({ length: numCols }, () => []);
    
    filteredWorks.forEach((work, index) => {
      const colIndex = index % numCols;
      cols[colIndex].push(work);
    });
    return cols;
  }, [filteredWorks, isMobile, isTablet]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    // Clear any stale refs if column count changed
    columnRefs.current = columnRefs.current.slice(0, columns.length);

    const ctx = gsap.context(() => {
      const cols = columnRefs.current.filter(Boolean);
      
      const yToFuncs = cols.map((col, i) => {
        // Create distinct physics for each column
        const dist = Math.abs(i - 1.5);
        
        return gsap.quickTo(col, "y", { 
          duration: 0.8 + (dist * 0.1), 
          ease: "power3.out"
        });
      });

      // Initialize columns
      cols.forEach((col) => {
         gsap.set(col, { marginTop: "0px" });
      });

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top", 
        end: "bottom bottom",
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          const scrollY = self.scroll();
          const topDamping = Math.min(1, scrollY / 200);
          
          // Refined physics
          const dragFactor = -0.06; 
          let targetY = velocity * dragFactor * topDamping;
          
          targetY = Math.max(-100, Math.min(100, targetY));
          
          yToFuncs.forEach((yTo) => {
             yTo(targetY);
          });
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, [columns.length]);

  const getTitle = (work: Work) => lang === 'ko' ? work.title_ko : (lang === 'jp' ? work.title_jp : work.title_en);
  const getMedium = (work: Work) => lang === 'ko' ? work.medium_ko : (lang === 'jp' ? work.medium_jp : work.medium_en);
  
  return (
    <div ref={containerRef} className="w-full min-h-screen bg-background text-foreground pt-32 pb-20 px-4 md:px-6">
      {/* Category Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-12 md:mb-16">
        {[
          { id: 'all', label: filterLabels[lang].all },
          { id: 'works', label: filterLabels[lang].works },
          { id: 'proj', label: filterLabels[lang].proj },
          { id: 'exhib', label: filterLabels[lang].exhib },
        ].map((item, index, array) => (
          <div key={item.id} className="flex items-center gap-3">
            <button
              onClick={() => handleFilterChange(item.id)}
              className={`
                text-xs md:text-sm tracking-widest transition-colors duration-300
                ${currentFilter.toLowerCase() === item.id 
                  ? 'text-black dark:text-white font-bold' 
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}
              `}
            >
              {item.label}
            </button>
            {index < array.length - 1 && (
              <span className="text-gray-400 dark:text-gray-500 text-xs">/</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-1 w-full items-start justify-center">
        {columns.map((colWorks, colIndex) => (
          <div 
            key={`col-${colIndex}`}
            ref={el => { columnRefs.current[colIndex] = el; }}
            className={`flex flex-col gap-1 flex-1 w-full ${isTablet ? 'md:w-1/2' : 'md:w-1/4'} will-change-transform`}
          >
            {colWorks.map((work) => (
              <div 
                key={work.id}
                className="relative group cursor-pointer w-full select-none"
                onClick={() => {
                  window.location.hash = `#/work/${work.id}`;
                }}
              >
                {/* Container: 4/3 aspect ratio */}
                <div 
                  className="relative w-full aspect-[4/3] overflow-hidden"
                  style={{ backgroundColor: 'var(--background)' }}
                >
                  
                  {/* Image with Dimming Effect on Hover */}
                  <PremiumImage
                    src={getLocalizedThumbnail(work, lang) || work.galleryImages[0]}
                    alt={getTitle(work)}
                    className={`w-full h-full transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] group-hover:brightness-[0.7] group-hover:contrast-[1.1] ${
                      isMobile ? 'object-contain' : 'object-cover'
                    }`}
                    containerClassName="w-full h-full"
                  />
                  
                  {/* Overlay Gradient for Bottom Text Readability */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out pointer-events-none" />

                  {/* Work Info - Bottom Center */}
                  <div className="absolute bottom-8 left-0 right-0 flex items-end justify-center pointer-events-none z-30 px-6 text-center">
                     <div 
                       className="
                         flex flex-col items-center gap-2
                         opacity-0 translate-y-8
                         group-hover:opacity-100 group-hover:translate-y-0
                         transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] delay-75
                       "
                     >
                       <h3 className="text-white font-bold text-xl tracking-wider uppercase drop-shadow-md">
                         {getTitle(work)}
                       </h3>
                       <div className="w-8 h-px bg-white/60 my-1" />
                       <p className="text-white/80 font-mono text-xs tracking-widest uppercase drop-shadow-sm">
                         {work.year} — {getMedium(work)}
                       </p>
                     </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};