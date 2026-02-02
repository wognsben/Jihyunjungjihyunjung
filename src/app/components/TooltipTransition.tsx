import React, { useEffect, useRef, useState, useMemo } from 'react';
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


  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Tooltip Container */}
        <aside 
            ref={tooltipRef}
            onClick={isMobile && onClick ? onClick : undefined}
            className={`tooltip fixed right-[5vw] bottom-[10vh] w-[250px] z-40 opacity-0 flex flex-col ${isMobile ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`}
        >
            {/* Lines contained WITHIN the tooltip component for perfect alignment */}
            <div className="line-h absolute left-0 top-0 w-full h-[1px] bg-black dark:bg-white z-50" />
            <div className="line-h absolute left-0 bottom-0 w-full h-[1px] bg-black dark:bg-white z-50" />
            <div className="line-v absolute left-0 top-0 h-full w-[1px] bg-black dark:bg-white z-50" />
            <div className="line-v absolute right-0 top-0 h-full w-[1px] bg-black dark:bg-white z-50" />

            {/* Inner Content Wrapper */}
            <div className="tooltip-content w-full h-full relative">
                {/* Image Wrapper */}
                <div className="tooltip__img-wrap relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
                    {activeWork && images.map((img, i) => (
                        <div 
                            key={i}
                            className={`tooltip__img absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${i === currentImageIndex ? 'tooltip__img--current opacity-100' : 'opacity-0'}`}
                            style={{ backgroundImage: `url(${img})` }}
                        />
                    ))}
                </div>
                
                {/* Text */}
                {activeWork && (
                    <div className="tooltip__text relative mt-4 text-xs font-mono uppercase tracking-widest text-foreground bg-white/80 dark:bg-black/80 p-2 backdrop-blur-sm">
                        <span className="font-bold block mb-1">{activeWork.title_en || activeWork.title}</span>
                        <span className="opacity-70">{isMobile ? 'View Project' : 'Click to view'}</span>
                    </div>
                )}
            </div>
        </aside>

        {/* Fullscreen Gallery (Left here but controlled by isOpen which is now false in usage) */}
        {isOpen && activeWork && (
            <div 
                ref={galleryRef}
                className="gallery-fullscreen fixed inset-0 z-50 bg-background flex flex-col items-center justify-center pointer-events-auto"
            >
                {/* Content... (Not used in new flow) */}
            </div>
        )}
    </div>
  );
};