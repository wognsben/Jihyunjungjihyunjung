import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Work } from '@/contexts/WorkContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'motion/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface InfiniteWorkGridProps {
  works: Work[];
  onWorkClick?: (workId: number) => void;
}

export const InfiniteWorkGrid = ({ works, onWorkClick }: InfiniteWorkGridProps) => {
  const { lang } = useLanguage();
  
  // Refs
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  
  // State
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Detect mobile (<768px)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // GSAP ScrollTrigger Horizontal Scroll Pinning
  useLayoutEffect(() => {
    if (isMobile || !sectionRef.current || !trackRef.current || works.length === 0) return;

    // Wait for DOM to settle
    const timer = setTimeout(() => {
      if (!sectionRef.current || !trackRef.current) return;

      const track = trackRef.current;
      const totalScrollWidth = track.scrollWidth - window.innerWidth;

      // Kill previous instance
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }

      const tween = gsap.to(track, {
        x: -totalScrollWidth,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${totalScrollWidth}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            setScrollProgress(self.progress);
          },
        },
      });

      scrollTriggerRef.current = tween.scrollTrigger || null;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
    };
  }, [isMobile, works]);

  // Refresh ScrollTrigger on resize
  useEffect(() => {
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            <h2 className="text-[12px] lowercase tracking-[0.2em] text-muted-foreground font-mono">
              other works
            </h2>
            <span className="text-[10px] font-mono text-muted-foreground/70">
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

          {/* Caption */}
          <div className="mt-4">
            <h3 className="text-sm font-serif font-light text-foreground/90 leading-tight mb-1">
              {works[currentSlide].title_en}
            </h3>
            <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.1em]">
              {works[currentSlide].year}
            </p>
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

  // Desktop/Tablet: GSAP Pinned Horizontal Scroll
  return (
    <div ref={sectionRef} className="relative w-full bg-background overflow-hidden">
      {/* Header: Fixed at top of pinned section */}
      <div className="pt-24 md:pt-32 px-6 md:px-12 mb-8 md:mb-12 flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <h2 className="text-[12px] lowercase tracking-[0.2em] text-muted-foreground font-mono">
            other works
          </h2>
          <span className="font-mono text-muted-foreground/70 text-[10px]">
            {works.length} {works.length === 1 ? 'work' : 'works'}
          </span>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-24 h-[1px] bg-muted-foreground/20 relative overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-foreground/60 transition-none"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground/70 tabular-nums">
            {Math.round(scrollProgress * 100)}%
          </span>
        </div>
      </div>

      {/* Horizontal Track */}
      <div 
        ref={trackRef}
        className="flex gap-8 md:gap-12 px-6 md:px-12 pb-24 md:pb-32 will-change-transform"
      >
        {works.map((work) => (
          <div
            key={work.id}
            onClick={() => onWorkClick?.(Number(work.id))}
            className="group flex-shrink-0 cursor-pointer"
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
                {work.year}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
