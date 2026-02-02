import { useEffect, useRef, useMemo, useState } from 'react';
import { Work } from '@/contexts/WorkContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { TooltipTransition } from '@/app/components/TooltipTransition';

// --- Utility: Line Break Logic ---
const lineBreak = (text: string, max: number, container: HTMLElement) => {
  const document = container.ownerDocument;
  
  const getTotalWidth = (el: HTMLElement) =>
    Array.from(el.children).reduce((acc, child) => acc + (child as HTMLElement).getBoundingClientRect().width, 0);

  const createNewLine = () => {
    const span = document.createElement('span');
    span.classList.add('grid-text-line');
    span.style.display = 'block';
    span.style.willChange = 'transform';
    return span;
  };

  const words = text.split(/\s/).map((w, i) => {
    const span = document.createElement('span');
    span.classList.add('word');
    span.style.display = 'inline-block';
    span.innerHTML = (i > 0 ? ' ' : '') + w;
    return span;
  });

  container.innerHTML = '';
  
  words.forEach((word, i) => {
    if (i > 0 && word.innerHTML.startsWith(' ')) {
      word.style.paddingLeft = '0.2em';
    }
  });

  if (getTotalWidth(container) > max) {
    container.innerHTML = '';
    let currentLine = createNewLine();
    container.appendChild(currentLine);

    words.forEach(word => {
      currentLine.appendChild(word);
      if (getTotalWidth(currentLine) > max && currentLine.children.length > 1) {
        currentLine.removeChild(word);
        currentLine = createNewLine();
        currentLine.appendChild(word);
        container.appendChild(currentLine);
      }
    });
  } else {
    const line = createNewLine();
    words.forEach(word => line.appendChild(word));
    container.appendChild(line);
  }
};

// --- Physics & Animation Types ---
class ColumnAnimation {
  el: HTMLElement;
  reverse: boolean;
  scroll: { current: number; target: number; last: number; ease: number };
  speed: { t: number; c: number };
  defaultSpeed: number;
  height: number = 0;
  items: any[] = [];
  winH: number = 0;
  paused: boolean = false;
  
  constructor(el: HTMLElement, reverse: boolean) {
    this.el = el;
    this.reverse = reverse;
    this.scroll = { ease: 0.05, current: 0, target: 0, last: 0 };
    this.speed = { t: 0.4, c: 0.4 }; 
    this.defaultSpeed = 0.4; 
    
    this.resize();

    // Initial offset for Right Column (Reverse)
    if (this.reverse && this.height > 0) {
        const startOffset = -this.height / 2;
        this.scroll.current = startOffset;
        this.scroll.target = startOffset;
    }
  }

  resize() {
    this.winH = window.innerHeight;
    const content = this.el.querySelector('.column-content') as HTMLElement;
    if (!content) return;

    this.items = Array.from(content.children).map((item: any) => {
        return {
            el: item as HTMLElement,
            height: item.clientHeight,
            top: item.offsetTop,
            y: 0,
            extra: 0
        };
    });
    
    this.height = content.scrollHeight;
  }

  update(autoScroll: boolean = true) {
    if (this.paused) {
        this.speed.t = 0;
    } else if (autoScroll) {
        this.speed.t = this.defaultSpeed;
    }
    
    this.speed.c += (this.speed.t - this.speed.c) * 0.03;
    
    this.scroll.target += this.speed.c;
    this.scroll.current += (this.scroll.target - this.scroll.current) * this.scroll.ease;

    this.items.forEach(item => {
        if (!this.reverse) {
            // LEFT COLUMN: Moves UP
            item.y = -this.scroll.current + item.extra;
            
            const visualTop = item.y + item.top;
            if (visualTop + item.height < -100) { 
                item.extra += this.height;
            }
        } else {
             // RIGHT COLUMN: Moves DOWN
             item.y = this.scroll.current + item.extra;
             
             const visualTop = item.y + item.top;
             if (visualTop > this.winH + 100) {
                 item.extra -= this.height;
             }
        }
        
        item.el.style.transform = `translateY(${item.y}px)`;
    });

    this.scroll.last = this.scroll.current;
  }
}

interface InfiniteWorkGridProps {
  works: Work[];
  onWorkClick?: (workId: number) => void;
}

export const InfiniteWorkGrid = ({ works, onWorkClick }: InfiniteWorkGridProps) => {
  const { lang } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  
  const animationsRef = useRef<ColumnAnimation[]>([]);
  const requestRef = useRef<number>();

  const [hoveredWork, setHoveredWork] = useState<Work | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile Tooltip State
  const [tooltipWorkId, setTooltipWorkId] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const repeatedWorks = useMemo(() => {
      if (works.length === 0) return [];
      let list = [...works];
      while (list.length < 30) {
          list = [...list, ...works];
      }
      return list;
  }, [works]);

  const leftWorks = repeatedWorks.filter((_, i) => i % 2 === 0);
  const rightWorks = repeatedWorks.filter((_, i) => i % 2 !== 0);

  // Hover Handlers
  const handleMouseEnter = (work: Work) => {
      setHoveredWork(work);
      animationsRef.current.forEach(anim => anim.paused = true);
  };

  const handleMouseLeave = () => {
      setHoveredWork(null);
      animationsRef.current.forEach(anim => anim.paused = false);
  };

  useEffect(() => {
    const setupText = (container: HTMLElement | null) => {
        if (!container) return;
        const paragraphs = container.querySelectorAll('p.smart-text-source');
        paragraphs.forEach(p => {
             lineBreak(p.textContent || '', p.parentElement?.clientWidth || 300, p as HTMLElement);
             p.classList.remove('opacity-0');
        });
    };

    const timer = setTimeout(() => {
        if (isMobile) {
             setupText(mobileRef.current);
             if (mobileRef.current) {
                 animationsRef.current = [new ColumnAnimation(mobileRef.current, false)];
             }
        } else {
             setupText(leftRef.current);
             setupText(rightRef.current);
             
             if (leftRef.current && rightRef.current) {
                 animationsRef.current = [
                     new ColumnAnimation(leftRef.current, false), 
                     new ColumnAnimation(rightRef.current, true)
                 ];
             }
        }
    }, 200);

    return () => clearTimeout(timer);
  }, [works, lang, repeatedWorks, isMobile]);

  useEffect(() => {
    const loop = () => {
        animationsRef.current.forEach(anim => anim.update(true));
        requestRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  if (works.length === 0) return null;

  return (
    <div ref={containerRef} className="relative w-full h-[120vh] bg-white text-black overflow-hidden selection:bg-black/10">
       <style>{`
         .grid-text-line { display: block; white-space: nowrap; will-change: transform; overflow: hidden; line-height: 1.2; }
         .word { display: inline-block; }
         .smart-text-source { transition: opacity 0.5s ease-out; } 
       `}</style>

       {/* Center Content: JIHYUNJUNG */}
       {/* Moved UP by changing justify-center to justify-start and adding padding-top */}
       {/* Hidden on mobile (< 768px), visible on desktop/tablet */}
       <div className="hidden md:flex absolute inset-0 z-10 flex-col items-center justify-start pt-[35vh] pointer-events-none">
          {/* Main Title */}
          <h1 className="text-[3vw] md:text-[2.5vw] font-serif font-light tracking-[0.2em] leading-none text-black z-20 transition-all duration-700">
            JIHYUN JUNG
          </h1>
          
          {/* Hover Image Layer - Positioned Spatially BELOW the text in Flex Flow */}
          {/* Static positioning (margin-top) ensures stable layout and correct layering "below" text */}
          <div className={`mt-10 w-[30vw] h-[40vh] md:w-[20vw] md:h-[35vh] z-10 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${hoveredWork ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {hoveredWork && (
                <div className="w-full h-full bg-gray-50 overflow-hidden shadow-2xl">
                     {/* FIX: Use correct property 'thumbnail' or 'galleryImages[0]' instead of 'image_url' */}
                     <ImageWithFallback 
                        src={hoveredWork.thumbnail || hoveredWork.galleryImages?.[0] || ''} 
                        alt={hoveredWork.title_en}
                        className="object-cover w-full h-full opacity-90 hover:opacity-100 transition-opacity duration-700"
                    />
                </div>
            )}
          </div>
       </div>

       {/* Grid Container */}
       <div className="absolute inset-0 flex justify-center md:justify-between px-4 md:px-16 z-20 pointer-events-none mix-blend-multiply">
          
          {/* Mobile Single Column */}
          {isMobile && (
            <div ref={mobileRef} className="column h-full w-full relative overflow-visible pointer-events-auto">
               <div className="column-content w-full absolute top-0 left-0 will-change-transform flex flex-col items-center">
                  {repeatedWorks.map((work, i) => (
                      <div 
                          key={`mobile-${i}`} 
                          className="mb-32 cursor-pointer group text-center" 
                          onClick={() => setTooltipWorkId(work.id)}
                      >
                          <p className="smart-text-source opacity-0 text-sm font-serif text-black transition-colors duration-700 leading-relaxed">
                             {work.title_en}
                             <span className="block text-[10px] font-mono text-black transition-colors duration-700 mt-1 opacity-60">
                               &lt;{work.year}&gt;
                             </span>
                          </p>
                      </div>
                  ))}
               </div>
            </div>
          )}

          {/* Desktop Left Column */}
          {!isMobile && (
          <div ref={leftRef} className="column h-full w-[25%] relative overflow-visible pointer-events-auto">
             <div className="column-content w-full absolute top-0 left-0 will-change-transform">
                {leftWorks.map((work, i) => (
                    <div 
                        key={`left-${i}`} 
                        className="mb-40 cursor-pointer group" 
                        onClick={() => onWorkClick?.(Number(work.id))}
                        onMouseEnter={() => handleMouseEnter(work)}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Title <Year> Format */}
                        <p className="smart-text-source opacity-0 text-base font-serif text-black transition-colors duration-700 leading-relaxed">
                           {work.title_en}
                           <span className="inline-block ml-2 text-[10px] font-mono text-black transition-colors duration-700 align-middle">
                             &lt;{work.year}&gt;
                           </span>
                        </p>
                    </div>
                ))}
             </div>
          </div>
          )}

          {/* Desktop Right Column */}
          {!isMobile && (
          <div ref={rightRef} className="column h-full w-[25%] relative overflow-visible text-right pointer-events-auto">
             <div className="column-content w-full absolute top-0 right-0 will-change-transform flex flex-col items-end">
                {rightWorks.map((work, i) => (
                    <div 
                        key={`right-${i}`} 
                        className="mb-40 cursor-pointer group w-full text-right" 
                        onClick={() => onWorkClick?.(Number(work.id))}
                        onMouseEnter={() => handleMouseEnter(work)}
                        onMouseLeave={handleMouseLeave}
                    >
                         {/* Title <Year> Format */}
                         <p className="smart-text-source opacity-0 text-base font-serif text-black transition-colors duration-700 leading-relaxed ml-auto">
                           {work.title_en}
                           <span className="inline-block ml-2 text-[10px] font-mono text-black transition-colors duration-700 align-middle">
                             &lt;{work.year}&gt;
                           </span>
                        </p>
                    </div>
                ))}
             </div>
          </div>
          )}
       </div>

       {/* Mobile Tooltip - Moved to the end to ensure it sits on top of everything in DOM order */}
       {isMobile && (
         <TooltipTransition 
           hoveredWorkId={tooltipWorkId} 
           isOpen={false} 
           onClose={() => setTooltipWorkId(null)}
           onClick={() => {
             if (tooltipWorkId) {
               onWorkClick?.(Number(tooltipWorkId));
               setTooltipWorkId(null);
             }
           }}
           isMobile={true}
         />
       )}
    </div>
  );
};