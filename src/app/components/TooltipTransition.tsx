import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { useWorks } from '@/contexts/WorkContext';
import { Work } from '@/types/work';
import { X } from 'lucide-react';

interface TooltipTransitionProps {
  hoveredWorkId: string | null;
  isOpen: boolean;
  onClose: () => void;
  triggerRect?: DOMRect | null;
  onClick?: () => void;
  isMobile?: boolean;
}

export const TooltipTransition: React.FC<TooltipTransitionProps> = ({ 
  hoveredWorkId, 
  isOpen, 
  onClose,
  triggerRect,
  onClick,
  isMobile = false
}) => {
  const { works } = useWorks();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeWork, setActiveWork] = useState<Work | null>(null);
  const slideshowTimer = useRef<gsap.core.Tween | null>(null);

  // Update active work
  useEffect(() => {
    if (hoveredWorkId) {
      const found = works.find(w => w.id === hoveredWorkId);
      if (found) {
        setActiveWork(found);
        setCurrentImageIndex(0);
      }
    }
  }, [hoveredWorkId, works]);

  const images = useMemo(() => {
    if (!activeWork) return [];
    return [activeWork.thumbnail, ...(activeWork.galleryImages || [])].filter(Boolean) as string[];
  }, [activeWork]);

  // Slideshow
  useEffect(() => {
    if (hoveredWorkId && !isOpen && images.length > 0) {
      let idx = 0; 
      const nextSlide = () => {
        idx = (idx + 1) % images.length;
        setCurrentImageIndex(idx);
        slideshowTimer.current = gsap.delayedCall(1.8, nextSlide);
      };
      
      const startTimer = gsap.delayedCall(1.8, nextSlide);
      return () => {
        if (slideshowTimer.current) slideshowTimer.current.kill();
        if (startTimer) startTimer.kill();
      };
    }
  }, [hoveredWorkId, isOpen, images.length]);

  // Premium animations
  useEffect(() => {
    if (!tooltipRef.current) return;

    if (hoveredWorkId && activeWork) {
      // Elegant entrance
      gsap.timeline()
        .set(tooltipRef.current, { opacity: 0, y: 20, scale: 0.95 })
        .to(tooltipRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out'
        });
    } else if (!hoveredWorkId) {
      // Smooth exit
      gsap.to(tooltipRef.current, {
        opacity: 0,
        y: 10,
        scale: 0.98,
        duration: 0.4,
        ease: 'power2.in'
      });
    }
  }, [hoveredWorkId, activeWork]);

  const handleWorkClick = () => {
    if (activeWork) {
      window.location.hash = `#/work/${activeWork.id}`;
      if (onClick) onClick();
    }
  };

  // Don't show anything if no work is hovered
  if (!hoveredWorkId || !activeWork) {
    return null;
  }

  // Active tooltip
  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] pointer-events-none"
    >
      <aside 
        ref={tooltipRef}
        onClick={handleWorkClick}
        className="fixed right-[5vw] bottom-[10vh] w-[280px] md:w-[320px] z-[99999] flex flex-col bg-background dark:bg-zinc-900 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-border/20 rounded-sm overflow-hidden pointer-events-auto cursor-pointer backdrop-blur-xl group"
        style={{ 
          opacity: 0,
          isolation: 'isolate'
        }} 
      >
        {/* Premium Frame Lines */}
        <div className="absolute inset-0 pointer-events-none z-50">
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-8 h-8">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-foreground/40 to-transparent"></div>
            <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-foreground/40 to-transparent"></div>
          </div>
          <div className="absolute top-0 right-0 w-8 h-8">
            <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-foreground/40 to-transparent"></div>
            <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-foreground/40 to-transparent"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-8 h-8">
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-foreground/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-[1px] h-full bg-gradient-to-t from-foreground/40 to-transparent"></div>
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8">
            <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-l from-foreground/40 to-transparent"></div>
            <div className="absolute bottom-0 right-0 w-[1px] h-full bg-gradient-to-t from-foreground/40 to-transparent"></div>
          </div>
        </div>

        {/* Image Gallery with Premium Crossfade */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted/10">
          {/* Close Button - Top Right */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-2 right-2 z-50 w-6 h-6 rounded-full bg-background/80 backdrop-blur-md border border-border/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:scale-110 pointer-events-auto"
            aria-label="Close preview"
          >
            <X className="w-3 h-3 text-foreground/60" />
          </button>
          
          {activeWork && images.map((img, i) => (
            <div 
              key={i}
              className="absolute inset-0 transition-all duration-[1200ms] ease-in-out"
              style={{ 
                opacity: i === currentImageIndex ? 1 : 0,
                transform: i === currentImageIndex ? 'scale(1.05)' : 'scale(1.1)',
                transition: 'opacity 1.2s ease-in-out, transform 12s ease-out'
              }}
            >
              <div 
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${img})` }}
              />
            </div>
          ))}
          
          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/20 pointer-events-none"></div>
          
          {/* Image Counter - Left Top */}
          {images.length > 1 && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-full border border-border/20">
              <span className="text-[8px] font-mono text-foreground/70 tabular-nums">
                {currentImageIndex + 1}/{images.length}
              </span>
            </div>
          )}
        </div>
        
        {/* Premium Content Section */}
        {activeWork && (
          <div className="w-full flex flex-col bg-background/95 dark:bg-zinc-900/95 backdrop-blur-sm relative">
            {/* Main Info */}
            <div className="px-5 py-4 flex flex-col gap-2">
              {/* Title Row */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm md:text-base font-serif font-light text-foreground leading-tight tracking-tight transition-all duration-300 group-hover:text-foreground/80">
                  {activeWork.title_en || activeWork.title}
                </h3>
                <span className="shrink-0 text-[10px] font-mono text-muted-foreground/60 tracking-wider mt-0.5">
                  {activeWork.year}
                </span>
              </div>
              
              {/* Category Badge */}
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 bg-muted/20 rounded-full border border-border/10">
                  <span className="text-[9px] text-muted-foreground/50 font-sans tracking-wide uppercase">
                    {activeWork.category || 'Selected Work'}
                  </span>
                </div>
                {/* Medium if available */}
                {activeWork.medium && (
                  <span className="text-[9px] text-muted-foreground/40 font-mono">
                    {activeWork.medium}
                  </span>
                )}
              </div>
            </div>

            {/* Action Footer */}
            <div className="w-full px-5 py-3 border-t border-border/10 bg-gradient-to-b from-transparent to-muted/10 flex items-center justify-between transition-all duration-300 group-hover:bg-muted/20">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-foreground/70 group-hover:text-foreground transition-colors duration-300">
                View project
              </span>
              {/* Arrow with micro animation */}
              <div className="relative">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-foreground/50 group-hover:text-foreground transition-all duration-300 group-hover:translate-x-0.5">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Shimmer Effect on Hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>
      </aside>
    </div>,
    document.body
  );
};