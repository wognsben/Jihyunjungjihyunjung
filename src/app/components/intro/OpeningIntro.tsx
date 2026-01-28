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
  const [count, setCount] = useState(0);

  // Intro Logic
  useEffect(() => {
    if (!containerRef.current || !imageContainerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          onComplete(); 
        }
      });

      // --- SETUP ---
      // Screen dimensions for responsive clip-path
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      
      // Target aspect ratio 3:4 or 16:9? Let's stick to the previous 3:4 portrait-ish feel or adapt to image.
      // Let's use a dynamic size based on viewport to feel "cinematic".
      // A vertical slice feels more "modern art gallery".
      const w = Math.min(vw * 0.8, 300); 
      const h = w * 1.4; // 5:7 ratio roughly
      
      const insetY = (vh - h) / 2;
      const insetX = (vw - w) / 2;

      // Initial States
      gsap.set(imageContainerRef.current, {
        clipPath: `inset(${insetY}px ${insetX}px ${insetY}px ${insetX}px)`,
        scale: 1.3, // Start zoomed in
        filter: "grayscale(100%) blur(5px)", // Start B&W and blurred
      });
      
      gsap.set(".intro-text-line", { y: 20, opacity: 0 });

      // --- ANIMATION SEQUENCE ---

      // 1. Text Reveal (Silent Luxury Vibe)
      tl.to(".intro-text-line", {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
      });

      // 2. Counter Animation (0 -> 100)
      // Runs concurrently with text but finishes slightly later
      const counterObj = { value: 0 };
      tl.to(counterObj, {
        value: 100,
        duration: 2.2, 
        ease: "expo.inOut",
        onUpdate: () => {
          setCount(Math.floor(counterObj.value));
        }
      }, "<"); // start with text

      // 3. Text & Counter Fade Out
      tl.to([textRef.current, counterRef.current], {
        opacity: 0,
        y: -20,
        filter: "blur(5px)",
        duration: 0.6,
        ease: "power2.in"
      }, "-=0.5");

      // 4. The Expansion (Hero Reveal)
      // Sharp, precise movement.
      tl.to(imageContainerRef.current, {
        clipPath: "inset(0px 0px 0px 0px)",
        scale: 1, // Zoom out to normal
        filter: "grayscale(0%) blur(0px)", // Restore color and sharpness
        duration: 1.6,
        ease: "expo.inOut", 
      });

      // 5. Final Fade Out to App
      // Instead of simple opacity fade, let's keep the image as background 
      // and fade the overlay container, effectively revealing the app UI on top if possible.
      // But since App structure is below, we just fade out this overlay.
      tl.to(containerRef.current, {
        opacity: 0,
        duration: 1.0,
        ease: "power2.inOut",
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
      {/* 
        The Image Container:
        Revealed via clip-path.
      */}
      <div 
        ref={imageContainerRef}
        className="absolute inset-0 w-full h-full bg-neutral-900"
        style={{ willChange: 'clip-path, transform, filter' }}
      >
        <ImageWithFallback
          src={imageSrc}
          alt="Opening Intro"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for text readability during initial phase */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Typography Overlay */}
      <div 
        ref={textRef}
        className="absolute z-20 flex flex-col items-center justify-center space-y-2 mix-blend-difference text-white"
      >
        <span className="intro-text-line font-light tracking-[0.3em] text-xs md:text-sm uppercase text-neutral-400">
          The Expansion
        </span>
        <h1 className="intro-text-line font-serif text-3xl md:text-5xl italic tracking-tighter opacity-90">
          Silent Luxury
        </h1>
      </div>

      {/* The Counter */}
      <div 
        ref={counterRef}
        className="absolute bottom-10 right-10 z-20 mix-blend-difference text-white flex flex-col items-end"
      >
        <div className="h-px w-12 bg-white/50 mb-2" />
        <span className="font-mono text-xs md:text-sm tracking-widest tabular-nums">
          {count.toString().padStart(3, '0')}
        </span>
      </div>
      
      {/* Grain Overlay (Optional for texture) */}
      <div className="absolute inset-0 z-30 pointer-events-none opacity-[0.03] mix-blend-overlay"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />
    </div>
  );
};
