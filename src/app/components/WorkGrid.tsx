import { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { worksData, Work } from '@/data/works';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { WorkDetail } from './WorkDetail';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const WorkGrid = () => {
  const { lang } = useLanguage();
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const sortedWorks = useMemo(() => {
    const baseSorted = [...worksData].sort((a, b) => {
      const yearDiff = Number(b.year) - Number(a.year);
      if (yearDiff !== 0) return yearDiff;
      return b.id.localeCompare(a.id);
    });

    const seenImages = new Set<string>();
    const uniqueWorks: Work[] = [];
    const duplicateWorks: Work[] = [];

    baseSorted.forEach(work => {
      const imgUrl = work.thumbnail || work.galleryImages[0];
      if (!seenImages.has(imgUrl)) {
        seenImages.add(imgUrl);
        uniqueWorks.push(work);
      } else {
        duplicateWorks.push(work);
      }
    });

    return [...uniqueWorks, ...duplicateWorks];
  }, []);

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
        const dist = Math.abs(i - 1.5);
        return gsap.quickTo(col, "y", { 
          duration: 0.6 + (dist * 0.1), 
          ease: "power2.out" 
        });
      });

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top", 
        end: "bottom bottom",
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          const scrollY = self.scroll();
          const topDamping = Math.min(1, scrollY / 200);
          const dragFactor = -0.05; 
          let targetY = velocity * dragFactor * topDamping;
          targetY = Math.max(-100, Math.min(100, targetY));
          yToFuncs.forEach((yTo) => yTo(targetY));
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const getTitle = (work: Work) => lang === 'ko' ? work.title_ko : (lang === 'jp' ? work.title_jp : work.title_en);

  if (selectedWorkId) {
    return <WorkDetail workId={selectedWorkId} />;
  }

  return (
    <div ref={containerRef} className="w-full min-h-screen bg-background text-foreground pt-40 pb-20 px-[5vw]">
      <div className="flex flex-col md:flex-row gap-[5vw] w-full items-start justify-center">
        {columns.map((colWorks, colIndex) => (
          <div 
            key={`col-${colIndex}`}
            ref={el => { columnRefs.current[colIndex] = el; }}
            className="flex flex-col gap-[5vw] flex-1 w-full md:w-1/4 will-change-transform"
          >
            {colWorks.map((work) => (
              <div 
                key={work.id}
                className="relative group cursor-pointer w-full select-none"
                onClick={() => {
                  window.location.hash = `#/work/${work.id}`;
                  setSelectedWorkId(work.id);
                }}
              >
                {/* 
                   Premium Aspect Ratio & Interaction
                   - Container: 4/3
                   - Scale Duration: 1200ms (Slow, Heavy feel)
                */}
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-zinc-800">
                  <ImageWithFallback
                    src={work.thumbnail || work.galleryImages[0]}
                    alt={getTitle(work)}
                    className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                  />
                  
                  {/* 
                      Cinematic Gradient Layer
                      - Taller gradient (h-2/3) for smoother fade
                      - Pure black at bottom for absolute text clarity
                  */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out" />

                  {/* 
                      Premium Typography Layout
                      - Aligned to bottom
                      - Title: Tracking-tight for modern look
                      - Year: Mono font, slight transparency for hierarchy
                  */}
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-7 flex flex-row items-end justify-between 
                                translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 
                                transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] z-10">
                    
                    {/* Title: High Contrast, Tight Spacing */}
                    <h3 className="text-[15px] md:text-base lg:text-lg font-medium text-white tracking-tight leading-none truncate max-w-[80%] antialiased drop-shadow-sm">
                      {getTitle(work)}
                    </h3>

                    {/* Year: Subtle, Technical feel */}
                    <span className="text-[11px] md:text-xs font-light text-white/70 tracking-widest font-mono antialiased">
                      {work.year}
                    </span>
                    
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