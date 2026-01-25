import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [cursorState, setCursorState] = useState<'default' | 'active' | 'dot'>('default');

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Initial set
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });

    const moveCursor = (e: MouseEvent) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.2,
        ease: 'power2.out'
      });
    };

    const onMouseDown = () => gsap.to(cursor, { scale: 0.8 });
    const onMouseUp = () => gsap.to(cursor, { scale: 1 });

    // Global event delegation for hover states
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check for dot cursor trigger
      const dotTarget = target.matches('[data-cursor="dot"]') || target.closest('[data-cursor="dot"]');
      
      if (dotTarget) {
        setCursorState('dot');
        return;
      }

      // Check if the target or its closest parent is interactive
      const isInteractive = target.matches('a, button, input, textarea, select, .interactive') || 
                           target.closest('a, button, input, textarea, select, .interactive');
      
      setCursorState(isInteractive ? 'active' : 'default');
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    if (cursorState === 'dot') {
      // Minimalist dot cursor for clean text reading
      gsap.to(cursor, { 
        scale: 0.2, 
        opacity: 1, 
        mixBlendMode: 'normal',
        backgroundColor: '#fbae4e', // Use accent color (orange) for visibility
        boxShadow: '0 0 10px rgba(251, 174, 78, 0.5)' // Soft glow
      });
    } else if (cursorState === 'active') {
      gsap.to(cursor, { 
        scale: 1.2, 
        opacity: 1, // Increased opacity for better contrast
        mixBlendMode: 'exclusion', // Changed from 'difference' to 'exclusion' to match About page style
        backgroundColor: '#ffffff',
        boxShadow: 'none'
      });
    } else {
      gsap.to(cursor, { 
        scale: 1, 
        opacity: 1, 
        mixBlendMode: 'exclusion',
        backgroundColor: '#ffffff',
        boxShadow: 'none'
      });
    }
  }, [cursorState]);

  return (
    <div 
      ref={cursorRef}
      className="fixed top-0 left-0 w-3 h-3 bg-white rounded-full pointer-events-none z-[9999]"
      style={{ transform: 'translate(-50%, -50%)' }}
    />
  );
};
