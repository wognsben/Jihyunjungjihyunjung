import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Work } from '@/data/works';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface IndexSlideshowProps {
  works: Work[];
}

export const IndexSlideshow = ({ works }: IndexSlideshowProps) => {
  const { lang } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const getTitle = (work: Work) => {
    switch (lang) {
      case 'ko': return work.title_ko;
      case 'jp': return work.title_jp;
      default: return work.title_en;
    }
  };

  const getInfo = (work: Work) => {
    switch (lang) {
      case 'ko': return work.oneLineInfo_ko;
      case 'jp': return work.oneLineInfo_jp;
      default: return work.oneLineInfo_en;
    }
  };

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev + 1) % works.length);
    setTimeout(() => setIsTransitioning(false), 1000);
  }, [isTransitioning, works.length]);

  const handlePrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev - 1 + works.length) % works.length);
    setTimeout(() => setIsTransitioning(false), 1000);
  }, [isTransitioning, works.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Touch/Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    
    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  const currentWork = works[activeIndex];
  const title = getTitle(currentWork);
  const info = getInfo(currentWork);

  return (
    <div 
      className="relative w-full overflow-hidden bg-black"
      style={{ 
        height: 'calc(100vh - var(--header-height))',
        minHeight: '500px',
        marginTop: 'var(--header-height)'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Image Area */}
      <a
        href={`#/work/${currentWork.id}`}
        className="absolute inset-0 block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative w-full h-full">
          {/* Background Image */}
          <div className="absolute inset-0 bg-black">
            <ImageWithFallback
              src={currentWork.thumbnail}
              alt={title}
              className="w-full h-full object-cover transition-all duration-1000 ease-out"
              style={{
                opacity: isTransitioning ? 0 : 1,
                transform: `scale(${isTransitioning ? 1 : 1.02})`
              }}
            />
          </div>

          {/* PC Hover Effect - clipPath + scale + CTA overlay */}
          <div
            className="absolute inset-0 hidden pointer-fine:block transition-all duration-700 ease-out"
            style={{
              clipPath: isHovered ? 'inset(18%)' : 'inset(0%)',
              transform: isHovered ? 'scale(0.95)' : 'scale(1)'
            }}
          >
            <ImageWithFallback
              src={currentWork.thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* CTA Overlay - PC only */}
          {isHovered && (
            <div className="absolute inset-0 hidden pointer-fine:flex items-center justify-center">
              <div 
                className="text-center text-white transition-all duration-500"
                style={{
                  opacity: isHovered ? 1 : 0,
                  transform: `translateY(${isHovered ? 0 : 8}px)`
                }}
              >
                <p className="text-lg md:text-xl mb-2">View Project</p>
                <p className="text-sm md:text-base opacity-80">{title}</p>
              </div>
            </div>
          )}
        </div>
      </a>

      {/* Text HUD - Bottom Left */}
      <div className="absolute bottom-8 left-4 md:left-8 z-10 max-w-md md:max-w-lg">
        <div
          key={activeIndex}
          className="transition-all duration-800 ease-out"
          style={{
            animation: 'fadeInUp 0.8s ease-out'
          }}
        >
          <h2 className="text-2xl md:text-4xl mb-2 text-white drop-shadow-lg">{title}</h2>
          {info && (
            <p className="text-sm md:text-base text-white/90 drop-shadow-md">{info}</p>
          )}
        </div>
      </div>

      {/* Navigation Buttons - Bottom Right */}
      <div className="absolute bottom-8 right-4 md:right-8 z-10 flex items-center gap-3">
        <button
          onClick={(e) => {
            e.preventDefault();
            handlePrev();
          }}
          disabled={isTransitioning}
          aria-label="Previous slide"
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            handleNext();
          }}
          disabled={isTransitioning}
          aria-label="Next slide"
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </button>
      </div>

      {/* Slide Counter - Top Right */}
      <div className="absolute top-8 right-4 md:right-8 z-10">
        <p className="text-sm md:text-base text-white/80 drop-shadow-md font-mono">
          {String(activeIndex + 1).padStart(2, '0')} / {String(works.length).padStart(2, '0')}
        </p>
      </div>

      {/* Fade In Up Animation */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};