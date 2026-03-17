import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Work } from '@/contexts/WorkContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { getLocalizedThumbnail } from '@/utils/getLocalizedImage';
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
  const indicatorRef = useRef<HTMLDivElement>(null);
  
  // State
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);

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

    // Wait for images to start loading and DOM to settle
    const timer = setTimeout(() => {
      if (!sectionRef.current || !trackRef.current) return;

      const track = trackRef.current;
      const totalScrollWidth = track.scrollWidth - window.innerWidth;

      // Guard: if not enough content to scroll, skip pinning
      if (totalScrollWidth <= 0) return;

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
    }, 300);

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
                  src={getLocalizedThumbnail(works[currentSlide], lang) || ''}
                  alt={works[currentSlide].title_en}
                  className="w-full h-full object-cover pointer-events-none"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Caption */}
          <div className="mt-4">
            <h3 className="text-sm font-serif font-light text-foreground/90 leading-tight mb-1">
              {lang === 'ko' ? works[currentSlide].title_ko : lang === 'jp' ? works[currentSlide].title_jp : works[currentSlide].title_en}
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
      {/* Background mask to prevent content bleeding through transparent header */}
      <div className="absolute top-0 left-0 right-0 h-[88px] md:h-[104px] bg-background z-10" />
      
      {/* Header: Fixed at top of pinned section */}
      <div className="relative z-20 pt-12 md:pt-16 px-6 md:px-12 mb-8 md:mb-12 flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <h2 className="text-[12px] lowercase tracking-[0.2em] text-muted-foreground font-[Sans_Serif_Collection]">
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
        className="flex gap-4 md:gap-6 px-6 md:px-12 pb-12 md:pb-16 will-change-transform"
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
                src={getLocalizedThumbnail(work, lang) || ''}
                alt={work.title_en}
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
              />
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
            </div>

            {/* Caption */}
            <div className="w-[280px] md:w-[350px]">
              <h3 className="text-sm md:text-base font-serif font-light text-foreground/90 leading-tight mb-1 group-hover:text-foreground transition-colors duration-300">
                {lang === 'ko' ? work.title_ko : lang === 'jp' ? work.title_jp : work.title_en}
              </h3>
              <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.1em]">
                {work.year}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Minimap Scroll Indicator */}
      <div className="relative z-20 px-6 md:px-12 pb-24 md:pb-32">
        {/* Edge fade masks */}
        <div className="relative">
          <div 
            className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, var(--background), transparent)' }}
          />
          <div 
            className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, var(--background), transparent)' }}
          />
          
          {/* Interactive track */}
          <div 
            ref={indicatorRef}
            className="relative w-full cursor-pointer"
            style={{ height: '48px' }}
            onMouseMove={(e) => {
              if (!indicatorRef.current) return;
              const rect = indicatorRef.current.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width;
              const clamped = Math.max(0, Math.min(1, x));
              setHoverProgress(clamped);
              const nearestIndex = Math.round(clamped * (works.length - 1));
              setHoverIndex(nearestIndex);
            }}
            onMouseLeave={() => {
              setHoverIndex(null);
              setHoverProgress(null);
            }}
            onClick={(e) => {
              if (!indicatorRef.current || !scrollTriggerRef.current) return;
              const rect = indicatorRef.current.getBoundingClientRect();
              const clickProgress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const st = scrollTriggerRef.current;
              const targetScroll = st.start + (st.end - st.start) * clickProgress;
              window.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }}
          >
            {/* Hairline track */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-foreground/[0.06]" />

            {/* Work waypoint dots — barely there */}
            {works.map((_, index) => {
              const pos = works.length <= 1 ? 0 : (index / (works.length - 1)) * 100;
              const isHovered = index === hoverIndex;
              // Distance from hover for proximity glow
              const hoverDist = hoverProgress !== null 
                ? Math.abs(hoverProgress - (works.length <= 1 ? 0 : index / (works.length - 1))) 
                : 1;
              const proximityOpacity = hoverProgress !== null 
                ? Math.max(0.06, 0.3 - hoverDist * 2) 
                : 0.06;
              
              return (
                <div
                  key={index}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500 ease-out"
                  style={{ 
                    left: `${pos}%`,
                    width: isHovered ? '4px' : '2px',
                    height: isHovered ? '4px' : '2px',
                    backgroundColor: `rgba(0,0,0,${isHovered ? 0.4 : proximityOpacity})`,
                  }}
                />
              );
            })}

            {/* Smooth-moving active cursor */}
            <div
              className="absolute top-1/2 transition-none pointer-events-none"
              style={{
                left: `${scrollProgress * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Outer glow — square */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: '18px',
                  height: '18px',
                  background: 'radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 70%)',
                }}
              />
              {/* Core square — matches header ■ */}
              <div
                className="bg-foreground/70"
                style={{
                  width: '5px',
                  height: '5px',
                  boxShadow: '0 0 4px rgba(0,0,0,0.06), 0 0 10px rgba(0,0,0,0.02)',
                }}
              />
            </div>

            {/* Hover scan line */}
            <AnimatePresence>
              {hoverProgress !== null && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0.3 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0.3 }}
                  transition={{ duration: 0.2 }}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${hoverProgress * 100}%`,
                    top: '25%',
                    bottom: '25%',
                    width: '0.5px',
                    backgroundColor: 'rgba(0,0,0,0.12)',
                    transform: 'translateX(-50%)',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Hover tooltip */}
            <AnimatePresence>
              {hoverIndex !== null && hoverProgress !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute pointer-events-none z-20"
                  style={{
                    bottom: '100%',
                    left: `${hoverProgress * 100}%`,
                    transform: 'translateX(-50%)',
                    marginBottom: '4px',
                  }}
                >
                  {/* Connecting stem */}
                  <div 
                    className="absolute left-1/2 -translate-x-1/2 bg-foreground/10"
                    style={{ 
                      top: '100%', 
                      width: '0.5px', 
                      height: '4px',
                    }}
                  />
                  {/* Label */}
                  <div className="px-2.5 py-1.5" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)' }}>
                    <p className="text-[8px] font-mono text-white/85 whitespace-nowrap tracking-[0.08em] uppercase">
                      {lang === 'ko'
                        ? works[hoverIndex].title_ko
                        : lang === 'jp'
                          ? works[hoverIndex].title_jp
                          : works[hoverIndex].title_en}
                    </p>
                    <p className="text-[7px] font-mono text-white/40 tracking-[0.12em] mt-0.5">
                      {works[hoverIndex].year}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};