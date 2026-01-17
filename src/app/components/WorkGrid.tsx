import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Work } from '@/data/works';
import { Footer } from '@/app/components/Footer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './gsap/ScrollSmoother.js';

const ScrollSmoother = (window as any).ScrollSmoother;

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  if (ScrollSmoother) gsap.registerPlugin(ScrollSmoother);
}

// ----------------------------------------------------------------------
// Types & Interfaces
// ----------------------------------------------------------------------

interface WorkGridProps {
  works: Work[];
}

type SortOrder = 'latest' | 'oldest';

// ----------------------------------------------------------------------
// Work Item Component (Architectural & Minimal)
// ----------------------------------------------------------------------

const WorkItem = ({ work }: { work: Work }) => {
  const { lang } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  const getTitle = () => {
    switch (lang) {
      case 'ko': return work.title_ko;
      case 'jp': return work.title_jp;
      default: return work.title_en;
    }
  };

  const getOneLineInfo = () => {
    switch (lang) {
      case 'ko': return work.oneLineInfo_ko;
      case 'jp': return work.oneLineInfo_jp;
      default: return work.oneLineInfo_en;
    }
  };

  return (
    <article
      className="work-item group w-full cursor-pointer relative overflow-hidden bg-zinc-100 dark:bg-zinc-900"
      style={{ aspectRatio: '3 / 4' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a
        href={`#/work/${work.id}`}
        className="block w-full h-full focus:outline-none"
      >
        {/* Image Layer */}
        <img
          src={work.thumbnail}
          alt={getTitle()}
          className={`w-full h-full object-cover object-center transition-transform duration-[800ms] ease-out will-change-transform ${
            isHovered ? 'scale-[1.05]' : 'scale-100'
          }`}
        />
        
        {/* Info Overlay: Architectural Glass Panel */}
        <div 
          className="absolute bottom-0 left-0 w-full bg-zinc-950/90 backdrop-blur-md border-t border-white/10 px-5 py-4 flex flex-col justify-center transition-transform duration-[600ms] cubic-bezier(0.16, 1, 0.3, 1) z-10"
          style={{ 
            transform: isHovered ? 'translateY(0%)' : 'translateY(100%)',
          }}
        >
           <div className="flex flex-col gap-2">
              {/* Title Row */}
              <div 
                className="flex justify-between items-baseline w-full text-zinc-100 transition-all duration-500 delay-75"
                style={{ 
                    opacity: isHovered ? 1 : 0, 
                    transform: isHovered ? 'translateY(0)' : 'translateY(10px)' 
                }}
              >
                  <span className="font-serif text-sm font-medium tracking-wide truncate pr-4">{getTitle()}</span>
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider whitespace-nowrap">{work.year}</span>
              </div>
           </div>
        </div>
      </a>
    </article>
  );
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export const WorkGrid = ({ works }: WorkGridProps) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [isMobile, setIsMobile] = useState(false);
  
  // Refs for GSAP
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const smootherRef = useRef<any>(null);

  // 1. Sort Works
  const sortedWorks = [...works].sort((a, b) => {
    return sortOrder === 'latest' ? a.order - b.order : b.order - a.order;
  });

  // 2. Responsive Check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 3. Column Distribution (Reference Code Logic)
  // Replicating groupItemsByColumn logic
  const columnCount = isMobile ? 2 : 4;
  const columns = Array.from({ length: columnCount }, () => [] as Work[]);
  
  sortedWorks.forEach((work, index) => {
    columns[index % columnCount].push(work);
  });

  // 4. GSAP ScrollSmoother & Parallax Effects
  useLayoutEffect(() => {
    if (!wrapperRef.current || !contentRef.current || !ScrollSmoother) return;

    let tickerCleanup: (() => void) | null = null;

    // Wait a tick to ensure DOM is fully rendered
    const ctx = gsap.context(() => {
      // Create Smoother
      const smoother = ScrollSmoother.create({
        wrapper: wrapperRef.current,
        content: contentRef.current,
        smooth: 1.2, // Smoothness
        effects: true, // Enable Lag Effects
        normalizeScroll: true,
      });
      smootherRef.current = smoother;

      // Apply Lag Effects per Column (Reference Logic)
      if (!isMobile) {
        const cols = columnRefs.current.filter(Boolean);
        
        // 1. Setup gsap.quickTo for performance
        const yToFuncs = cols.map(col => gsap.quickTo(col, "y", { duration: 0.8, ease: "power3.out" }));
        
        // 2. Define Ticker function
        const updateSkew = () => {
          // Safety check
          if (!smoother) return;
          
          const velocity = smoother.getVelocity();
          const normalizedVel = velocity / 500;
          
          yToFuncs.forEach((yTo, i) => {
             // Even columns move opposite to Odd columns
             const isEven = i % 2 === 0;
             const dir = isEven ? 1 : -1;
             
             // Calculate target Y offset (Parallax shift)
             const targetY = normalizedVel * dir * 30; 
             
             // Update the tween target dynamically
             yTo(targetY);
          });
        };

        // 3. Add listener and store cleanup
        gsap.ticker.add(updateSkew);
        tickerCleanup = () => gsap.ticker.remove(updateSkew);
      }

    }, wrapperRef);

    return () => {
      if (tickerCleanup) tickerCleanup();
      ctx.revert();
      smootherRef.current = null;
    };
  }, [columnCount, sortOrder, isMobile]); // Re-run when layout changes // Re-run when layout changes

  return (
    <div ref={wrapperRef} id="smooth-wrapper" className="w-full h-full bg-background text-foreground">
      <div ref={contentRef} id="smooth-content" className="w-full">
        <div className="pt-24 md:pt-32 px-4 md:px-6 pb-32">
          
          {/* Header / Sort */}
          <div className="w-full mb-8 flex justify-end relative z-10 border-b border-border/40 pb-2">
             <div className="flex gap-6 font-mono text-xs uppercase tracking-widest">
                <button 
                  onClick={() => setSortOrder('latest')} 
                  className={`transition-colors hover:text-foreground ${sortOrder === 'latest' ? 'text-foreground font-bold' : 'text-muted-foreground'}`}
                >
                  Latest
                </button>
                <button 
                  onClick={() => setSortOrder('oldest')} 
                  className={`transition-colors hover:text-foreground ${sortOrder === 'oldest' ? 'text-foreground font-bold' : 'text-muted-foreground'}`}
                >
                  Oldest
                </button>
             </div>
          </div>

          {/* 
            Main Grid Layout 
            Structure: Flex Row of Flex Columns
            This mimics the structure built by the reference JS (buildGrid function)
          */}
          <div className="flex gap-4 w-full mx-auto items-start">
            {columns.map((colWorks, i) => (
              <div 
                key={`col-${i}`}
                ref={el => { columnRefs.current[i] = el; }}
                className="flex-1 flex flex-col gap-4 w-full"
              >
                {colWorks.map((work) => (
                  <WorkItem key={work.id} work={work} />
                ))}
              </div>
            ))}
          </div>

        </div>
        <Footer />
      </div>
    </div>
  );
};
