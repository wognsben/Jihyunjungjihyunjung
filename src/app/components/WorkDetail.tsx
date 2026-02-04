import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { ArrowLeft, X, Maximize2, Minimize2 } from 'lucide-react';
import gsap from 'gsap';
import SplitType from 'split-type';
import { motion, AnimatePresence } from 'motion/react';
import { Resizable } from 're-resizable';
import Draggable from 'react-draggable';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Minimal Blur Reveal Component
const BlurReveal = ({ children, className, delay = 0 }: { children: string, className?: string, delay?: number }) => {
  const elementRef = useRef<HTMLParagraphElement>(null);
  
  useEffect(() => {
    if (!elementRef.current) return;
    const split = new SplitType(elementRef.current, { types: 'words' });
    const words = split.words;
    if (!words) return;

    gsap.set(words, { opacity: 0, filter: 'blur(10px)', y: 10, willChange: 'filter, opacity, transform' });
    const ctx = gsap.context(() => {
      gsap.to(words, {
        opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.2,
        stagger: 0.015, ease: 'power2.out', delay: delay
      });
    }, elementRef);

    return () => { ctx.revert(); split.revert(); };
  }, [children, delay]); 

  return <p ref={elementRef} className={className}>{children}</p>;
};

import { SeoHead } from '@/app/components/seo/SeoHead';
import { ScrollToTop } from '@/app/components/ui/ScrollToTop';
import { InfiniteWorkGrid } from '@/app/components/InfiniteWorkGrid';
import { TextDetail } from '@/app/components/TextDetail';

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
  const nodeRef = useRef(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const swiperRef = useRef<any>(null);
  
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
    if (window.history.length > 1) {
       window.history.back();
    } else {
       window.location.hash = '#/work'; 
    }
  };
  const handleWorkClick = (clickedWorkId: number) => { window.location.hash = `#/work/${clickedWorkId}`; };

  const title = lang === 'ko' ? work.title_ko : (lang === 'jp' ? work.title_jp : work.title_en);
  const description = lang === 'ko' ? work.description_ko : (lang === 'jp' ? work.description_jp : work.description_en);
  const yearCaption = lang === 'ko' ? work.yearCaption_ko : (lang === 'jp' ? work.yearCaption_jp : work.yearCaption_en);
  
  const videoUrl = work.youtubeUrl || work.vimeoUrl;

  return (
    <>
      <div className="min-h-screen bg-background selection:bg-black/10 selection:text-black dark:selection:bg-white/20 dark:selection:text-white">
        <SeoHead 
          title={work.title_en} 
          description={work.description_en ? work.description_en.slice(0, 160) : undefined} 
          image={work.thumbnail} 
        />

        {/* Custom Styles for Swiper */}
        <style>{`
          .work-gallery-swiper {
            padding: 0 60px;
          }
          
          @media (max-width: 1023px) {
            .work-gallery-swiper {
              padding: 0 20px;
            }
            
            /* Hide default Swiper arrows on mobile & tablet */
            .work-gallery-swiper .swiper-button-prev,
            .work-gallery-swiper .swiper-button-next {
              display: none !important;
            }
          }
          
          @media (min-width: 1024px) {
            .work-gallery-swiper .swiper-button-prev,
            .work-gallery-swiper .swiper-button-next {
              color: currentColor;
              opacity: 0.3;
              transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
              width: 44px;
              height: 44px;
              background: transparent;
              border-radius: 0;
            }
            
            .work-gallery-swiper .swiper-button-prev:hover,
            .work-gallery-swiper .swiper-button-next:hover {
              opacity: 0.8;
              transform: scale(1.05);
            }
            
            .work-gallery-swiper .swiper-button-prev::after,
            .work-gallery-swiper .swiper-button-next::after {
              font-size: 16px;
              font-weight: 300;
            }
          }
          
          .work-gallery-swiper .swiper-pagination-bullet {
            width: 6px;
            height: 6px;
            background: currentColor;
            opacity: 0.15;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            border-radius: 50%;
          }
          
          .work-gallery-swiper .swiper-pagination-bullet-active {
            opacity: 0.6;
            transform: scale(1.2);
          }
          
          .work-gallery-swiper .swiper-pagination {
            bottom: -50px !important;
          }
          
          @media (max-width: 1023px) {
            .work-gallery-swiper .swiper-pagination {
              bottom: -35px !important;
            }
          }
        `}</style>

        {/* Content Container */}
        <div className="pt-32 md:pt-40 px-6 md:px-12 pb-16 max-w-[1800px] mx-auto">
          
          {/* Back Button */}
          <div className="fixed top-24 md:top-32 left-6 md:left-16 z-40 mix-blend-difference text-white dark:text-white">
            <button
              ref={buttonRef}
              onClick={handleClose}
              className="group flex items-center gap-3 px-4 py-2 bg-transparent focus:outline-none"
            >
              <ArrowLeft className="w-3 h-3 transition-transform duration-500 ease-out group-hover:-translate-x-1 opacity-70 group-hover:opacity-100" />
              <span className="text-[10px] tracking-[0.25em] uppercase font-light opacity-70 group-hover:opacity-100 transition-opacity duration-300">BACK</span>
            </button>
          </div>

          {/* 1. Header Spec Sheet */}
          <div className="mb-24 md:mb-32 animate-in fade-in duration-1000 slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-y-8 border-t border-black/5 dark:border-white/10 pt-6">
              <div className="md:col-span-4 lg:col-span-3">
                <span className="block text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 font-mono">Project Title</span>
                <h1 className="text-2xl md:text-3xl font-serif font-light text-foreground/90 leading-tight">{cleanText(title)}</h1>
              </div>
              <div className="md:col-span-2 lg:col-span-2 md:col-start-6 lg:col-start-5">
                <span className="block text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 font-mono">Year</span>
                <span className="block text-sm font-mono text-foreground/70">{work.year}</span>
                {yearCaption && <span className="block text-[10px] text-muted-foreground/50 mt-1 font-serif italic">{yearCaption}</span>}
              </div>
              <div className="md:col-span-2 lg:col-span-2">
                {work.client && (
                  <>
                    <span className="block text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 font-mono">Client</span>
                    <span className="block text-sm font-mono text-foreground/70">{work.client}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 2. Description Text (Video moved to bottom) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-40">
            {/* Left: Empty for whitespace or future content */}
            <div className="hidden md:block md:col-span-5 lg:col-span-5"></div>

            {/* Right: Description Text */}
            <div className="md:col-span-6 md:col-start-7 lg:col-span-6 lg:col-start-7">
               {description && (
                 <div className="space-y-8">
                   {description.split('\n\n').map((paragraph, index) => (
                      <BlurReveal 
                        key={index} 
                        className={`font-serif text-foreground/80 ${index === 0 ? 'text-lg md:text-xl leading-[1.6] opacity-90' : 'text-sm md:text-base leading-[1.8] opacity-70'}`}
                        delay={0.2 + (index * 0.1)}
                      >
                        {cleanText(paragraph)}
                      </BlurReveal>
                   ))}
                 </div>
               )}
            </div>
          </div>

          {/* 3. Image Slider */}
          <div className="mb-40 md:mb-64">
            <Swiper
              className="work-gallery-swiper"
              modules={[Navigation, Pagination]}
              spaceBetween={50}
              slidesPerView={1}
              navigation={false} // Disable default arrows, we use custom controls below
              pagination={{ clickable: true }}
              touchAngle={45}
              touchRatio={1}
              touchStartPreventDefault={false}
              simulateTouch={true}
              threshold={10}
              resistance={true}
              resistanceRatio={0.85}
              onSwiper={(swiper) => { swiperRef.current = swiper; }}
            >
              {work.galleryImages.map((image, index) => (
                <SwiperSlide key={index} className="outline-none focus:outline-none">
                  <div className="flex flex-col items-center gap-6 w-full md:w-fit mx-auto">
                    <div className="relative h-[50vh] md:h-[70vh] group cursor-grab active:cursor-grabbing w-full">
                      <div className="hidden md:block absolute inset-0 z-10 bg-black/0 group-hover:bg-black/20 dark:group-hover:bg-white/10 transition-colors duration-500 ease-out" />
                      <img 
                        src={image} 
                        alt={`Gallery ${index + 1}`} 
                        className="h-full w-full md:w-auto object-contain mx-auto block"
                        draggable={false}
                      />
                      
                      {/* Mobile Controls (Inside) */}
                      <div className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-8 md:gap-10">
                        <button 
                          className="swiper-button-prev-custom text-foreground/50 hover:text-foreground transition-colors active:scale-95"
                          aria-label="Previous"
                          onClick={() => swiperRef.current?.slidePrev()}
                        >
                          <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="rotate-180 md:w-5 md:h-5">
                            <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="square"/>
                          </svg>
                        </button>
                        <span className="text-[9px] md:text-[11px] font-mono text-foreground/50 tracking-[0.1em] whitespace-nowrap">
                          {String(index + 1).padStart(2, '0')} / {String(work.galleryImages.length).padStart(2, '0')}
                        </span>
                        <button 
                          className="swiper-button-next-custom text-foreground/50 hover:text-foreground transition-colors active:scale-95"
                          aria-label="Next"
                          onClick={() => swiperRef.current?.slideNext()}
                        >
                          <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="md:w-5 md:h-5">
                            <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="square"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Desktop Controls (Outside/Below) */}
                    <div className="hidden lg:flex items-center gap-10">
                      <button 
                        className="swiper-button-prev-custom text-foreground/50 hover:text-foreground transition-colors active:scale-95"
                        aria-label="Previous"
                        onClick={() => swiperRef.current?.slidePrev()}
                      >
                        <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="rotate-180 w-5 h-5">
                          <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="square"/>
                        </svg>
                      </button>
                      <span className="text-[11px] font-mono text-foreground/50 tracking-[0.1em] whitespace-nowrap">
                        {String(index + 1).padStart(2, '0')} / {String(work.galleryImages.length).padStart(2, '0')}
                      </span>
                      <button 
                        className="swiper-button-next-custom text-foreground/50 hover:text-foreground transition-colors active:scale-95"
                        aria-label="Next"
                        onClick={() => swiperRef.current?.slideNext()}
                      >
                        <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="w-5 h-5">
                          <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="square"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* 4. Video Section (Moved from top) */}
          {videoUrl && (
            <div className="mb-40 md:mb-64">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                 <div className="md:col-span-8 md:col-start-3">
                    <VideoPlayer url={videoUrl} />
                    <div className="mt-4 flex items-center justify-between opacity-50">
                       <span className="text-[9px] uppercase tracking-widest font-mono">Featured Film</span>
                       <div className="h-px bg-current flex-grow ml-4"></div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* 4. Related Texts */}
          {work.relatedArticles && work.relatedArticles.length > 0 && (
            <div className="mb-40 pt-12 border-t border-black/5 dark:border-white/5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="md:col-span-4 lg:col-span-3">
                  <div className="sticky top-40">
                    <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-mono mb-6">Related Texts</h2>
                    <div className="hidden md:block min-h-[100px]">
                      {hoveredArticleId && (
                        <BlurReveal key={hoveredArticleId} className="text-sm font-serif leading-relaxed text-foreground/80 italic">
                           {(() => {
                               const article = work.relatedArticles.find(a => a.id === hoveredArticleId);
                               const textItem = texts.find(t => t.id === article?.id);
                               const summary = textItem?.summary ? textItem.summary[lang] : article?.summary;
                               return summary ? cleanText(summary).slice(0, 120) + "..." : "";
                           })()}
                        </BlurReveal>
                      )}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-8 lg:col-span-9 relative">
                   <div 
                      ref={cursorImgRef}
                      className={`fixed top-0 left-0 z-50 pointer-events-none w-[240px] aspect-[4/3] overflow-hidden bg-background transition-opacity duration-300 ease-out border border-black/10 ${hoveredArticleImg ? 'opacity-100' : 'opacity-0'}`}
                    >
                       {hoveredArticleImg && <img src={hoveredArticleImg} alt="Preview" className="w-full h-full object-cover grayscale contrast-125" />}
                    </div>
                    <div className="flex flex-col border-t border-black/10 dark:border-white/10">
                      {work.relatedArticles.map((article, index) => {
                         const textItem = texts.find(t => t.id === article.id);
                         const displayTitle = textItem ? textItem.title[lang] : article.title;
                         return (
                            <div
                               key={article.id}
                               onClick={() => setSelectedArticleId(article.id)}
                               className="group block relative cursor-pointer"
                               onMouseEnter={() => { setHoveredArticleId(article.id); if (textItem?.image) setHoveredArticleImg(textItem.image); }}
                               onMouseLeave={() => { setHoveredArticleId(null); setHoveredArticleImg(null); }}
                            >
                               <div className={`flex items-baseline py-8 border-b border-black/10 dark:border-white/10 transition-all duration-300 ${hoveredArticleId === article.id ? 'pl-6 opacity-100' : 'pl-0 opacity-80'}`}>
                                 <span className="w-16 text-[10px] font-mono text-muted-foreground/60">{String(index + 1).padStart(2, '0')}</span>
                                 <h3 className="text-[13px] md:text-2xl font-serif font-light tracking-tight text-foreground/90">{cleanText(displayTitle)}</h3>
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

        <div className="mt-40 border-t border-white/5">
          <InfiniteWorkGrid works={works} onWorkClick={handleWorkClick} />
        </div>
        <ScrollToTop />
      </div>

      {/* Floating Text Window (Portal) */}
      {selectedArticleId && createPortal(
        <Draggable 
          handle=".window-handle" 
          defaultPosition={{ 
            x: isMobile ? 20 : 100, 
            y: isMobile ? 20 : 100 
          }} 
          bounds="body" 
          nodeRef={nodeRef}
          disabled={isMaximized}
        >
          <div 
            ref={nodeRef}
            className={`fixed z-[9999] ${isMaximized ? 'inset-0 !transform-none !w-full !h-full' : isMobile ? 'top-0 left-0 w-[calc(100vw-40px)] h-[70vh]' : 'top-0 left-0 w-fit h-fit'}`}
            style={isMaximized ? { transform: 'none', width: '100%', height: '100%', top: 0, left: 0 } : isMobile ? { position: 'fixed' } : { width: 'fit-content', height: 'fit-content', position: 'fixed' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`shadow-2xl bg-background/95 backdrop-blur-md border border-foreground/10 overflow-hidden ${isMaximized ? 'w-full h-full rounded-none' : isMobile ? 'w-full h-full rounded-lg' : 'rounded-sm'}`}
            >
              <Resizable
                defaultSize={isMobile ? { width: '100%', height: '100%' } : { width: 450, height: 600 }}
                size={isMaximized ? { width: '100%', height: '100%' } : undefined}
                minWidth={isMobile ? 300 : 320} 
                minHeight={isMobile ? 300 : 400} 
                maxWidth={isMaximized ? '100%' : 1000}
                enable={!isMaximized ? { right: true, bottom: true, bottomRight: true } : false}
                className="flex flex-col relative"
              >
                <div className="window-handle h-10 flex-shrink-0 bg-muted/20 flex items-center justify-between px-4 cursor-move select-none border-b border-foreground/5 transition-colors hover:bg-muted/30">
                  {/* Left Side - macOS dots */}
                  <div className="flex items-center gap-2">
                    {/* macOS Dots */}
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 hover:bg-red-500/50 transition-colors cursor-pointer" onClick={() => setSelectedArticleId(null)} />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 hover:bg-amber-500/50 transition-colors" />
                        <div 
                            className="w-2.5 h-2.5 rounded-full bg-green-500/20 hover:bg-green-500/50 transition-colors cursor-pointer" 
                            onClick={() => setIsMaximized(!isMaximized)} 
                        />
                    </div>
                    
                    <span className="ml-3 text-[9px] uppercase tracking-[0.2em] font-mono opacity-40">Archive Reader</span>
                  </div>
                  
                  {/* Right Side - Controls */}
                  <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsMaximized(!isMaximized)} 
                        className="text-muted-foreground/40 hover:text-foreground transition-colors p-1"
                        title={isMaximized ? "Restore" : "Maximize"}
                    >
                        {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <button onClick={() => setSelectedArticleId(null)} className="text-muted-foreground/40 hover:text-foreground transition-colors p-1"><X size={14} /></button>
                  </div>
                </div>
                <div className="w-full h-full overflow-hidden relative bg-background">
                    <TextDetail textId={selectedArticleId} />
                </div>
              </Resizable>
            </motion.div>
          </div>
        </Draggable>,
        document.body
      )}
    </>
  );
};