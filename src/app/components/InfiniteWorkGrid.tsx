import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Work } from '@/contexts/WorkContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { getLocalizedThumbnail } from '@/utils/getLocalizedImage';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface InfiniteWorkGridProps {
  works: Work[];
  onWorkClick?: (workId: number) => void;
}

type ViewMode = 'mobile' | 'tablet' | 'desktop';

export const InfiniteWorkGrid = ({ works, onWorkClick }: InfiniteWorkGridProps) => {
  const { lang } = useLanguage();

  // Refs
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  // Tablet refs
  const tabletViewportRef = useRef<HTMLDivElement>(null);
  const tabletTrackRef = useRef<HTMLDivElement>(null);

  // State
  const [mode, setMode] = useState<ViewMode | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);

  // Tablet drag state
  const tabletX = useMotionValue(0);
  const [tabletBounds, setTabletBounds] = useState({ left: 0, right: 0 });

  const isReady = mode !== null;
  const isMobile = mode === 'mobile';
  const isTablet = mode === 'tablet';
  const isDesktop = mode === 'desktop';

  const getViewMode = (): ViewMode => {
    const w = window.innerWidth;

    if (w < 768) return 'mobile';
    if (w < 1280) return 'tablet';
    return 'desktop';
  };

  useEffect(() => {
    const checkScreenSize = () => {
      const nextMode = getViewMode();
      setMode(nextMode);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getLocalizedTitle = (work: Work) => {
    return lang === 'ko' ? work.title_ko : lang === 'jp' ? work.title_jp : work.title_en;
  };

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % works.length);
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + works.length) % works.length);
  };

  // Desktop GSAP
  useLayoutEffect(() => {
    if (!isReady || !isDesktop || !sectionRef.current || !trackRef.current || works.length === 0) {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!sectionRef.current || !trackRef.current) return;

      const track = trackRef.current;
      const totalScrollWidth = track.scrollWidth - window.innerWidth;

      if (totalScrollWidth <= 0) {
        if (scrollTriggerRef.current) {
          scrollTriggerRef.current.kill();
          scrollTriggerRef.current = null;
        }
        setScrollProgress(0);
        return;
      }

      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
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
      ScrollTrigger.refresh();
    }, 250);

    return () => {
      clearTimeout(timer);
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
    };
  }, [isReady, isDesktop, works]);

  // Tablet bounds
  useLayoutEffect(() => {
    if (!isReady || !isTablet || !tabletViewportRef.current || !tabletTrackRef.current) {
      setTabletBounds({ left: 0, right: 0 });
      tabletX.set(0);
      setScrollProgress(0);
      return;
    }

    const updateTabletBounds = () => {
      if (!tabletViewportRef.current || !tabletTrackRef.current) return;

      const viewportWidth = tabletViewportRef.current.clientWidth;
      const trackWidth = tabletTrackRef.current.scrollWidth;
      const maxDrag = Math.max(0, trackWidth - viewportWidth);

      setTabletBounds({
        left: -maxDrag,
        right: 0,
      });

      const clampedX = clamp(tabletX.get(), -maxDrag, 0);
      tabletX.set(clampedX);

      if (maxDrag <= 0) {
        setScrollProgress(0);
      } else {
        setScrollProgress(Math.abs(clampedX) / maxDrag);
      }
    };

    const timer = setTimeout(updateTabletBounds, 50);
    window.addEventListener('resize', updateTabletBounds);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTabletBounds);
    };
  }, [isReady, isTablet, works, tabletX]);

  // Tablet progress sync
  useEffect(() => {
    if (!isReady || !isTablet) return;

    const unsubscribe = tabletX.on('change', (latest) => {
      const maxDrag = Math.abs(tabletBounds.left);
      if (maxDrag <= 0) {
        setScrollProgress(0);
        return;
      }
      setScrollProgress(clamp(Math.abs(latest) / maxDrag, 0, 1));
    });

    return unsubscribe;
  }, [isReady, isTablet, tabletBounds.left, tabletX]);

  // Desktop refresh
  useEffect(() => {
    const handleResize = () => {
      if (isReady && isDesktop) {
        ScrollTrigger.refresh();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isReady, isDesktop]);

  if (!isReady || works.length === 0) return null;

  // Mobile
  if (isMobile) {
    return (
      <div className="relative w-full bg-background py-24">
        <div className="px-6 md:px-12 mb-8 flex items-end justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <h2 className="text-[12px] lowercase tracking-[0.2em] text-muted-foreground font-mono">
              other works
            </h2>
            <span className="text-[10px] font-mono text-muted-foreground/70">
              {works.length} {works.length === 1 ? 'work' : 'works'}
            </span>
          </div>
        </div>

        <div className="relative w-full px-6 md:px-12">
          <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted/10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = offset.x;
                  const swipeVelocity = velocity.x;

                  if (Math.abs(swipe) > 50 || Math.abs(swipeVelocity) > 500) {
                    if (swipe > 0) goToPrevSlide();
                    else goToNextSlide();
                  }
                }}
              >
                <ImageWithFallback
                  src={getLocalizedThumbnail(works[currentSlide], lang) || ''}
                  alt={works[currentSlide].title_en}
                  className="w-full h-full object-cover pointer-events-none"
                />
                <div
                  className="absolute inset-0 z-10"
                  onClick={() => onWorkClick?.(Number(works[currentSlide].id))}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div
            className="mt-4 cursor-pointer"
            onClick={() => onWorkClick?.(Number(works[currentSlide].id))}
          >
            <h3 className="text-sm font-serif font-light text-foreground/90 leading-tight mb-1">
              {getLocalizedTitle(works[currentSlide])}
            </h3>
            <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.1em]">
              {works[currentSlide].year}
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <span className="text-[12px] font-mono text-muted-foreground/60 tracking-wider tabular-nums">
              {String(currentSlide + 1).padStart(2, '0')} / {String(works.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Tablet
  if (isTablet) {
    return (
      <div className="relative w-full bg-background overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[88px] md:h-[104px] bg-background z-10" />

        <div className="relative z-20 pt-12 md:pt-16 px-6 md:px-12 mb-8 md:mb-12 flex items-end justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <h2 className="text-[12px] lowercase tracking-[0.2em] text-muted-foreground/90 font-[Sans_Serif_Collection]">
              other works
            </h2>
            <span className="font-mono text-muted-foreground/80 text-[10px]">
              {works.length} {works.length === 1 ? 'work' : 'works'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-24 h-[1px] bg-muted-foreground/20 relative overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-foreground/60 transition-none"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-muted-foreground/80 tabular-nums">
              {Math.round(scrollProgress * 100)}%
            </span>
          </div>
        </div>

        <div ref={tabletViewportRef} className="px-8 lg:px-12 overflow-hidden">
          <motion.div
            ref={tabletTrackRef}
            className="flex gap-5 lg:gap-6 pb-16 cursor-grab active:cursor-grabbing"
            drag="x"
            dragMomentum={false}
            dragConstraints={tabletBounds}
            dragElastic={0.03}
            style={{ x: tabletX }}
            onDragEnd={() => {
              if (!tabletViewportRef.current) return;

              const viewportWidth = tabletViewportRef.current.clientWidth;
              const gap = viewportWidth >= 1100 ? 24 : 20;

              // 768~1023에서는 2개 중심, 1024~1279에서는 2.2~2.4개 느낌
              const visibleCards = viewportWidth >= 1100 ? 2.2 : 2;
              const cardWidth = (viewportWidth - gap * (visibleCards - 1)) / visibleCards;
              const step = cardWidth + gap;

              const rawX = tabletX.get();
              const snappedIndex = Math.round(Math.abs(rawX) / step);
              const targetX = clamp(-(snappedIndex * step), tabletBounds.left, 0);

              animate(tabletX, targetX, {
                type: 'spring',
                stiffness: 380,
                damping: 38,
                mass: 0.9,
              });
            }}
          >
            {works.map((work) => (
              <div
                key={work.id}
                onClick={() => onWorkClick?.(Number(work.id))}
                className="group flex-shrink-0 cursor-pointer"
              >
                <div className="w-[calc((100vw-96px)/2)] lg:w-[calc((100vw-140px)/2.2)] aspect-[4/3] overflow-hidden bg-muted/10 mb-4 relative min-w-[280px] max-w-[520px]">
                  <ImageWithFallback
                    src={getLocalizedThumbnail(work, lang) || ''}
                    alt={work.title_en}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                </div>

                <div className="w-[calc((100vw-96px)/2)] lg:w-[calc((100vw-140px)/2.2)] min-w-[280px] max-w-[520px]">
                  <h3 className="text-sm md:text-base font-serif font-light text-foreground/90 leading-tight mb-1 group-hover:text-foreground transition-colors duration-300">
                    {getLocalizedTitle(work)}
                  </h3>
                  <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.1em]">
                    {work.year}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="relative z-20 px-6 md:px-12 pb-24 md:pb-32">
          <div className="relative">
            <div
              className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to right, var(--background), transparent)' }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to left, var(--background), transparent)' }}
            />

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
                if (!indicatorRef.current) return;
                const rect = indicatorRef.current.getBoundingClientRect();
                const clickProgress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const maxDrag = Math.abs(tabletBounds.left);
                const targetX = -(maxDrag * clickProgress);

                animate(tabletX, targetX, {
                  type: 'spring',
                  stiffness: 300,
                  damping: 36,
                  mass: 0.9,
                });
              }}
            >
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-foreground/[0.06]" />

              {works.map((_, index) => {
                const pos = works.length <= 1 ? 0 : (index / (works.length - 1)) * 100;
                const isHovered = index === hoverIndex;
                const hoverDist =
                  hoverProgress !== null
                    ? Math.abs(hoverProgress - (works.length <= 1 ? 0 : index / (works.length - 1)))
                    : 1;
                const proximityOpacity =
                  hoverProgress !== null ? Math.max(0.06, 0.3 - hoverDist * 2) : 0.06;

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

              <div
                className="absolute top-1/2 transition-none pointer-events-none"
                style={{
                  left: `${scrollProgress * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: '18px',
                    height: '18px',
                    background: 'radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 70%)',
                  }}
                />
                <div
                  className="bg-foreground/70"
                  style={{
                    width: '5px',
                    height: '5px',
                    boxShadow: '0 0 4px rgba(0,0,0,0.06), 0 0 10px rgba(0,0,0,0.02)',
                  }}
                />
              </div>

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
                    <div
                      className="absolute left-1/2 -translate-x-1/2 bg-foreground/10"
                      style={{ top: '100%', width: '0.5px', height: '4px' }}
                    />
                    <div className="px-2.5 py-1.5" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)' }}>
                      <p className="text-[8px] font-mono text-white/85 whitespace-nowrap tracking-[0.08em] uppercase">
                        {getLocalizedTitle(works[hoverIndex])}
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
  }

  // Desktop
  return (
    <div ref={sectionRef} className="relative w-full bg-background overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[88px] md:h-[104px] bg-background z-10" />

      <div className="relative z-20 pt-12 md:pt-16 px-6 md:px-12 mb-8 md:mb-12 flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <h2 className="text-[12px] lowercase tracking-[0.2em] text-muted-foreground/90 font-[Sans_Serif_Collection]">
            other works
          </h2>
          <span className="font-mono text-muted-foreground/80 text-[10px]">
            {works.length} {works.length === 1 ? 'work' : 'works'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-24 h-[1px] bg-muted-foreground/20 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-foreground/60 transition-none"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground/80 tabular-nums">
            {Math.round(scrollProgress * 100)}%
          </span>
        </div>
      </div>

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
            <div className="w-[280px] md:w-[350px] aspect-[4/3] overflow-hidden bg-muted/10 mb-4 relative">
              <ImageWithFallback
                src={getLocalizedThumbnail(work, lang) || ''}
                alt={work.title_en}
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
            </div>

            <div className="w-[280px] md:w-[350px]">
              <h3 className="text-sm md:text-base font-serif font-light text-foreground/90 leading-tight mb-1 group-hover:text-foreground transition-colors duration-300">
                {getLocalizedTitle(work)}
              </h3>
              <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.1em]">
                {work.year}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-20 px-6 md:px-12 pb-24 md:pb-32">
        <div className="relative">
          <div
            className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, var(--background), transparent)' }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, var(--background), transparent)' }}
          />

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
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-foreground/[0.06]" />
          </div>
        </div>
      </div>
    </div>
  );
};