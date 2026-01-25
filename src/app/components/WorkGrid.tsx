import { useRef, useLayoutEffect, useMemo } from 'react';
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
  
  const sortedWorks = useMemo(() => {
    // Determine unique works based on image URL to avoid duplicates in grid if desired,
    // or just use the API works directly.
    // The previous logic handled duplicates because of specific mock data structure.
    // With API, we might assume uniqueness or duplicates are intentional.
    // Let's stick to the previous sorting logic but apply it to 'works'.
    
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
    const cols: Work[][] = [[], [], [], []];
    sortedWorks.forEach((work, index) => {
      const colIndex = index % 4;
      cols[colIndex].push(work);
    });
    return cols;
  }, [sortedWorks]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

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
  }, []);

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
                {/* 
                   Premium Aspect Ratio & Interaction
                   - Container: 4/3
                */}
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-zinc-800">
                  <PremiumImage
                    src={work.thumbnail || work.galleryImages[0]}
                    alt={getTitle(work)}
                    className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                    containerClassName="w-full h-full"
                  />
                  
                  {/* 1. Archive Stamp (Year) - Top Right Corner */}
                  <div className="absolute top-4 right-4 z-20 pointer-events-none overflow-hidden">
                    <div 
                      className="
                        px-2.5 py-1 
                        bg-black/20 backdrop-blur-sm border border-white/10 rounded-md
                        text-white/90 font-mono text-[10px] tracking-widest
                        translate-y-[-150%] opacity-0
                        group-hover:translate-y-0 group-hover:opacity-100
                        transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] delay-75
                      "
                    >
                      {work.year}
                    </div>
                  </div>

                  {/* 2. Architect's Label (Title & Medium) - Center */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                     <div 
                       className="
                         flex items-center gap-3 px-5 py-2.5 
                         bg-black/30 backdrop-blur-md border border-white/20 rounded-full 
                         opacity-0 translate-y-4 scale-95
                         group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100
                         transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                         shadow-2xl shadow-black/20
                       "
                     >
                       <span className="text-white font-bold text-sm tracking-widest uppercase text-shadow-sm">
                         {getTitle(work)}
                       </span>
                       <span className="w-px h-3 bg-white/40" aria-hidden="true" />
                       <span className="text-white/80 font-mono text-xs tracking-wider uppercase">
                         {getMedium(work)}
                       </span>
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
