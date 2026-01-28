import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { ArrowLeft } from 'lucide-react';
import gsap from 'gsap';
import SplitType from 'split-type';

// Minimal Blur Reveal Component (Refined for Silent Luxury)
const BlurReveal = ({ children, className, delay = 0 }: { children: string, className?: string, delay?: number }) => {
  const elementRef = useRef<HTMLParagraphElement>(null);
  
  useEffect(() => {
    if (!elementRef.current) return;
    
    const split = new SplitType(elementRef.current, { types: 'words' });
    const words = split.words;
    
    if (!words) return;

    gsap.set(words, { 
      opacity: 0, 
      filter: 'blur(10px)', 
      y: 10, 
      willChange: 'filter, opacity, transform'
    });

    const ctx = gsap.context(() => {
      gsap.to(words, {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 1.2, // Slower, more elegant
        stagger: 0.015, 
        ease: 'power2.out', 
        delay: delay
      });
    }, elementRef);

    return () => {
      ctx.revert();
      split.revert();
    };
  }, [children, delay]); 

  return <p ref={elementRef} className={className}>{children}</p>;
};

import { YearNavigation } from './YearNavigation';
import { GalleryItem } from '@/app/components/work/GalleryItem';
import { SeoHead } from '@/app/components/seo/SeoHead';
import { ScrollToTop } from '@/app/components/ui/ScrollToTop';

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
  const { works, texts } = useWorks();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMagnetic, setIsMagnetic] = useState(false);
  
  // Floating Image Cursor Logic (Calm & Precise)
  const [hoveredArticleId, setHoveredArticleId] = useState<string | null>(null);
  const [hoveredArticleImg, setHoveredArticleImg] = useState<string | null>(null);
  const cursorImgRef = useRef<HTMLDivElement>(null);
  
  // Mouse position
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!cursorImgRef.current || !hoveredArticleImg) return;
      
      const { clientX, clientY } = e;
      const x = clientX + 40; 
      const y = clientY + 40;

      cursorImgRef.current.animate({
        transform: `translate(${x}px, ${y}px)`
      }, { duration: 800, fill: 'forwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }); // Slower easing
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    return () => window.removeEventListener('mousemove', handleWindowMouseMove);
  }, [hoveredArticleImg]);
  
  const work = works.find(w => w.id === workId);

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

    const triggerArea = 100; // Reduced from 200px to 100px
    const interpolationFactor = 0.1; // Slower magnetic pull
    
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
        targetHolder.x = (mousePosition.x - centerX) * 0.3;
        targetHolder.y = (mousePosition.y - centerY) * 0.3;
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

  if (!work) return null;

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

  const getDescription = () => {
    switch (lang) {
      case 'ko': return work.description_ko;
      case 'jp': return work.description_jp;
      default: return work.description_en;
    }
  };

  const getYearCaption = () => {
    switch (lang) {
      case 'ko': return work.yearCaption_ko;
      case 'jp': return work.yearCaption_jp;
      default: return work.yearCaption_en;
    }
  };

  const getVimeoId = (url: string) => {
    const match = url.match(/(?:vimeo.com\/|video\/)(\d+)/);
    return match ? match[1] : null;
  };

  const title = getTitle();
  const description = getDescription();
  const yearCaption = getYearCaption();
  
  const hasYoutube = !!work.youtubeUrl;
  const hasVimeo = !!work.vimeoUrl;

  return (
    <div className="min-h-screen bg-background selection:bg-black/10 selection:text-black dark:selection:bg-white/20 dark:selection:text-white">
      <SeoHead 
        title={work.title_en}
        description={work.description_en ? work.description_en.slice(0, 160) : undefined}
        image={work.thumbnail}
      />

      {/* Content Container */}
      <div className="pt-32 md:pt-40 px-6 md:px-12 pb-32 max-w-[1800px] mx-auto">
        
        {/* ESC Button - Fixed Position or Sticky if preferred, but keeping it in flow for now */}
        <div className="fixed top-24 md:top-32 left-6 md:left-16 z-40 mix-blend-difference text-white dark:text-white">
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

        {/* 1. Header Spec Sheet (The "Museum Caption" Style) */}
        {/* Minimal borders, tiny text, wide spacing */}
        <div className="mb-40 md:mb-64 animate-in fade-in duration-1000 slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-8 border-t border-black/5 dark:border-white/10 pt-6">
            
            {/* Column 1: Title (Serif, Elegant) */}
            <div className="md:col-span-4 lg:col-span-3">
              <span className="block text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 font-mono">
                Project Title
              </span>
              <h1 className="text-2xl md:text-3xl font-serif font-light text-foreground/90 leading-tight">
                {title}
              </h1>
            </div>

            {/* Column 2: Year (Mono) */}
            <div className="md:col-span-2 lg:col-span-2 md:col-start-6 lg:col-start-5">
              <span className="block text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 font-mono">
                Year
              </span>
              <span className="block text-sm font-mono text-foreground/70">
                {work.year}
              </span>
              {yearCaption && (
                 <span className="block text-[10px] text-muted-foreground/50 mt-1 font-serif italic">
                   {yearCaption}
                 </span>
              )}
            </div>

            {/* Column 3: Medium / Category */}
            <div className="md:col-span-3 lg:col-span-2">
              <span className="block text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 font-mono">
                Category
              </span>
              <span className="block text-sm font-mono text-foreground/70">
                {work.category}
              </span>
            </div>

             {/* Column 4: Client (If exists) or Empty */}
             <div className="md:col-span-2 lg:col-span-2">
              {work.client && (
                <>
                  <span className="block text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 font-mono">
                    Client
                  </span>
                  <span className="block text-sm font-mono text-foreground/70">
                    {work.client}
                  </span>
                </>
              )}
            </div>

          </div>

          {/* Description - Offset & Indented */}
          {description && (
            <div className="mt-24 md:mt-32 grid grid-cols-1 md:grid-cols-12">
               <div className="md:col-span-6 md:col-start-6 lg:col-span-5 lg:col-start-7 space-y-8">
                 {description.split('\n\n').map((paragraph, index) => (
                    <BlurReveal 
                      key={index} 
                      className={`
                        font-serif text-foreground/80
                        ${index === 0 
                          ? 'text-lg md:text-xl leading-[1.6] opacity-90' 
                          : 'text-sm md:text-base leading-[1.8] opacity-70'
                        }
                      `}
                      delay={0.2 + (index * 0.1)}
                    >
                      {paragraph}
                    </BlurReveal>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* 2. Gallery Images (Deep Breath Layout) */}
        {/* Significantly increased vertical spacing for a "Walking through a gallery" feel */}
        <div className="space-y-40 md:space-y-64 mb-40 md:mb-64">
          
          {/* Video Section */}
          {(hasYoutube || hasVimeo) && (
            <div className="w-full max-w-5xl mx-auto mb-40">
              {hasYoutube && work.youtubeUrl && (
                <div className="relative w-full aspect-video bg-black/5">
                  <iframe
                    src={work.youtubeUrl}
                    title="Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full opacity-90 hover:opacity-100 transition-opacity duration-500"
                  />
                </div>
              )}
              {hasVimeo && work.vimeoUrl && (() => {
                  const vimeoId = getVimeoId(work.vimeoUrl);
                  return vimeoId ? (
                    <div className="relative w-full aspect-video bg-black/5">
                      <iframe
                        src={`https://player.vimeo.com/video/${vimeoId}?color=ffffff&title=0&byline=0&portrait=0`}
                        title="Vimeo"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full opacity-90 hover:opacity-100 transition-opacity duration-500"
                      />
                    </div>
                  ) : null;
                })()}
            </div>
          )}

          {work.galleryImages.map((image, index) => {
            // More dramatic layout logic
            // 0: Full width (Central)
            // 1: Left aligned, medium
            // 2: Right aligned, small
            // 3: Right aligned, medium
            // 4: Left aligned, small
            const patternIndex = index % 5;
            let layoutClass = "w-full";
            let containerClass = "flex justify-center";
            
            if (patternIndex === 0) {
              layoutClass = "w-full max-w-[90vw]";
            } else if (patternIndex === 1) {
              containerClass = "flex justify-start md:pl-[10%]";
              layoutClass = "w-full md:w-[65%]";
            } else if (patternIndex === 2) {
              containerClass = "flex justify-end md:pr-[15%]";
              layoutClass = "w-full md:w-[40%]";
            } else if (patternIndex === 3) {
              containerClass = "flex justify-end";
              layoutClass = "w-full md:w-[75%]";
            } else if (patternIndex === 4) {
              containerClass = "flex justify-start md:pl-[5%]";
              layoutClass = "w-full md:w-[50%]";
            }

            return (
              <GalleryItem
                key={index}
                index={index}
                image={image}
                title={title}
                layoutClass={layoutClass}
                containerClass={containerClass}
                // Pass a flag to GalleryItem if needed to make it minimal (no heavy shadows/borders)
              />
            );
          })}
        </div>

        {/* 3. Related Texts (The Archive) */}
        {/* Extremely minimal list, barely there */}
        {work.relatedArticles && work.relatedArticles.length > 0 && (
          <div className="mb-40 pt-12 border-t border-black/5 dark:border-white/5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Sticky Label */}
              <div className="md:col-span-4 lg:col-span-3">
                <div className="sticky top-40">
                  <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-mono mb-6">
                    Related Texts
                  </h2>
                  {/* Summary Display */}
                  <div className="hidden md:block min-h-[100px]">
                    {hoveredArticleId && (
                      <BlurReveal key={hoveredArticleId} className="text-sm font-serif leading-relaxed text-foreground/80 italic">
                         {(() => {
                            const article = work.relatedArticles.find(a => a.id === hoveredArticleId);
                            const textItem = texts.find(t => t.id === article?.id);
                            const summary = textItem?.summary ? textItem.summary[lang] : article?.summary;
                            return summary ? summary.slice(0, 120) + "..." : "";
                         })()}
                      </BlurReveal>
                    )}
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="md:col-span-8 lg:col-span-9 relative">
                 {/* Floating Preview Image */}
                 <div 
                    ref={cursorImgRef}
                    className={`
                      fixed top-0 left-0 z-50 pointer-events-none
                      w-[240px] aspect-[4/3] overflow-hidden bg-background
                      transition-opacity duration-300 ease-out border border-black/10
                      ${hoveredArticleImg ? 'opacity-100' : 'opacity-0'}
                    `}
                  >
                     {hoveredArticleImg && (
                       <img 
                         src={hoveredArticleImg} 
                         alt="Preview" 
                         className="w-full h-full object-cover grayscale contrast-125" 
                       />
                     )}
                  </div>

                  <div className="flex flex-col border-t border-black/10 dark:border-white/10">
                    {work.relatedArticles.map((article, index) => {
                       const textItem = texts.find(t => t.id === article.id);
                       const displayTitle = textItem ? textItem.title[lang] : article.title;
                       const isHovered = hoveredArticleId === article.id;
                       
                       return (
                          <a
                            key={article.id}
                            href={`#/text/${article.id}`}
                            className="group block relative"
                            onMouseEnter={() => {
                              setHoveredArticleId(article.id);
                              if (textItem?.image) setHoveredArticleImg(textItem.image);
                            }}
                            onMouseLeave={() => {
                              setHoveredArticleId(null);
                              setHoveredArticleImg(null);
                            }}
                          >
                            <div className={`
                              flex items-baseline py-8 border-b border-black/10 dark:border-white/10
                              transition-all duration-300
                              ${isHovered ? 'pl-6 opacity-100' : 'pl-0 opacity-80'}
                            `}>
                              <span className="w-16 text-[10px] font-mono text-muted-foreground/60">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              <h3 className="text-xl md:text-2xl font-serif font-light tracking-tight text-foreground/90">
                                {displayTitle}
                              </h3>
                            </div>
                          </a>
                       );
                    })}
                  </div>
              </div>

            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-40 pt-12 border-t border-black/5 dark:border-white/5">
          <YearNavigation allWorks={works} currentYear={work.year} />
        </div>

      </div>
      
      <ScrollToTop />
    </div>
  );
};