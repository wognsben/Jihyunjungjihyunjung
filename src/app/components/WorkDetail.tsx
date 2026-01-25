import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { worksData } from '@/data/works';
import { textData } from '@/data/texts';
import { ArrowLeft } from 'lucide-react';
import { YearNavigation } from './YearNavigation';
import { PremiumImage } from '@/app/components/ui/PremiumImage';
import { SeoHead } from '@/app/components/seo/SeoHead';

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

    const triggerArea = 200; 
    const interpolationFactor = 0.15; 
    
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
        setIsMagnetic(true);
        targetHolder.x = (mousePosition.x - centerX) * 0.4;
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

  const getYearCaption = () => {
    switch (lang) {
      case 'ko': return work.yearCaption_ko;
      case 'jp': return work.yearCaption_jp;
      default: return work.yearCaption_en;
    }
  };

  const title = getTitle();
  const medium = getMedium();
  const description = getDescription();
  const commission = getCommission();
  const credits = getCredits();
  const yearCaption = getYearCaption();

  return (
    <div className="min-h-screen bg-background">
      <SeoHead 
        title={work.title_en}
        description={work.description_en ? work.description_en.slice(0, 160) : undefined}
        image={work.thumbnail}
      />

      {/* Content */}
      <div className="pt-32 md:pt-40 px-6 md:px-16 pb-32">
        {/* Premium ESC Button - Left Top Floating */}
        <div className="mb-16 md:mb-24">
          <button
            ref={buttonRef}
            onClick={handleClose}
            className="group flex items-center gap-2.5 px-4 py-2 bg-transparent text-foreground"
          >
            <ArrowLeft className="w-4 h-4 transition-all duration-300 group-hover:-translate-x-1 opacity-60 group-hover:opacity-100" />
            <span className="text-xs md:text-sm tracking-[0.2em] uppercase font-light opacity-60 group-hover:opacity-100">
              ESC
            </span>
          </button>
        </div>

        <div className="max-w-[1600px] mx-auto">
          
          {/* 1. Header Info Section (Text First) */}
          <div className="mb-32 md:mb-48">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-16 lg:gap-x-12">
              
              {/* Left: Description (Wide) */}
              <div className="lg:col-span-7">
                {description && (
                  <div className="space-y-6">
                    {description.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="font-serif text-lg md:text-2xl leading-[1.6] text-foreground font-normal tracking-tight">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Meta Info (Compact List) */}
              <div className="lg:col-span-4 lg:col-start-9">
                <div className="grid grid-cols-2 gap-y-10 gap-x-8">
                  {/* Title Block */}
                  <div className="col-span-2 border-t border-black/10 dark:border-white/10 pt-4">
                    <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Project</span>
                    <h1 className="text-base md:text-lg font-bold text-foreground leading-tight">
                      {title}
                    </h1>
                  </div>

                  {/* Year */}
                  <div className="border-t border-black/10 dark:border-white/10 pt-4 group/year relative">
                    <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Year</span>
                    <span className="block text-sm font-bold text-foreground cursor-help">{work.year}</span>
                    
                    {/* Minimal Year Caption Tooltip */}
                    {yearCaption && (
                      <div className="absolute left-0 -bottom-8 pointer-events-none opacity-0 translate-y-2 group-hover/year:opacity-100 group-hover/year:translate-y-0 transition-all duration-300 ease-out">
                        <span className="text-xs text-muted-foreground font-medium tracking-tight whitespace-nowrap">
                          {yearCaption}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Medium / Type */}
                  {medium && (
                    <div className="border-t border-black/10 dark:border-white/10 pt-4">
                      <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Discipline</span>
                      <span className="block text-sm font-bold text-foreground">{medium}</span>
                    </div>
                  )}

                  {/* Commission / Client */}
                  {commission && (
                    <div className="border-t border-black/10 dark:border-white/10 pt-4">
                      <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Client</span>
                      <span className="block text-sm font-bold text-foreground">{commission}</span>
                    </div>
                  )}

                  {/* Credits */}
                  {credits && (
                    <div className="col-span-2 border-t border-black/10 dark:border-white/10 pt-4">
                      <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Credits</span>
                      <span className="block text-sm font-bold text-foreground">{credits}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* 2. Gallery Images (Rhythmic Grid) */}
          <div className="space-y-24 md:space-y-32 mb-32">
            {work.galleryImages.map((image, index) => {
              // Layout Pattern Logic
              let layoutClass = "w-full"; 
              let containerClass = "w-full";
              
              const patternIndex = index % 3;

              if (patternIndex === 1) {
                // Left aligned, 70% width
                containerClass = "flex justify-start";
                layoutClass = "w-full md:w-[80%] aspect-[4/3]";
              } else if (patternIndex === 2) {
                // Right aligned, 60% width
                containerClass = "flex justify-end";
                layoutClass = "w-full md:w-[60%] aspect-[3/4]";
              } else {
                // Full width (index 0 or 3)
                layoutClass = "w-full aspect-[16/9]";
              }

              return (
                <div key={index} className={containerClass}>
                  <div className={`relative overflow-hidden group ${layoutClass}`}>
                    <PremiumImage
                      src={image}
                      alt={`${title} - View ${index + 1}`}
                      className="w-full h-full object-cover object-center transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
                      containerClassName="w-full h-full"
                    />
                    
                    {/* Floating Architect's Label (Bottom Right for Gallery) */}
                    <div className="absolute right-6 bottom-6 pointer-events-none z-20">
                       <div 
                         className="
                           flex items-center gap-3 px-4 py-2 
                           bg-black/30 backdrop-blur-md border border-white/10 rounded-full 
                           opacity-0 translate-y-4
                           group-hover:opacity-100 group-hover:translate-y-0
                           transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                         "
                       >
                         <span className="text-white/90 font-mono text-xs tracking-widest uppercase">
                           View {String(index + 1).padStart(2, '0')}
                         </span>
                         <span className="w-px h-3 bg-white/20" aria-hidden="true" />
                         <span className="text-white/60 font-mono text-[10px] tracking-wider uppercase">
                           {medium}
                         </span>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Related Texts Section (Refined) */}
          {work.relatedArticles && work.relatedArticles.length > 0 && (
            <div className="mb-32 pt-24 border-t border-black/10 dark:border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-baseline mb-16">
                <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium mb-4 md:mb-0">
                  Related Texts
                </h2>
                <div className="hidden md:block w-full h-px bg-black/5 dark:bg-white/5 flex-1 ml-8" />
                {/* Subtitle removed for cleaner look */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                {/* Left: Lead Article (Featured) */}
                <div className="md:col-span-5 lg:col-span-4">
                  <div className="sticky top-40">
                    {(() => {
                        const article = work.relatedArticles[0];
                        const textItem = textData.find(t => t.id === article.id);
                        const title = textItem ? textItem.title[lang] : article.title;
                        const author = textItem ? textItem.author[lang] : article.author;
                        const summary = textItem?.summary ? textItem.summary[lang] : article.summary;
                        const category = textItem ? textItem.category : 'Article';
                        
                        return (
                           <>
                            <span className="block text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-2">
                              {category}
                            </span>
                            <h3 className="text-3xl md:text-4xl font-serif font-normal leading-tight mb-4 text-foreground">
                              {title}
                            </h3>
                            <p className="text-sm font-medium text-muted-foreground mb-12">
                              {lang === 'ko' ? '저자 ' : lang === 'jp' ? '著者 ' : 'by '}{author}
                            </p>
                            
                            <div className="space-y-6">
                              <span className="text-xs uppercase tracking-widest font-semibold text-foreground/80 border-b border-foreground/20 pb-1 inline-block">
                                {lang === 'ko' ? '읽기' : lang === 'jp' ? '読む' : 'Read'}
                              </span>
                              <p className="text-lg md:text-xl leading-relaxed text-foreground font-serif text-pretty">
                                {summary}
                              </p>
                            </div>
                           </>
                        );
                    })()}
                  </div>
                </div>

                {/* Right: Article List (Grid) */}
                <div className="md:col-span-7 lg:col-span-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                    {work.relatedArticles.map((article) => {
                       const textItem = textData.find(t => t.id === article.id);
                       const title = textItem ? textItem.title[lang] : article.title;
                       const author = textItem ? textItem.author[lang] : article.author;
                       const category = textItem ? textItem.category : 'Article';
                       
                       // Use thumbnail from work data first (as it might be specific to this view), fallback to textData
                       const image = article.thumbnail || (textItem ? textItem.image : '');

                       return (
                          <article key={article.id} className="group cursor-pointer">
                            {/* Thumbnail */}
                            <div className="aspect-[3/4] overflow-hidden bg-muted mb-4">
                              {image ? (
                                <PremiumImage
                                  src={image}
                                  alt={title}
                                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                  containerClassName="w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                  <span className="text-muted-foreground/30 font-serif italic">No Image</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Meta */}
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold">
                                {category}
                              </span>
                              <h4 className="text-base font-bold leading-snug group-hover:underline decoration-1 underline-offset-4 decoration-muted-foreground/50 transition-all">
                                {title}
                              </h4>
                              <p className="text-xs text-muted-foreground font-medium">
                                {lang === 'ko' ? '저자 ' : lang === 'jp' ? '著者 ' : 'by '}{author}
                              </p>
                            </div>
                          </article>
                       );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Year Navigation - Vertical List */}
          <div className="mt-32 pt-12 border-t border-border">
            <YearNavigation allWorks={worksData} currentYear={work.year} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="px-6 md:px-16 py-8">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Jihyun Jung. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
