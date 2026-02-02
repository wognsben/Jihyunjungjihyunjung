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
    gsap.set(cursor, { xPercent: -50, yPercent: -50, rotation: 0 });

    const xTo = gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3.out" });

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      xTo(e.clientX);
      yTo(e.clientY);
    };
    
    // Check interactivity
    const onMouseOver = (e: MouseEvent) => {
       const target = e.target as HTMLElement;
       const isLink = 
         target.tagName === 'A' || 
         target.tagName === 'BUTTON' ||
         target.tagName === 'INPUT' ||
         target.tagName === 'TEXTAREA' ||
         target.closest('a') !== null ||
         target.closest('button') !== null ||
         target.closest('[role="button"]') !== null ||
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

  // Animation Logic for the Viewfinder
  useEffect(() => {
    if (!cursorRef.current) return;
    
    const corners = cursorRef.current.querySelectorAll('.corner');

    if (isHovering) {
      // HOVER STATE: Expand to frame the content
      // No rotation, just pure expansion
      
      // Ensure rotation is 0
      gsap.to(cursorRef.current, { rotation: 0, duration: 0.35, ease: "power2.out" });

      // Move corners outward to make a larger frame (Capture Mode)
      gsap.to(corners[0], { x: -10, y: -10, duration: 0.35, ease: "back.out(1.7)" }); // TL
      gsap.to(corners[1], { x: 10, y: -10, duration: 0.35, ease: "back.out(1.7)" });  // TR
      gsap.to(corners[2], { x: -10, y: 10, duration: 0.35, ease: "back.out(1.7)" });  // BL
      gsap.to(corners[3], { x: 10, y: 10, duration: 0.35, ease: "back.out(1.7)" });   // BR

    } else {
      // NORMAL STATE: Small Bracket Frame
      // No rotation. Just a tight, ready-state frame.
      
      // Ensure rotation is 0
      gsap.to(cursorRef.current, { rotation: 0, duration: 0.35, ease: "power2.out" });

      // Move corners inward but keep a gap (Ready Mode as [ ])
      // Increased X to 5 (was 3) to create the "gap" effect
      gsap.to(corners[0], { x: -5, y: -3, duration: 0.35, ease: "power2.out" });
      gsap.to(corners[1], { x: 5, y: -3, duration: 0.35, ease: "power2.out" });
      gsap.to(corners[2], { x: -5, y: 3, duration: 0.35, ease: "power2.out" });
      gsap.to(corners[3], { x: 5, y: 3, duration: 0.35, ease: "power2.out" });
    }
  }, [isHovering]);

  useEffect(() => {
    if (isVisible && cursorRef.current) {
        gsap.to(cursorRef.current, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    }
  }, [isVisible]);

  return (
    <>
        <style>{`
            @media (hover: hover) and (pointer: fine) {
                body, a, button, input, textarea, [role="button"], .cursor-pointer {
                    cursor: none !important;
                }
            }
        `}</style>
        
        {/* Main Cursor Container */}
        <div 
            ref={cursorRef}
            className="fixed top-0 left-0 pointer-events-none z-[99999] hidden md:flex items-center justify-center mix-blend-difference"
            style={{ 
                width: '0px', 
                height: '0px',
                opacity: 0
            }} 
        >
            {/* 
               Viewfinder Corners 
               These are absolute positioned relative to the center 0x0 div
               They will move apart on hover
            */}
            
            {/* Top Left */}
            <div className="corner absolute w-[6px] h-[6px] border-l-2 border-t-2 border-white bg-transparent" />
            
            {/* Top Right */}
            <div className="corner absolute w-[6px] h-[6px] border-r-2 border-t-2 border-white bg-transparent" />
            
            {/* Bottom Left */}
            <div className="corner absolute w-[6px] h-[6px] border-l-2 border-b-2 border-white bg-transparent" />
            
            {/* Bottom Right */}
            <div className="corner absolute w-[6px] h-[6px] border-r-2 border-b-2 border-white bg-transparent" />
        </div>
    </>
  );
};
