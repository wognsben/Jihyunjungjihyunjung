import { useRef, useLayoutEffect, useMemo, useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { PremiumImage } from '@/app/components/ui/PremiumImage';
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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
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

  const columns = useMemo(() => {
    const numCols = isMobile ? 1 : 4;
    const cols: Work[][] = Array.from({ length: numCols }, () => []);
    
    sortedWorks.forEach((work, index) => {
      const colIndex = index % numCols;
      cols[colIndex].push(work);
    });
    return cols;
  }, [sortedWorks, isMobile]);

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
      <div className="flex flex-col md:flex-row gap-1 w-full items-start justify-center">
        {columns.map((colWorks, colIndex) => (
          <div 
            key={`col-${colIndex}`}
            ref={el => { columnRefs.current[colIndex] = el; }}
            className="flex flex-col gap-1 flex-1 w-full md:w-1/4 will-change-transform"
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
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-zinc-800">
                  
                  {/* Image with Dimming Effect on Hover */}
                  <PremiumImage
                    src={work.thumbnail || work.galleryImages[0]}
                    alt={getTitle(work)}
                    className="w-full h-full object-cover transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] group-hover:brightness-[0.7] group-hover:contrast-[1.1]"
                    containerClassName="w-full h-full"
                  />
                  
                  {/* Overlay Gradient for Bottom Text Readability */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out pointer-events-none" />

                  {/* 1. OPEN WORK Indicator - Center */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none mix-blend-difference">
                    <div className="
                      flex flex-col items-center justify-center gap-4
                      opacity-0 translate-y-4 scale-95 blur-sm
                      group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:blur-0
                      transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                    ">
                      {/* Minimal Square Outline Icon */}
                      <div className="w-12 h-12 border-[1.5px] border-white flex items-center justify-center">
                        <div className="w-0.5 h-3 bg-white" />
                        <div className="absolute w-3 h-0.5 bg-white" />
                      </div>
                      
                      {/* Text */}
                      <span className="text-white font-bold tracking-[0.3em] text-xs uppercase">
                        Open Work
                      </span>
                    </div>
                  </div>

                  {/* 2. Work Info - Bottom Center */}
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