import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface SplitTextLinkProps {
  text: string;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  activeColor?: string;
  inactiveColor?: string;
  hoverColor?: string;
  underlineColor?: string;
  showUnderline?: boolean;
}

export const SplitTextLink = ({
  text,
  onClick,
  isActive = false,
  className = '',
  style = {},
  activeColor = 'text-white',
  inactiveColor = 'text-white/40',
  hoverColor = 'text-white/70',
  underlineColor = 'bg-white',
  showUnderline = true,
}: SplitTextLinkProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const topLineRef = useRef<HTMLSpanElement>(null);
  const bottomLineRef = useRef<HTMLSpanElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);

  const chars = text.split('');

  useEffect(() => {
    if (!buttonRef.current || !topLineRef.current || !bottomLineRef.current) return;

    const button = buttonRef.current;
    const topChars = topLineRef.current.querySelectorAll('.mi__char--top');
    const bottomChars = bottomLineRef.current.querySelectorAll('.mi__char--bottom');

    // Hover animation
    const handleMouseEnter = () => {
      // Top chars slide up and fade out
      gsap.to(topChars, {
        y: '-120%',
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
        stagger: {
          each: 0.02,
          from: 'start',
        },
      });

      // Bottom chars slide up from bottom
      gsap.fromTo(
        bottomChars,
        {
          y: '120%',
          opacity: 0,
        },
        {
          y: '0%',
          opacity: 1,
          duration: 0.5,
          ease: 'power3.out',
          stagger: {
            each: 0.02,
            from: 'start',
          },
        }
      );
    };

    const handleMouseLeave = () => {
      // Top chars come back
      gsap.to(topChars, {
        y: '0%',
        opacity: 1,
        duration: 0.5,
        ease: 'power3.out',
        stagger: {
          each: 0.02,
          from: 'start',
        },
      });

      // Bottom chars slide down
      gsap.to(bottomChars, {
        y: '120%',
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
        stagger: {
          each: 0.02,
          from: 'start',
        },
      });
    };

    // Only add hover listeners on desktop
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    
    const addListeners = () => {
      button.addEventListener('mouseenter', handleMouseEnter);
      button.addEventListener('mouseleave', handleMouseLeave);
    };

    const removeListeners = () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };

    if (mediaQuery.matches) {
      addListeners();
    }

    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        addListeners();
      } else {
        removeListeners();
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      removeListeners();
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className={`relative group ${className} ${
        isActive ? activeColor : inactiveColor
      }`}
      style={{
        ...style,
        position: 'relative',
      }}
    >
      {/* Container for split text */}
      <span className="relative inline-block" style={{ overflow: 'visible' }}>
        {/* Top Line - Default visible */}
        <span
          ref={topLineRef}
          className="mi__line relative inline-block"
          aria-hidden="true"
          style={{
            display: 'inline-block',
          }}
        >
          {chars.map((char, index) => (
            <span
              key={`top-${index}`}
              className="mi__wrap inline-block"
              style={{
                overflow: 'hidden',
                display: 'inline-block',
                verticalAlign: 'top',
              }}
            >
              <span
                className="mi__char mi__char--top inline-block"
                style={{
                  display: 'inline-block',
                  willChange: 'transform, opacity',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            </span>
          ))}
        </span>

        {/* Bottom Line - Hidden initially */}
        <span
          ref={bottomLineRef}
          className="mi__line mi__line--bottom absolute left-0 top-0"
          aria-hidden="true"
          style={{
            display: 'inline-block',
            pointerEvents: 'none',
          }}
        >
          {chars.map((char, index) => (
            <span
              key={`bottom-${index}`}
              className="mi__wrap inline-block"
              style={{
                overflow: 'hidden',
                display: 'inline-block',
                verticalAlign: 'top',
              }}
            >
              <span
                className="mi__char mi__char--bottom inline-block"
                style={{
                  display: 'inline-block',
                  transform: 'translateY(120%)',
                  opacity: 0,
                  willChange: 'transform, opacity',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            </span>
          ))}
        </span>
      </span>

      {/* Screen reader text */}
      <span className="sr-only">{text}</span>

      {/* Underline indicator */}
      {showUnderline && (
        <span
          ref={underlineRef}
          className={`absolute bottom-[-4px] left-0 h-[1px] ${underlineColor} transition-all ${
            isActive ? 'w-full' : 'w-0 group-hover:w-full'
          }`}
        />
      )}
    </button>
  );
};