import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Work, worksData } from '@/data/works';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { ArrowLeft, X } from 'lucide-react';
import { YearNavigation } from './YearNavigation';

interface WorkDetailProps {
  workId: string | null;
}

// Lerp utility
const lerp = (current: number, target: number, factor: number) => {
  return current * (1 - factor) + target * factor;
};

// Calculate distance between two points
const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.hypot(x1 - x2, y1 - y2);
};

export const WorkDetail = ({ workId }: WorkDetailProps) => {
  const { lang } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMagnetic, setIsMagnetic] = useState(false);

  // Find the work by ID
  const work = worksData.find(w => w.id === workId);

  // ESC key handler
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.location.hash = '#/work';
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, []);

  // Magnetic Button Effect
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const triggerArea = 200; // Increased for smoother transition
    const interpolationFactor = 0.15; // Lower = smoother animation
    
    const lerpingData = {
      x: { current: 0, target: 0 },
      y: { current: 0, target: 0 }
    };

    let mousePosition = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.x = e.pageX;
      mousePosition.y = e.pageY;
    };

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
        setIsMagnetic(true);
        targetHolder.x = (mousePosition.x - centerX) * 0.4; // Increased magnetic pull
        targetHolder.y = (mousePosition.y - centerY) * 0.4;
      } else {
        setIsMagnetic(false);
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

    let animationFrameId: number;

    window.addEventListener('mousemove', handleMouseMove);
    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // If work not found, show error
  if (!work) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Work not found</h1>
          <a href="#/work" className="text-sm underline hover:no-underline">
            Back to Works
          </a>
        </div>
      </div>
    );
  }

  const handleClose = () => {
    window.location.hash = '#/work';
  };

  const getTitle = () => {
    switch (lang) {
      case 'ko': return work.title_ko;
      case 'jp': return work.title_jp;
      default: return work.title_en;
    }
  };

  const getMedium = () => {
    switch (lang) {
      case 'ko': return work.medium_ko;
      case 'jp': return work.medium_jp;
      default: return work.medium_en;
    }
  };

  const getDescription = () => {
    switch (lang) {
      case 'ko': return work.description_ko;
      case 'jp': return work.description_jp;
      default: return work.description_en;
    }
  };

  const getCommission = () => {
    switch (lang) {
      case 'ko': return work.commission_ko;
      case 'jp': return work.commission_jp;
      default: return work.commission_en;
    }
  };

  const getCredits = () => {
    switch (lang) {
      case 'ko': return work.credits_ko;
      case 'jp': return work.credits_jp;
      default: return work.credits_en;
    }
  };

  const getInfo = () => {
    switch (lang) {
      case 'ko': return work.oneLineInfo_ko;
      case 'jp': return work.oneLineInfo_jp;
      default: return work.oneLineInfo_en;
    }
  };

  const getCloseLabel = () => {
    switch (lang) {
      case 'ko': return '닫기';
      case 'jp': return '閉じる';
      default: return 'Close';
    }
  };

  const title = getTitle();
  const medium = getMedium();
  const description = getDescription();
  const commission = getCommission();
  const credits = getCredits();
  const info = getInfo();
  const closeLabel = getCloseLabel();

  return (
    <div className="min-h-screen bg-background">
      {/* Content */}
      <div className="pt-32 md:pt-40 px-6 md:px-16 pb-32">
        {/* Premium ESC Button - Left Top Floating */}
        <div className="mb-12">
          <button
            ref={buttonRef}
            onClick={handleClose}
            className="group flex items-center gap-2.5 px-4 py-2 rounded-full bg-transparent text-foreground"
          >
            <ArrowLeft className="w-4 h-4 transition-all duration-300 group-hover:-translate-x-1 opacity-60 group-hover:opacity-100" />
            <span className="text-xs md:text-sm tracking-[0.2em] uppercase font-light opacity-60 group-hover:opacity-100">
              ESC
            </span>
          </button>
        </div>

        <div className="max-w-[1200px] mx-auto">
          {/* Gallery Images */}
          <div className="space-y-8 mb-16">
            {work.galleryImages.map((image, index) => (
              <div
                key={index}
                className="relative w-full overflow-hidden bg-muted rounded-sm"
                style={{ aspectRatio: '16 / 9' }}
              >
                <ImageWithFallback
                  src={image}
                  alt={`${title} - Image ${index + 1}`}
                  className="w-full h-full object-cover object-center"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>

          {/* Work Details */}
          <div className="max-w-[720px]">
            {/* Title, Year */}
            <div className="mb-10">
              <h1 className="text-xl md:text-2xl font-serif font-medium leading-snug tracking-tight">
                {title}
                <span className="block text-lg md:text-xl font-sans text-muted-foreground mt-2 font-light">
                  {work.year}{medium && `, ${medium}`}
                </span>
              </h1>
            </div>

            {/* Description */}
            {description && (
              <div className="mb-12 space-y-6">
                {description.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="font-serif text-sm md:text-base leading-[1.9] text-foreground/85 font-light text-justify">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {/* Commission & Credits */}
            <div className="space-y-1 text-xs leading-[1.6] text-muted-foreground/60 font-light tracking-wide">
              {commission && <p className="block">{commission}</p>}
              {credits && <p className="block">{credits}</p>}
            </div>

            {/* Year Navigation - Vertical List */}
            <div className="mt-20 pt-12 border-t border-border">
              <YearNavigation allWorks={worksData} currentYear={work.year} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="px-6 md:px-16 py-8">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Jihyeong Jung. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};