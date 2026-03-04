import { useEffect, useRef, useState } from 'react';
import { Work } from '@/contexts/WorkContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { TooltipTransition } from '@/app/components/TooltipTransition';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InfiniteWorkGridProps {
  works: Work[];
  onWorkClick?: (workId: number) => void;
}

export const InfiniteWorkGrid = ({ works, onWorkClick }: InfiniteWorkGridProps) => {
  const { lang } = useLanguage();
  
  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const continuousScrollRef = useRef<NodeJS.Timeout | null>(null);
  
  // State
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null);
  const [lastHoveredWorkId, setLastHoveredWorkId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Detect desktop (1024px+) and mobile (<768px)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setIsMobile(false); // Always use grid layout
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Update scroll state
  const updateScrollState = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    
    // Progress (0 to 1)
    const maxScroll = scrollWidth - clientWidth;
    const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    setScrollProgress(progress);
    
    // Can scroll left/right
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);

    // Calculate active index for minimap (based on visible center)
    const itemWidth = 350 + 48; // thumbnail width + gap
    const centerScroll = scrollLeft + clientWidth / 2;
    const index = Math.floor(centerScroll / itemWidth);
    setActiveIndex(Math.min(index, works.length - 1));
  };

  // Scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    container.addEventListener('scroll', updateScrollState);
    updateScrollState(); // Initial state
    
    return () => container.removeEventListener('scroll', updateScrollState);
  }, [works]);

  // Mouse Wheel Horizontal Scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Continuous scroll on hold
  const startContinuousScroll = (direction: 'left' | 'right') => {
    stopContinuousScroll();
    
    const scroll = () => {
      if (!scrollContainerRef.current) return;
      const speed = 10;
      scrollContainerRef.current.scrollLeft += direction === 'left' ? -speed : speed;
    };
    
    continuousScrollRef.current = setInterval(scroll, 16);
  };

  const stopContinuousScroll = () => {
    if (continuousScrollRef.current) {
      clearInterval(continuousScrollRef.current);
      continuousScrollRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopContinuousScroll();
  }, []);

  // Jump to specific work
  const scrollToWork = (index: number) => {
    if (!scrollContainerRef.current) return;
    const itemWidth = 350 + 48;
    scrollContainerRef.current.scrollTo({
      left: index * itemWidth,
      behavior: 'smooth'
    });
  };

  // Drag to scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  if (works.length === 0) return null;

  // Mobile Slider Functions
  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % works.length);
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + works.length) % works.length);
  };

  // Mobile: Render Slider
  if (isMobile) {
    return (
      <div className="relative w-full bg-background py-24">
        {/* Header */}
        <div className="px-6 mb-8 flex items-end justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <h2 className="text-[12px] lowercase tracking-[0.2em] text-muted-foreground/70 font-mono">
              other works
            </h2>
            <span className="text-[10px] font-mono text-muted-foreground/40">
              {works.length} {works.length === 1 ? 'work' : 'works'}
            </span>
          </div>
        </div>

        {/* Slider */}
        <div className="relative w-full px-6">
          <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted/10">
            {/* Click Areas for Navigation */}
            <div 
              className="absolute left-0 top-0 w-1/2 h-full z-20 cursor-pointer active:bg-black/5"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevSlide();
              }}
            />
            <div 
              className="absolute right-0 top-0 w-1/2 h-full z-20 cursor-pointer active:bg-black/5"
              onClick={(e) => {
                e.stopPropagation();
                goToNextSlide();
              }}
            />
            
            {/* Current Image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 cursor-pointer"
                onClick={() => onWorkClick?.(Number(works[currentSlide].id))}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = offset.x;
                  const swipeVelocity = velocity.x;
                  
                  if (Math.abs(swipe) > 50 || Math.abs(swipeVelocity) > 500) {
                    if (swipe > 0) {
                      goToPrevSlide();
                    } else {
                      goToNextSlide();
                    }
                  }
                }}
              >
                <ImageWithFallback
                  src={works[currentSlide].thumbnail || works[currentSlide].galleryImages?.[0] || ''}
                  alt={works[currentSlide].title_en}
                  className="w-full h-full object-cover pointer-events-none"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Counter */}
          <div className="mt-6 flex justify-center">
            <span className="text-[12px] font-mono text-muted-foreground/60 tracking-wider tabular-nums">
              {String(currentSlide + 1).padStart(2, '0')} / {String(works.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Desktop/Tablet: Render Horizontal Scroll Grid
  return (
    <div className="relative w-full bg-background py-24 md:py-32">
      {/* Header: Title + Count + Progress */}
      <div className="px-6 md:px-12 mb-8 md:mb-12 flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <h2 className="text-[12px] lowercase tracking-[0.2em] text-muted-foreground/70 font-mono">
            other works
          </h2>
          <span className="text-[10px] font-mono text-muted-foreground/40">
            {works.length} {works.length === 1 ? 'work' : 'works'}
          </span>
        </div>
        
        {/* Progress Indicator */}
        <div className="hidden md:flex items-center gap-3">
          <div className="w-24 h-[1px] bg-muted-foreground/20 relative overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-foreground/60 transition-all duration-300 ease-out"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground/40 tabular-nums">
            {Math.round(scrollProgress * 100)}%
          </span>
        </div>
      </div>

      {/* Scroll Container Wrapper with Fade Gradients */}
      <div className="relative">
        {/* Left Fade Gradient */}
        <div 
          className={`hidden md:block absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background/60 via-background/30 to-transparent z-10 pointer-events-none transition-opacity duration-500 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Right Fade Gradient */}
        <div 
          className={`hidden md:block absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background/60 via-background/30 to-transparent z-10 pointer-events-none transition-opacity duration-500 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Left Navigation Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!scrollContainerRef.current || !canScrollLeft) return;
            scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
          }}
          disabled={!canScrollLeft}
          className={`hidden md:flex absolute left-6 z-20 w-10 h-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-foreground/10 transition-all duration-300 hover:bg-background hover:scale-110 disabled:opacity-0 disabled:pointer-events-none ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}
          style={{ top: 'calc(50% - 20px)' }}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-foreground/70" />
        </button>

        {/* Right Navigation Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!scrollContainerRef.current || !canScrollRight) return;
            scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
          }}
          disabled={!canScrollRight}
          className={`hidden md:flex absolute right-6 z-20 w-10 h-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-foreground/10 transition-all duration-300 hover:bg-background hover:scale-110 disabled:opacity-0 disabled:pointer-events-none ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}
          style={{ top: 'calc(50% - 20px)' }}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-foreground/70" />
        </button>

        {/* Horizontal Scroll Container */}
        <div 
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`overflow-x-auto overflow-y-hidden scrollbar-hide px-6 md:px-12 snap-x snap-mandatory ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div className="flex gap-8 md:gap-12 pb-4">
            {works.map((work) => (
              <div
                key={work.id}
                onClick={() => onWorkClick?.(Number(work.id))}
                onMouseEnter={() => {
                  setHoveredWorkId(work.id);
                  setLastHoveredWorkId(work.id); // Remember last hovered
                }}
                onMouseLeave={() => setHoveredWorkId(null)}
                className="group flex-shrink-0 cursor-pointer snap-start"
              >
                {/* Thumbnail */}
                <div className="w-[280px] md:w-[350px] aspect-[4/3] overflow-hidden bg-muted/10 mb-4 relative">
                  <ImageWithFallback
                    src={work.thumbnail || work.galleryImages?.[0] || ''}
                    alt={work.title_en}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                </div>

                {/* Caption */}
                <div className="w-[280px] md:w-[350px]">
                  <h3 className="text-sm md:text-base font-serif font-light text-foreground/90 leading-tight mb-1 group-hover:text-foreground transition-colors duration-300">
                    {work.title_en}
                  </h3>
                  <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.1em]">
                    &lt;{work.year}&gt;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Minimap Navigation */}
      <div className="hidden md:flex justify-center items-center gap-2 mt-12 px-6">
        {works.map((work, index) => (
          <button
            key={work.id}
            onClick={() => scrollToWork(index)}
            onMouseEnter={() => setHoveredWorkId(work.id)}
            onMouseLeave={() => setHoveredWorkId(null)}
            className={`group relative transition-all duration-300 ${
              index === activeIndex 
                ? 'w-8 h-1.5' 
                : 'w-1.5 h-1.5'
            }`}
            aria-label={`Go to ${work.title_en}`}
          >
            {/* Dot */}
            <div className={`w-full h-full rounded-full transition-all duration-300 ${
              index === activeIndex 
                ? 'bg-foreground/80' 
                : 'bg-muted-foreground/20 group-hover:bg-muted-foreground/50'
            }`} />
            
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
              <div className="bg-foreground/90 text-background px-2 py-1 rounded text-[9px] font-mono">
                {work.title_en.slice(0, 20)}{work.title_en.length > 20 ? '...' : ''}
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground/90" />
            </div>
          </button>
        ))}
      </div>

      {/* Tooltip - Desktop Only (1024px+) */}
      {isDesktop && (
        <TooltipTransition 
          hoveredWorkId={hoveredWorkId || lastHoveredWorkId}
          isOpen={false} 
          onClose={() => {
            setHoveredWorkId(null);
            setLastHoveredWorkId(null);
          }}
          onClick={() => {
            const workIdToUse = hoveredWorkId || lastHoveredWorkId;
            if (workIdToUse) {
              onWorkClick?.(Number(workIdToUse));
              setHoveredWorkId(null);
            }
          }}
          isMobile={false}
          onMouseEnter={() => {
            // 툴팁에 마우스 진입 시 hoveredWorkId 유지
            if (lastHoveredWorkId) {
              setHoveredWorkId(lastHoveredWorkId);
            }
          }}
          onMouseLeave={() => {
            setHoveredWorkId(null);
            setLastHoveredWorkId(null);
          }}
        />
      )}

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};