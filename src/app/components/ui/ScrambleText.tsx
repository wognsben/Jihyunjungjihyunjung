import { useEffect, useRef, useState } from 'react';

interface ScrambleTextProps {
  text: string;
  duration?: number;
  delay?: number;
  className?: string;
  scrambleSpeed?: number;
  preserveSpace?: boolean;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

export const ScrambleText = ({
  text,
  duration = 1000,
  delay = 0,
  className = '',
  scrambleSpeed = 30,
  preserveSpace = true,
}: ScrambleTextProps) => {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const startAnimation = () => {
      setIsAnimating(true);
      startTimeRef.current = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const progress = Math.min(1, (now - startTimeRef.current) / duration);
        
        // Easing (easeOutCubic)
        const ease = 1 - Math.pow(1 - progress, 3);
        
        let result = '';
        
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          
          if (preserveSpace && char === ' ') {
            result += ' ';
            continue;
          }

          // If current char index is less than eased progress, show original char
          if (i / text.length < ease) {
            result += char;
          } else {
            // Otherwise show random char
            const randomChar = CHARS[Math.floor(Math.random() * CHARS.length)];
            result += randomChar;
          }
        }

        setDisplayText(result);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          setDisplayText(text); // Ensure final state is correct
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    };

    // Intersection Observer to trigger when visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isAnimating) {
          timeout = setTimeout(startAnimation, delay);
          observer.disconnect(); // Only play once
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      // Set initial placeholder text (full scramble)
      let initial = '';
      for (let i = 0; i < text.length; i++) {
        if (preserveSpace && text[i] === ' ') initial += ' ';
        else initial += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      setDisplayText(initial);
      
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [text, duration, delay, preserveSpace]);

  return (
    <span ref={elementRef} className={className}>
      {displayText}
    </span>
  );
};
