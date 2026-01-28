import { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { ArrowLeft } from 'lucide-react';
import { useTranslatedTexts } from '@/hooks/useTranslatedTexts';
import { SeoHead } from '@/app/components/seo/SeoHead';
import { Footer } from '@/app/components/Footer';
import { ScrollToTop } from '@/app/components/ui/ScrollToTop';
import { AnimatedParagraph } from '@/app/components/ui/AnimatedParagraph';

interface TextDetailProps {
  textId: string | null;
}

// Lerp utility
const lerp = (current: number, target: number, factor: number) => {
  return current * (1 - factor) + target * factor;
};

// Calculate distance between two points
const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.hypot(x1 - x2, y1 - y2);
};

export const TextDetail = ({ textId }: TextDetailProps) => {
  const { lang } = useLanguage();
  const { texts: originalTexts } = useWorks();
  const { texts } = useTranslatedTexts(originalTexts);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Find the text by ID
  const text = texts.find(t => t.id === textId);

  // ESC key handler
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.location.hash = '#/text';
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, []);

  // Magnetic Button Effect
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const triggerArea = 100; // Reduced from 200px to 100px
    const interpolationFactor = 0.1; // Slower magnetic pull (changed from 0.15) 
    
    const lerpingData = {
      x: { current: 0, target: 0 },
      y: { current: 0, target: 0 }
    };

    let mousePosition = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.x = e.pageX;
      mousePosition.y = e.pageY;
    };

    let animationFrameId: number;

    const render = () => {
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distanceFromMouseToCenter = calculateDistance(
        mousePosition.x,
        mousePosition.y,
        centerX,
        centerY
      );

      let targetHolder = { x: 0, y: 0 };
      
      if (distanceFromMouseToCenter < triggerArea) {
        targetHolder.x = (mousePosition.x - centerX) * 0.4;
        targetHolder.y = (mousePosition.y - centerY) * 0.4;
      }

      lerpingData.x.target = targetHolder.x;
      lerpingData.y.target = targetHolder.y;

      lerpingData.x.current = lerp(
        lerpingData.x.current,
        lerpingData.x.target,
        interpolationFactor
      );
      lerpingData.y.current = lerp(
        lerpingData.y.current,
        lerpingData.y.target,
        interpolationFactor
      );

      button.style.transform = `translate(${lerpingData.x.current}px, ${lerpingData.y.current}px)`;
      
      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', handleMouseMove);
    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // If text not found, show error
  if (!text) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Text not found</h1>
          <a href="#/text" className="text-sm underline hover:no-underline">
            Back to Texts
          </a>
        </div>
      </div>
    );
  }

  const handleClose = () => {
    window.location.hash = '#/text';
  };

  const title = text.title[lang];
  const content = text.content ? text.content[lang] : (text.summary ? text.summary[lang] : '');

  // Split paragraphs and detect if it's a long-form article
  const paragraphs = content ? content.split('\n\n').filter(p => p.trim()) : [];

  return (
    <div className="min-h-screen bg-background text-foreground relative selection:bg-foreground/10">
      <SeoHead 
        title={text.title.en}
        description={text.summary ? text.summary.en.slice(0, 160) : undefined}
        image={text.image}
      />

      {/* Main Layout Container - Centered Content */}
      <div className="w-full min-h-screen">
        
        {/* CENTER CONTENT */}
        <main className="w-full min-w-0">
          {/* Decorative Background Elements */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-foreground/[0.02] rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-foreground/[0.02] rounded-full blur-3xl" />
          </div>

          <div className="relative pt-32 md:pt-40 px-6 md:px-16 pb-32 max-w-5xl mx-auto">
            {/* ESC Button - Unified with WorkDetail */}
            <div className="mb-16 md:mb-24 flex justify-start">
              <button
                ref={buttonRef}
                onClick={handleClose}
                className="group flex items-center gap-3 px-4 py-2 bg-transparent focus:outline-none"
              >
                <ArrowLeft className="w-3 h-3 transition-transform duration-500 ease-out group-hover:-translate-x-1 opacity-70 group-hover:opacity-100" />
                <span className="text-[10px] tracking-[0.25em] uppercase font-light opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                  ESC
                </span>
              </button>
            </div>

            <article>
              {/* Header */}
              <header className="mb-16 md:mb-24 space-y-8">
                {/* Meta Info */}
                <div className="flex items-center gap-4 text-[11px] tracking-[0.2em] uppercase text-muted-foreground/60 font-light">
                  <span className="hover:text-foreground/80 transition-colors duration-300">
                    {text.category}
                  </span>
                  <span className="w-px h-3 bg-foreground/10" />
                  <span className="hover:text-foreground/80 transition-colors duration-300">
                    {text.year}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-normal leading-[1.2] text-foreground tracking-tight max-w-3xl">
                  {title}
                </h1>

                {/* Featured Image */}
                {text.image && (
                  <div className="relative w-full aspect-[16/9] rounded-sm overflow-hidden bg-foreground/5 mt-12">
                    <img 
                      src={text.image} 
                      alt={title}
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    />
                  </div>
                )}

                {/* Decorative Divider */}
                <div className="relative h-px w-full bg-foreground/10 mt-16" />
              </header>

              {/* Content Body */}
              <div className="max-w-2xl mx-auto space-y-10">
                {paragraphs.map((paragraph, index) => (
                  <AnimatedParagraph 
                    key={index} 
                    className="font-serif text-base md:text-[1.05rem] leading-[1.9] text-foreground/85 text-justify tracking-wide"
                  >
                    {paragraph}
                  </AnimatedParagraph>
                ))}
              </div>

              {/* Bottom Decoration */}
              <div className="mt-32 flex justify-center">
                <div className="w-px h-24 bg-gradient-to-b from-foreground/20 to-transparent" />
              </div>
            </article>
          </div>

          {/* Footer */}
          <div className="border-t border-foreground/10 bg-background px-6 md:px-16 py-16">
            <Footer />
          </div>
        </main>
      </div>

      {/* Scroll to Top */}
      <ScrollToTop />
    </div>
  );
};