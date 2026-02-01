import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Center the anchor point
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });

    const xTo = gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3.out" });

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      xTo(e.clientX);
      yTo(e.clientY);

      // Check for interactivity directly on move for responsiveness
      // (Optional: use event delegation for better performance if DOM is huge)
    };
    
    // Use event delegation for hover state to ensure we catch all elements
    const onMouseOver = (e: MouseEvent) => {
       const target = e.target as HTMLElement;
       const isLink = 
         target.tagName === 'A' || 
         target.tagName === 'BUTTON' ||
         target.tagName === 'INPUT' ||
         target.tagName === 'TEXTAREA' ||
         target.closest('a') !== null ||
         target.closest('button') !== null ||
         window.getComputedStyle(target).cursor === 'pointer';
         
       setIsHovering(isLink);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseover', onMouseOver);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
    };
  }, [isVisible]);

  useEffect(() => {
    if (!cursorRef.current) return;
    
    if (isHovering) {
      // Scale up and maybe become slightly transparent or ring-like
      gsap.to(cursorRef.current, { 
          scale: 3, 
          opacity: 1,
          duration: 0.3, 
          ease: "back.out(1.7)" 
      });
    } else {
      gsap.to(cursorRef.current, { 
          scale: 1, 
          opacity: 1,
          duration: 0.3, 
          ease: "power2.out" 
      });
    }
  }, [isHovering]);

  return (
    <>
        <style>{`
            @media (hover: hover) and (pointer: fine) {
                * {
                    cursor: none !important;
                }
            }
        `}</style>
        <div 
            ref={cursorRef}
            className={`fixed top-0 left-0 w-3 h-3 bg-white rounded-full mix-blend-difference pointer-events-none z-[10000] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'} hidden md:block`}
        />
    </>
  );
};
