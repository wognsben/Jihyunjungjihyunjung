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
        slideshowTimer.current = gsap.delayedCall(0.6, () => {
          idx = (idx + 1) % images.length;
          setCurrentImageIndex(idx);
          nextSlide();
        });
      };
      const startTimer = gsap.delayedCall(0.8, nextSlide);
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
        
        // Content fade in slightly later
        .fromTo(tooltipRef.current.querySelector('.tooltip-content'), 
            { opacity: 0 }, 
            { opacity: 1, duration: 0.4 }, 0.2);

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
            onClick={isMobile ? handleWorkClick : undefined}
            className={`
                fixed right-[5vw] bottom-[10vh] w-[250px] 
                z-[99999] 
                flex flex-col 
                bg-background dark:bg-zinc-900 
                shadow-[0_20px_50px_rgba(0,0,0,0.3)] 
                border border-border/10
                overflow-hidden
                ${isMobile ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}
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
                            className={`tooltip__img absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${i === currentImageIndex ? 'tooltip__img--current opacity-100' : 'opacity-0'}`}
                            style={{ backgroundImage: `url(${img})` }}
                        />
                    ))}
                </div>
                
                {/* Text Section - Solid Background, No Gaps */}
                {activeWork && (
                    <div className="tooltip__text w-full p-4 flex flex-col items-center justify-center text-center bg-background dark:bg-zinc-900 z-20 relative border-t border-border/5">
                        <div className="text-sm font-serif text-foreground mb-1 leading-tight">
                            <span className="font-medium mr-2">{activeWork.title_en || activeWork.title}</span>
                            <span className="font-mono text-[11px] opacity-50">&lt;{activeWork.year}&gt;</span>
                        </div>
                        <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-primary/70 border-b border-primary/20 pb-0.5">
                            {isMobile ? 'View Project' : 'Click to view'}
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