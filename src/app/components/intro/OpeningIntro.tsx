import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface OpeningIntroProps {
  onComplete: () => void;
  imageSrc: string;
}

export const OpeningIntro = ({ onComplete, imageSrc }: OpeningIntroProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const scanlineRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !imageContainerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          onComplete();
        }
      });

      // --- SETUP ---
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      
      // Asymmetric initial clip - starts from top-left corner for experimental feel
      const w = Math.min(vw * 0.5, 200);
      const h = w * 1.6; 
      
      const insetTop = vh * 0.15;
      const insetLeft = vw * 0.1;
      const insetBottom = vh - insetTop - h;
      const insetRight = vw - insetLeft - w;

      // Initial States - Pure, no effects
      gsap.set(imageContainerRef.current, {
        clipPath: `inset(${insetTop}px ${insetRight}px ${insetBottom}px ${insetLeft}px)`,
        scale: 1,
      });
      
      gsap.set(textRef.current, { opacity: 1 });
      gsap.set(counterRef.current, { opacity: 1 });
      gsap.set(scanlineRef.current, { opacity: 0 });

      // --- PHASE 1: Stillness (0.7s) ---
      // Extended silence for maximum tension
      tl.to({}, { duration: 0.7 });

      // --- PHASE 2: Counter with Glitch (1.2s) ---
      const counterObj = { value: 0 };
      tl.to(counterObj, {
        value: 100,
        duration: 1.2,
        ease: "power1.inOut",
        onUpdate: () => {
          const newCount = Math.floor(counterObj.value);
          setCount(newCount);
          
          // Micro glitch on certain numbers (experimental)
          if (newCount % 23 === 0 && counterRef.current) {
            gsap.to(counterRef.current, {
              x: Math.random() * 2 - 1,
              duration: 0.05,
              yoyo: true,
              repeat: 1
            });
          }
        }
      });

      // --- PHASE 3: Freeze at 100 (0.3s) ---
      // Time stands still - cynical pause
      tl.to({}, { duration: 0.3 });

      // --- PHASE 4: Pre-Expansion Tension (0.15s) ---
      // Brief flash of scanline + RGB shift
      tl.to(scanlineRef.current, {
        opacity: 0.4,
        duration: 0.1
      }, "-=0.15");
      
      // Text flickers out with RGB distortion
      tl.to(textRef.current, {
        opacity: 0,
        filter: "blur(2px)",
        x: -2,
        duration: 0.2,
        ease: "power2.in"
      }, "-=0.1");

      tl.to(counterRef.current, {
        opacity: 0,
        x: 3,
        filter: "blur(1px)",
        duration: 0.2,
        ease: "power2.in"
      }, "-=0.2");

      // --- PHASE 5: Violent Expansion (0.8s) ---
      // Faster, sharper, more aggressive
      tl.to(imageContainerRef.current, {
        clipPath: "inset(0px 0px 0px 0px)",
        duration: 0.8,
        ease: "expo.in", // Extremely sharp acceleration
      });

      // Scanline intensifies during expansion
      tl.to(scanlineRef.current, {
        opacity: 0.2,
        duration: 0.4
      }, "-=0.8");

      // --- PHASE 6: Final Dissolve (0.6s) ---
      tl.to(containerRef.current, {
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });

      tl.set(containerRef.current, { display: "none" });

    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black pointer-events-none flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Image Container */}
      <div 
        ref={imageContainerRef}
        className="absolute inset-0 w-full h-full bg-black"
        style={{ willChange: 'clip-path' }}
      >
        <ImageWithFallback
          src={imageSrc}
          alt="Opening"
          className="w-full h-full object-cover"
        />
        
        {/* Vignette - Premium depth */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)'
          }}
        />

        {/* Typography - Inside clipPath area */}
        <div 
          ref={textRef}
          className="absolute top-8 left-8 md:top-12 md:left-12 z-10"
        >
          <h1 
            className="font-light text-[9px] md:text-[11px] tracking-[0.8em] uppercase text-white/90"
            style={{ 
              letterSpacing: '0.8em',
              textShadow: '0 0 20px rgba(0,0,0,0.5)'
            }}
          >
            jihyunjung
          </h1>
        </div>
      </div>

      {/* Scanline Effect - Analog film feel */}
      <div 
        ref={scanlineRef}
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.03) 0px,
            rgba(255, 255, 255, 0.03) 1px,
            transparent 1px,
            transparent 2px
          )`,
          opacity: 0,
        }}
      />

      {/* Counter - Extreme precision, bottom-right */}
      <div 
        ref={counterRef}
        className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-30 mix-blend-difference text-white flex flex-col items-end"
      >
        <div className="h-[0.5px] w-8 bg-white/30 mb-1.5" />
        <span 
          className="font-mono text-[10px] md:text-[11px] tracking-[0.4em] tabular-nums font-light"
          style={{
            textShadow: '0 0 10px rgba(255,255,255,0.3)',
          }}
        >
          {count.toString().padStart(3, '0')}
        </span>
      </div>
      
      {/* Refined Grain Texture */}
      <div 
        className="absolute inset-0 z-40 pointer-events-none opacity-[0.015] mix-blend-overlay"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }} 
      />
    </div>
  );
};