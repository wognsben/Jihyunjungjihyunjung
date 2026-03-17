import React, { useRef, useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Resizable } from 're-resizable';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { SeoHead } from '@/app/components/seo/SeoHead';
import { getLocalizedThumbnail } from '@/utils/getLocalizedImage';
import { ScrollToTop } from '@/app/components/ui/ScrollToTop';
import { InfiniteWorkGrid } from '@/app/components/InfiniteWorkGrid';
import { TextDetail } from '@/app/components/TextDetail';
import { BlockRenderer } from '@/app/components/BlockRenderer';

interface WorkDetailProps {
  workId: string | null;
}

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

  // Filter out current work from "Other Works"
  const otherWorks = works.filter(w => w.id !== workId);

  return (
    <>
      <div className="min-h-screen bg-background selection:bg-black/10 selection:text-black dark:selection:bg-white/20 dark:selection:text-white">
        <SeoHead 
          title={work.title_en} 
          description={work.description_en ? work.description_en.slice(0, 160) : undefined} 
          image={getLocalizedThumbnail(work, lang)} 
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

          {/* Block Content: 언어별 렌더링 */}
          {/* KO: content_rendered 블록 전체 */}
          {/* EN/JP: content_rendered에서 이미지/갤러리 추출 + ACF content_en/jp 텍스트+동영상 */}
          {/*        [embed]URL[/embed] 숏코드는 sanitizeHtml에서 자동 변환됨 */}
          {(() => {
            if (lang === 'ko') {
              // KO: 원본 블록 에디터 콘텐츠 그대로
              if (!work.content_rendered) return null;
              return (
                <div className="mb-32 md:mb-48 min-[1025px]:mb-64">
                  <BlockRenderer html={work.content_rendered} lang={lang} />
                </div>
              );
            }

            // EN/JP: 하이브리드 렌더링
            const acfContent = lang === 'jp' ? work.content_jp : work.content_en;
            
            if (!acfContent) {
              // ACF 번역 없으면 미디어만 표시 (한국어 텍스트 노출 방지)
              if (!work.content_rendered) return null;
              return (
                <div className="mb-32 md:mb-48 min-[1025px]:mb-64">
                  <BlockRenderer html={work.content_rendered} lang={lang} mediaOnly />
                </div>
              );
            }

            // ACF 번역 있음:
            // 1) content_rendered에서 이미지/갤러리만 추출 (동영상 제외 — ACF에 [embed]로 있으므로)
            // 2) ACF content를 BlockRenderer로 렌더 (텍스트 + [embed]→iframe 동영상)
            return (
              <div className="mb-32 md:mb-48 min-[1025px]:mb-64 space-y-8 md:space-y-12 min-[1025px]:space-y-16">
                {/* 이미지/갤러리: content_rendered에서 추출 */}
                {work.content_rendered && (
                  <BlockRenderer html={work.content_rendered} lang={lang} mediaOnly imageOnly />
                )}
                {/* 텍스트 + 동영상: ACF content */}
                <BlockRenderer html={acfContent} lang={lang} />
              </div>
            );
          })()}

          {/* 4.5 Additional Text (Artist Notes / Supplementary Description) */}
          {(() => {
            const additional = lang === 'ko' ? work.additional_ko : (lang === 'jp' ? work.additional_jp : work.additional_en);
            if (!additional) return null;
            
            return (
              <div className="mb-32 md:mb-48 min-[1025px]:mb-64">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                  {/* Left: Section Label */}
                  <div className="md:col-span-3 min-[1025px]:col-span-3">
                    <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-mono sticky top-40">
                      {lang === 'ko' ? 'Artist Note' : lang === 'jp' ? 'Artist Note' : 'Artist Note'}
                    </h2>
                  </div>

                  {/* Right: Content */}
                  <div className="md:col-span-8 md:col-start-5 min-[1025px]:col-span-7 min-[1025px]:col-start-5">
                    <div className="space-y-6 md:space-y-8">
                      {additional.split('\n\n').map((paragraph, index) => (
                        <p
                          key={`additional-${lang}-${index}`}
                          className={`${lang === 'jp' ? 'font-[Shippori_Mincho]' : 'font-serif'} text-foreground/80 text-sm md:text-base leading-[1.8] opacity-80`}
                        >
                          <span dangerouslySetInnerHTML={{ __html: paragraph.trim() }} />
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

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
          {work.relatedArticles && work.relatedArticles.length > 0 && (() => {
            // Filter related articles by language availability
            const filteredRelatedArticles = work.relatedArticles.filter(article => {
              const textItem = texts.find(t => t.id === article.id);
              if (!textItem) return true; // No match in texts → show by default
              if (lang === 'en') return textItem.hasEn !== undefined ? textItem.hasEn : true;
              if (lang === 'jp') return textItem.hasJp !== undefined ? textItem.hasJp : true;
              // KO: show only articles without EN/JP translations
              return !textItem.hasEn && !textItem.hasJp;
            });
            
            if (filteredRelatedArticles.length === 0) return null;
            
            return (
            <div className="mb-40 pt-12 border-t border-black/5 dark:border-white/5">
              <div className="grid grid-cols-1 min-[1025px]:grid-cols-12 gap-12">
                <div className="md:col-span-4 min-[1025px]:col-span-3">
                  <div className="sticky top-40">
                    <h2 className="text-[12px] lowercase tracking-[0.2em] text-muted-foreground/70 mb-6 font-[Sans_Serif_Collection]">related</h2>
                    <div className="hidden md:block min-h-[100px]">
                      {hoveredArticleId && (
                        <div key={hoveredArticleId} className="text-sm font-serif leading-relaxed text-foreground/80 italic animate-in fade-in duration-500">
                           {(() => {
                               const article = filteredRelatedArticles.find(a => a.id === hoveredArticleId);
                               const textItem = texts.find(t => t.id === article?.id);
                               if (!textItem) {
                                 return article?.summary ? cleanText(article.summary).slice(0, 120) + "..." : "";
                               }
                               // Prefer content-based preview with proper language, since summary ACF fields may not have translations
                               const contentForLang = lang === 'ko' ? textItem.content?.ko 
                                 : lang === 'jp' ? (textItem.content?.jp && textItem.content.jp !== textItem.content?.ko ? textItem.content.jp : textItem.content?.ko)
                                 : (textItem.content?.en && textItem.content.en !== textItem.content?.ko ? textItem.content.en : textItem.content?.ko);
                               const summaryForLang = lang === 'ko' ? textItem.summary?.ko
                                 : lang === 'jp' ? (textItem.summary?.jp && textItem.summary.jp !== textItem.summary?.ko ? textItem.summary.jp : undefined)
                                 : (textItem.summary?.en && textItem.summary.en !== textItem.summary?.ko ? textItem.summary.en : undefined);
                               // Use translated summary first, then translated content preview, then Korean summary
                               const preview = summaryForLang || (contentForLang ? contentForLang.slice(0, 120) : '') || textItem.summary?.ko || '';
                               return preview ? cleanText(preview).slice(0, 120) + "..." : "";
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
                      {filteredRelatedArticles.map((article, index) => {
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
            );
          })()}
        </div>

        {otherWorks.length > 0 && (
          <div className="mt-16 md:mt-20 border-t border-white/5">
            <InfiniteWorkGrid works={otherWorks} onWorkClick={handleWorkClick} />
          </div>
        )}
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
              className={`shadow-2xl bg-background/95 backdrop-blur-md border border-foreground/10 overflow-hidden ${isMobile ? 'w-full h-full rounded-sm' : 'rounded-sm'}`}
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