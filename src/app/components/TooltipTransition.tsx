import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { useWorks } from '@/contexts/WorkContext';
import { Work } from '@/types/work';

gsap.registerPlugin(Flip);

interface TooltipTransitionProps {
  hoveredWorkId: string | null;
  isOpen: boolean;
  onClose: () => void;
  triggerRect?: DOMRect | null;
  onClick?: () => void; // Mobile: 툴팁 클릭 시 프로젝트 열기
  isMobile?: boolean; // Mobile 여부
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const TooltipTransition: React.FC<TooltipTransitionProps> = ({ 
  hoveredWorkId, 
  isOpen, 
  onClose,
  triggerRect,
  onClick,
  isMobile = false,
  onMouseEnter,
  onMouseLeave
}) => {
  const { works } = useWorks();
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [activeWork, setActiveWork] = useState<Work | null>(null);

  useEffect(() => {
    if (hoveredWorkId) {
      const found = works.find(w => w.id === hoveredWorkId);
      if (found) {
        setActiveWork(found);
        setCurrentImageIndex(0);
      }
    }
  }, [hoveredWorkId, works]);

  // Timelines
  const enterTl = useRef<gsap.core.Timeline | null>(null);
  const leaveTl = useRef<gsap.core.Timeline | null>(null);
  const slideshowTimer = useRef<gsap.core.Tween | null>(null);

  const images = useMemo(() => {
    if (!activeWork) return [];
    return [activeWork.thumbnail, ...(activeWork.galleryImages || [])].filter(Boolean) as string[];
  }, [activeWork]);

  // Slideshow
  useEffect(() => {
    if (hoveredWorkId && !isOpen && images.length > 0) {
      let idx = 0; 
      const nextSlide = () => {
        // Change state immediately when called
        idx = (idx + 1) % images.length;
        setCurrentImageIndex(idx);
        // Then schedule the next one
        slideshowTimer.current = gsap.delayedCall(1.8, nextSlide);
      };
      
      // Start the cycle
      const startTimer = gsap.delayedCall(1.8, nextSlide);
      return () => {
        if (slideshowTimer.current) slideshowTimer.current.kill();
        if (startTimer) startTimer.kill();
      };
    }
  }, [hoveredWorkId, isOpen, images.length]);

  // Animation
  useEffect(() => {
    if (!tooltipRef.current) return;

    // Select lines inside the tooltip
    const linesH = tooltipRef.current.querySelectorAll('.line-h');
    const linesV = tooltipRef.current.querySelectorAll('.line-v');

    if (enterTl.current) enterTl.current.kill();
    if (leaveTl.current) leaveTl.current.kill();

    if (hoveredWorkId && !isOpen) {
        // ENTER
        enterTl.current = gsap.timeline({
            defaults: { duration: 0.6, ease: 'power3.out' }
        })
        .set(tooltipRef.current, { opacity: 1 })
        .set([linesH, linesV], { opacity: 1 })
        
        // Animate lines "drawing" or sliding
        .fromTo(linesH[0], { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1 }, 0)
        .fromTo(linesH[1], { scaleX: 0, transformOrigin: 'right' }, { scaleX: 1 }, 0)
        .fromTo(linesV[0], { scaleY: 0, transformOrigin: 'top' }, { scaleY: 1 }, 0)
        .fromTo(linesV[1], { scaleY: 0, transformOrigin: 'bottom' }, { scaleY: 1 }, 0)
        
        // Staggered Text Entrance (New Micro Detail)
        .fromTo(tooltipRef.current.querySelectorAll('.stagger-item'), 
            { y: 10, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }, 0.2);

    } else if (!hoveredWorkId && !isOpen) {
        // LEAVE
        leaveTl.current = gsap.timeline({
            defaults: { duration: 0.4, ease: 'power3.in' }
        })
        .to(tooltipRef.current, { opacity: 0 });
    }
  }, [hoveredWorkId, isOpen, activeWork]);


  const handleWorkClick = () => {
    if (activeWork) {
      // Direct navigation as a fallback/primary method for mobile
      window.location.hash = `#/work/${activeWork.id}`;
      if (onClick) onClick(); // Execute any parent cleanup logic
    }
  };

  if (!isMobile && !isOpen && !hoveredWorkId) return null;

  // Create a portal to render the tooltip at the very end of the document body
  // This ensures it sits above ALL other stacking contexts (headers, lists, 3D transforms)
  return createPortal(
    <div 
        ref={containerRef} 
        className="fixed inset-0 z-[99999] pointer-events-none flex flex-col justify-end items-end"
        style={{ zIndex: 99999 }} // Inline style to force override
    >
        {/* Tooltip Container */}
        <aside 
            ref={tooltipRef}
            onClick={handleWorkClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`
                fixed right-[5vw] bottom-[10vh] w-[250px] 
                z-[99999] 
                flex flex-col 
                bg-background dark:bg-zinc-900 
                shadow-[0_20px_50px_rgba(0,0,0,0.3)] 
                border border-border/10
                overflow-hidden
                pointer-events-auto cursor-pointer
            `}
            style={{ 
                opacity: 0, // Controlled by GSAP
                isolation: 'isolate' // Creates a new stacking context
            }} 
        >
            {/* Lines - Decoration */}
            <div className="line-h absolute left-0 top-0 w-full h-[1px] bg-foreground z-50 pointer-events-none opacity-0" />
            <div className="line-h absolute left-0 bottom-0 w-full h-[1px] bg-foreground z-50 pointer-events-none opacity-0" />
            <div className="line-v absolute left-0 top-0 h-full w-[1px] bg-foreground z-50 pointer-events-none opacity-0" />
            <div className="line-v absolute right-0 top-0 h-full w-[1px] bg-foreground z-50 pointer-events-none opacity-0" />

            {/* Inner Content Wrapper */}
            <div className="tooltip-content w-full relative z-10 flex flex-col bg-background dark:bg-zinc-900">
                {/* Image Wrapper - Solid Background to prevent transparency */}
                <div className="tooltip__img-wrap relative w-full aspect-[4/3] overflow-hidden bg-muted shrink-0 z-20">
                    {activeWork && images.map((img, i) => (
                        <div 
                            key={i}
                            className={`tooltip__img absolute inset-0 bg-cover bg-center ${i === currentImageIndex ? 'tooltip__img--current opacity-100 scale-110' : 'opacity-0 scale-110'}`}
                            style={{ 
                                backgroundImage: `url(${img})`,
                                // Transition updated: opacity 1.2s for soft cross-fade
                                // Scale always active to prevent "jump" when fading out
                                transition: 'opacity 1.2s ease-in-out, transform 10s ease-out' 
                            }}
                        />
                    ))}
                </div>
                
                {/* Text Section - Premium Gallery Caption Style */}
                {activeWork && (
                    <div className="tooltip__text w-full flex flex-col bg-background dark:bg-zinc-900 z-20 relative border-t border-border/10">
                        {/* Title & Year Row */}
                        <div className="p-4 flex flex-col gap-1 items-start text-left">
                            <div className="stagger-item flex items-baseline justify-between w-full gap-2">
                                <span className="text-sm font-serif font-medium text-foreground leading-tight tracking-tight">
                                    {activeWork.title_en || activeWork.title}
                                </span>
                                <span className="shrink-0 text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                                    {activeWork.year}
                                </span>
                            </div>
                            <span className="stagger-item text-[10px] text-muted-foreground/40 font-sans tracking-wide uppercase">
                                {activeWork.category || 'Selected Work'}
                            </span>
                        </div>

                        {/* Action Button Area - Full Width */}
                        <div className={`
                            stagger-item
                            w-full py-3 px-4 
                            border-t border-border/5
                            flex items-center justify-between
                            bg-muted/10 dark:bg-white/5
                            transition-colors duration-300
                            ${isMobile ? 'active:bg-muted/20' : ''}
                        `}>
                            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-foreground/80">
                                Click to project
                            </span>
                            {/* Arrow Icon */}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-foreground/60 transform rotate-[-45deg]">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>
                )}
            </div>
        </aside>

        {/* Fullscreen Gallery Placeholder (If needed later) */}
        {isOpen && activeWork && (
            <div ref={galleryRef} className="hidden" />
        )}
    </div>,
    document.body
  );
};