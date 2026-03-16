import React, { useRef, useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import gsap from 'gsap';
import SplitType from 'split-type';
import { motion, AnimatePresence } from 'motion/react';
import { Resizable } from 're-resizable';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { parseMultilingualCaption } from '@/services/wp-api';
import { SeoHead } from '@/app/components/seo/SeoHead';
import { ScrollToTop } from '@/app/components/ui/ScrollToTop';
import { InfiniteWorkGrid } from '@/app/components/InfiniteWorkGrid';
import { TextDetail } from '@/app/components/TextDetail';

// Minimal Blur Reveal Component
const BlurReveal = ({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => {
  return <p className={className}>{children}</p>;
};

interface WorkDetailProps {
  workId: string | null;
}

// Helper: Video Player Component
const VideoPlayer = ({ url }: { url: string }) => {
  const getVimeoId = (link: string) => {
    const match = link.match(/(?:vimeo.com\/|video\/)(\d+)/);
    return match ? match[1] : null;
  };

  const isYoutube = url.includes('youtube') || url.includes('youtu.be');
  const isVimeo = url.includes('vimeo');

  if (isYoutube) {
    return (
      <div className="relative w-full aspect-video bg-black/5 rounded-sm overflow-hidden">
        <iframe
          src={url.replace('watch?v=', 'embed/')}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full opacity-90 hover:opacity-100 transition-opacity duration-500"
        />
      </div>
    );
  }

  if (isVimeo) {
    const vimeoId = getVimeoId(url);
    if (!vimeoId) return null;
    return (
      <div className="relative w-full aspect-video bg-black/5 rounded-sm overflow-hidden">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?color=ffffff&title=0&byline=0&portrait=0`}
          title="Vimeo"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full opacity-90 hover:opacity-100 transition-opacity duration-500"
        />
      </div>
    );
  }

  return null;
};

const cleanText = (text: string) => {
  if (!text) return "";
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, '&');
};

export const WorkDetail = ({ workId }: WorkDetailProps) => {
  const { lang } = useLanguage();
  const { works, texts, translateWorksByIds, currentLang } = useWorks();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
  
  // Simple Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Floating Text Window State
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [hoveredArticleId, setHoveredArticleId] = useState<string | null>(null);
  const [hoveredArticleImg, setHoveredArticleImg] = useState<string | null>(null);
  const cursorImgRef = useRef<HTMLDivElement>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hide global header and lock body scroll when popup is open
  useEffect(() => {
    if (selectedArticleId) {
      // Hide header
      const header = document.querySelector('header');
      if (header) {
        (header as HTMLElement).style.display = 'none';
      }
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevent layout shift
    } else {
      // Show header
      const header = document.querySelector('header');
      if (header) {
        (header as HTMLElement).style.display = '';
      }
      
      // Unlock body scroll
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    // Cleanup on unmount
    return () => {
      const header = document.querySelector('header');
      if (header) {
        (header as HTMLElement).style.display = '';
      }
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [selectedArticleId]);

  useEffect(() => {
    if (workId && lang !== 'ko' && lang !== currentLang) {
      translateWorksByIds([workId], lang);
    }
  }, [workId, lang, currentLang]);

  // Cursor Follower Logic for Text List
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!cursorImgRef.current || !hoveredArticleImg) return;
      const { clientX, clientY } = e;
      cursorImgRef.current.animate({
        transform: `translate(${clientX + 40}px, ${clientY + 40}px)`
      }, { duration: 800, fill: 'forwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    };
    window.addEventListener('mousemove', handleWindowMouseMove);
    return () => window.removeEventListener('mousemove', handleWindowMouseMove);
  }, [hoveredArticleImg]);
  
  const work = works.find(w => w.id === workId);

  // Reset slide when work changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [workId]);

  // Keyboard Navigation for Slider
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!work || !work.galleryImages) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevSlide();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextSlide();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, work]);

  // ESC Key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedArticleId) setSelectedArticleId(null);
        else window.location.hash = '#/work';
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [selectedArticleId]);

  if (!work) return null;

  const handleClose = () => { 
    window.history.back(); 
  };
  const handleWorkClick = (clickedWorkId: number) => { 
    window.location.hash = `#/work/${clickedWorkId}`; 
  };

  const title = lang === 'ko' ? work.title_ko : (lang === 'jp' ? work.title_jp : work.title_en);
  const description = lang === 'ko' ? work.description_ko : (lang === 'jp' ? work.description_jp : work.description_en);
  const yearCaption = lang === 'ko' ? work.yearCaption_ko : (lang === 'jp' ? work.yearCaption_jp : work.yearCaption_en);
  
  const videoUrl = work.youtubeUrl || work.vimeoUrl;

  // Slider Functions
  const goToNextSlide = () => {
    if (!work.galleryImages) return;
    setCurrentSlide((prev) => (prev + 1) % work.galleryImages.length);
  };

  const goToPrevSlide = () => {
    if (!work.galleryImages) return;
    setCurrentSlide((prev) => (prev - 1 + work.galleryImages.length) % work.galleryImages.length);
  };

  // Filter out current work from "Other Works"
  const otherWorks = works.filter(w => w.id !== workId);

  return (
    <>
      <div className="min-h-screen bg-background selection:bg-black/10 selection:text-black dark:selection:bg-white/20 dark:selection:text-white">
        <SeoHead 
          title={work.title_en} 
          description={work.description_en ? work.description_en.slice(0, 160) : undefined} 
          image={work.thumbnail} 
        />

        {/* Content Container */}
        <div className="pt-32 md:pt-40 px-6 md:px-12 pb-16 max-w-[1800px] mx-auto">
          
          {/* Back Button - Fixed below header, always visible */}
          <div className="fixed top-[72px] md:top-[88px] left-6 md:left-12 z-[99999999] pointer-events-none">
            <button
              ref={buttonRef}
              onClick={handleClose}
              className="group flex items-center gap-2 py-1.5 bg-transparent focus:outline-none cursor-pointer pointer-events-auto"
            >
              <ArrowLeft className="w-3 h-3 transition-transform duration-500 ease-out group-hover:-translate-x-1 text-muted-foreground/60 group-hover:text-foreground/80" />
              <span className="text-[10px] tracking-[0.25em] lowercase font-sans text-muted-foreground/60 group-hover:text-foreground/80 transition-colors duration-300">back</span>
            </button>
          </div>

          {/* 1. Header Spec Sheet */}
          <div className="mb-16 md:mb-24 min-[1025px]:mb-32">
            <div className="max-w-4xl mx-auto">
              {/* Classic Gallery Caption: Title, Year */}
              <div className="text-center pb-6 md:pb-8 min-[1025px]:pb-10 border-b border-black/5 dark:border-white/10">
                <div className="flex items-baseline justify-center gap-2 mb-2 md:mb-3">
                  <span className="tracking-[0.2em] text-muted-foreground/60 font-mono text-[12px]">Title</span>
                  <span className="text-[9px] text-muted-foreground/30">/</span>
                  <span className="text-[12px] tracking-[0.2em] text-muted-foreground/60 font-mono">Year</span>
                </div>
                <h1 className="text-xl md:text-2xl min-[1025px]:text-3xl font-serif font-light text-foreground/90 leading-tight">
                  {cleanText(title)}{work.year && `, ${work.year}`}
                </h1>
              </div>
              
              {/* Metadata - Commission only */}
              <div className="text-center mt-4 md:mt-6">
                {(() => {
                  const commission = lang === 'ko' ? work.commission_ko : (lang === 'jp' ? work.commission_jp : work.commission_en);
                  if (commission) {
                    return (
                      <div className="text-sm md:text-base font-mono text-foreground/70">
                        {cleanText(commission)}
                      </div>
                    );
                  }
                  return null;
                })()}
                {(() => {
                  const yearCaption = lang === 'ko' ? work.yearCaption_ko : (lang === 'jp' ? work.yearCaption_jp : work.yearCaption_en);
                  if (!yearCaption) return null;
                  return <p className="mt-3 text-[10px] text-muted-foreground/50 font-serif italic">{cleanText(yearCaption)}</p>;
                })()}
              </div>
            </div>
          </div>

          {/* 2. Description Text (Video moved to bottom) */}
          {description && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-32 md:mb-40">
            {/* Left: Empty for whitespace or future content */}
            <div className="hidden md:block md:col-span-5 min-[1025px]:col-span-5"></div>

            {/* Right: Description Text */}
            <div className="md:col-span-6 md:col-start-7 min-[1025px]:col-span-6 min-[1025px]:col-start-7">
                 <div className="space-y-6 md:space-y-8">
                   {description.split('\n\n').map((paragraph, index) => (
                      <BlurReveal 
                        key={`${lang}-${index}`} 
                        className={`${lang === 'jp' ? 'font-[Shippori_Mincho]' : 'font-serif'} text-foreground/80 text-sm md:text-base leading-[1.8] opacity-80`}
                        delay={0.2 + (index * 0.1)}
                      >
                        <span dangerouslySetInnerHTML={{ __html: paragraph.trim() }} />
                      </BlurReveal>
                   ))}
                 </div>
            </div>
          </div>
          )}

          {/* 3. Simple Image Slider */}
          {work.galleryImages && work.galleryImages.length > 0 && (
            <div className="mb-32 md:mb-48 min-[1025px]:mb-64 -mx-6 md:-mx-12">
              <div className="flex flex-col items-center gap-5 md:gap-6 w-full mx-auto">
                <div className="relative max-h-[70svh] md:max-h-[85svh] min-[1025px]:max-h-[90svh] overflow-hidden group w-full">
                  {/* Desktop: Click Areas for Navigation (Left/Right split) */}
                  <div 
                    className="hidden md:block absolute left-0 top-0 w-1/2 h-full z-20 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevSlide();
                    }}
                  />
                  <div 
                    className="hidden md:block absolute right-0 top-0 w-1/2 h-full z-20 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNextSlide();
                    }}
                  />
                  
                  {/* Mobile: Full area click goes to next */}
                  <div 
                    className="md:hidden absolute inset-0 z-20 cursor-pointer active:bg-black/5"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNextSlide();
                    }}
                  />
                  
                  {/* Hover indicators - Desktop only */}
                  <div className="hidden md:block absolute inset-0 z-10 pointer-events-none">
                    <div className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-black/0 via-black/0 to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                    <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-black/0 via-black/0 to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                  </div>
                  
                  {/* Current Image */}
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={currentSlide}
                      src={work.galleryImages[currentSlide]} 
                      alt={`Gallery ${currentSlide + 1}`} 
                      className="max-h-[70svh] md:max-h-[85svh] min-[1025px]:max-h-[90svh] w-full object-contain mx-auto block pointer-events-none"
                      draggable={false}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.2}
                      onDragEnd={(e, { offset, velocity }) => {
                        const swipe = offset.x;
                        const swipeVelocity = velocity.x;
                        
                        // Mobile: swipe to change slides
                        if (window.innerWidth < 768) {
                          if (Math.abs(swipe) > 50 || Math.abs(swipeVelocity) > 500) {
                            if (swipe > 0) {
                              goToPrevSlide();
                            } else {
                              goToNextSlide();
                            }
                          }
                        }
                      }}
                    />
                  </AnimatePresence>
                  
                </div>

                {/* Image Caption/Credit - Always reserve space for consistent layout */}
                <div className="h-6 flex items-center justify-center">
                  {work.imageCredits && work.imageCredits[currentSlide] ? (() => {
                    const rawCaption = work.imageCredits[currentSlide];
                    const parsedCaption = parseMultilingualCaption(rawCaption, lang);
                    if (!parsedCaption) return null;
                    return (
                      <motion.p
                        key={`caption-${currentSlide}-${lang}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="text-[10px] md:text-[11px] tracking-wide text-muted-foreground/50 font-sans"
                      >
                        {parsedCaption}
                      </motion.p>
                    );
                  })() : null}
                </div>

                {/* Slider Controls - Single unified control */}
                <div className="flex items-center justify-center gap-8 md:gap-10">
                  <button 
                    type="button"
                    className="relative z-10 cursor-pointer text-foreground/50 hover:text-foreground transition-colors active:scale-95 min-w-[44px] min-h-[44px] min-[1025px]:min-w-0 min-[1025px]:min-h-0 flex items-center justify-center"
                    aria-label="Previous"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      goToPrevSlide();
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="rotate-180 min-[1025px]:w-5 min-[1025px]:h-5 pointer-events-none">
                      <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="square"/>
                    </svg>
                  </button>
                  <span className="min-[1025px]:text-[14px] font-mono min-[1025px]:font-['Ojuju'] text-foreground/50 tracking-[0.1em] whitespace-nowrap text-[11px]">
                    {String(currentSlide + 1).padStart(2, '0')} / {String(work.galleryImages.length).padStart(2, '0')}
                  </span>
                  <button 
                    type="button"
                    className="relative z-10 cursor-pointer text-foreground/50 hover:text-foreground transition-colors active:scale-95 min-w-[44px] min-h-[44px] min-[1025px]:min-w-0 min-[1025px]:min-h-0 flex items-center justify-center"
                    aria-label="Next"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      goToNextSlide();
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="min-[1025px]:w-5 min-[1025px]:h-5 pointer-events-none">
                      <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="square"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. Video Section (Moved from top) */}
          {videoUrl && (
            <div className="mb-40 md:mb-64">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                 <div className="md:col-span-8 md:col-start-3">
                    <VideoPlayer url={videoUrl} />
                    <div className="mt-4 flex items-center justify-between opacity-50">
                       <span className="text-[14px] uppercase tracking-widest font-mono">Featured Film</span>
                       <div className="h-px bg-current flex-grow ml-4"></div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* 5. Credits / Artist Notes / Additional Information */}
          {(() => {
            const credits = lang === 'ko' ? work.credits_ko : (lang === 'jp' ? work.credits_jp : work.credits_en);
            if (!credits) return null;
            
            return (
              <div className="mb-40 md:mb-64 pt-12 border-t border-black/5 dark:border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                  {/* Left: Section Title */}
                  <div className="md:col-span-3 min-[1025px]:col-span-3">
                    <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-mono sticky top-40">
                      Credits & Notes
                    </h2>
                  </div>

                  {/* Right: Content */}
                  <div className="md:col-span-8 md:col-start-5 min-[1025px]:col-span-7 min-[1025px]:col-start-5">
                    <div 
                      className={`prose prose-sm md:prose-base dark:prose-invert prose-headings:font-light prose-p:text-foreground/80 prose-p:leading-relaxed prose-li:text-foreground/80 prose-strong:text-foreground/90 prose-strong:font-medium max-w-none ${lang === 'jp' ? 'prose-headings:font-[Shippori_Mincho] prose-p:font-[Shippori_Mincho] prose-ul:font-[Shippori_Mincho]' : 'prose-headings:font-serif prose-p:font-serif prose-ul:font-serif'}`}
                      dangerouslySetInnerHTML={{ __html: credits }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 6. Related Texts */}
          {work.relatedArticles && work.relatedArticles.length > 0 && (
            <div className="mb-40 pt-12 border-t border-black/5 dark:border-white/5">
              <div className="grid grid-cols-1 min-[1025px]:grid-cols-12 gap-12">
                <div className="md:col-span-4 min-[1025px]:col-span-3">
                  <div className="sticky top-40">
                    <h2 className="text-[12px] lowercase tracking-[0.2em] text-muted-foreground/70 mb-6 font-[Sans_Serif_Collection]">related</h2>
                    <div className="hidden md:block min-h-[100px]">
                      {hoveredArticleId && (
                        <div key={hoveredArticleId} className="text-sm font-serif leading-relaxed text-foreground/80 italic animate-in fade-in duration-500">
                           {(() => {
                               const article = work.relatedArticles.find(a => a.id === hoveredArticleId);
                               const textItem = texts.find(t => t.id === article?.id);
                               const summary = textItem?.summary 
                                 ? (lang === 'ko' 
                                     ? textItem.summary.ko 
                                     : lang === 'jp' 
                                       ? (textItem.summary.jp || textItem.summary.ko) 
                                       : (textItem.summary.en || textItem.summary.ko)) 
                                 : article?.summary;
                               return summary ? cleanText(summary).slice(0, 120) + "..." : "";
                           })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-8 min-[1025px]:col-span-9 relative">
                   <div 
                      ref={cursorImgRef}
                      className={`fixed top-0 left-0 z-50 pointer-events-none w-[240px] aspect-[4/3] overflow-hidden bg-background transition-opacity duration-300 ease-out border border-black/10 ${hoveredArticleImg ? 'opacity-100' : 'opacity-0'}`}
                    >
                       {hoveredArticleImg && <img src={hoveredArticleImg} alt="Preview" className="w-full h-full object-cover grayscale contrast-125" />}
                    </div>
                    <div className="flex flex-col divide-y divide-black/10 dark:divide-white/10 border-t border-black/10 dark:border-white/10">
                      {work.relatedArticles.map((article, index) => {
                         const textItem = texts.find(t => t.id === article.id);
                         const displayTitle = textItem ? (lang === 'ko' ? textItem.title.ko : lang === 'jp' ? textItem.title.jp : textItem.title.en) : article.title;
                         return (
                            <div
                               key={article.id}
                               onClick={() => setSelectedArticleId(article.id)}
                               className="group block relative cursor-pointer"
                               onMouseEnter={() => { setHoveredArticleId(article.id); if (textItem?.image) setHoveredArticleImg(textItem.image); }}
                               onMouseLeave={() => { setHoveredArticleId(null); setHoveredArticleImg(null); }}
                            >
                               <div className={`flex items-baseline gap-3 md:gap-4 py-2 md:py-4 transition-all duration-300 ${hoveredArticleId === article.id ? 'pl-6 opacity-100' : 'pl-0 opacity-80'}`}>
                                 <span className="shrink-0 text-[10px] font-mono text-muted-foreground/60">{String(index + 1).padStart(2, '0')}</span>
                                 <h3 className="font-serif font-light tracking-tight text-foreground/90 text-[14px] md:text-[16px] leading-snug m-0">{cleanText(displayTitle)}</h3>
                               </div>
                            </div>
                         );
                      })}
                    </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-16 md:mt-20 border-t border-white/5">
          <InfiniteWorkGrid works={otherWorks} onWorkClick={handleWorkClick} />
        </div>
        <ScrollToTop />
      </div>

      {/* Floating Text Window (Portal) */}
      {selectedArticleId && createPortal(
          <div 
            ref={panelRef}
            className={`fixed z-[999999999] ${isMobile ? 'top-[20px] left-[20px] w-[calc(100vw-40px)] h-[70vh]' : 'w-fit h-fit'}`}
            style={isMobile ? { position: 'fixed' } : { position: 'fixed', left: 100, top: 100, width: 'fit-content', height: 'fit-content' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`shadow-2xl bg-background/95 backdrop-blur-md border border-foreground/10 overflow-hidden ${isMobile ? 'w-full h-full rounded-lg' : 'rounded-sm'}`}
            >
              <Resizable
                defaultSize={isMobile ? { width: '100%', height: '100%' } : { width: 450, height: 600 }}
                minWidth={isMobile ? 300 : 320} 
                minHeight={isMobile ? 300 : 400} 
                maxWidth={1000}
                enable={!isMobile ? { right: true, bottom: true, bottomRight: true } : false}
                className="flex flex-col relative"
              >
                {/* Drag Handle - subtle top bar (desktop only) */}
                {!isMobile && (
                  <div 
                    className="h-6 flex-shrink-0 flex items-center justify-center cursor-move select-none"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const panel = panelRef.current;
                      if (!panel) return;
                      const rect = panel.getBoundingClientRect();
                      dragState.current = { startX: e.clientX, startY: e.clientY, startLeft: rect.left, startTop: rect.top };
                      
                      const onMouseMove = (ev: MouseEvent) => {
                        if (!dragState.current || !panel) return;
                        const dx = ev.clientX - dragState.current.startX;
                        const dy = ev.clientY - dragState.current.startY;
                        panel.style.left = `${dragState.current.startLeft + dx}px`;
                        panel.style.top = `${dragState.current.startTop + dy}px`;
                      };
                      const onMouseUp = () => {
                        dragState.current = null;
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                      };
                      document.addEventListener('mousemove', onMouseMove);
                      document.addEventListener('mouseup', onMouseUp);
                    }}
                  >
                    <div className="w-10 h-[1.5px] bg-foreground/10 rounded-full" />
                  </div>
                )}

                {/* Close button - floating top right */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setSelectedArticleId(null);
                  }} 
                  className="absolute top-2 right-3 z-20 text-muted-foreground/30 hover:text-foreground/70 transition-colors duration-300 p-2 md:p-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center cursor-pointer"
                >
                  <X size={13} />
                </button>

                <div className="w-full h-full overflow-hidden relative bg-background">
                    <TextDetail textId={selectedArticleId} />
                </div>
              </Resizable>
            </motion.div>
          </div>,
        document.body
      )}
    </>
  );
};