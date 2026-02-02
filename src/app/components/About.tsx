import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Footer } from '@/app/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { ScrambleText } from '@/app/components/ui/ScrambleText';
import { ContactModal } from '@/app/components/ContactModal';
import { WorkModal } from '@/app/components/WorkModal';
import { AboutData, HistoryItem, fetchAboutPage, fetchHistoryItems } from '@/services/wp-api';
import { TooltipTransition } from '@/app/components/TooltipTransition';
import { Work } from '@/types/work';
import gsap from 'gsap';

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------

const RevealText = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (el.current) {
      gsap.fromTo(el.current,
        { y: '100%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 1, ease: 'power3.out', delay: delay }
      );
    }
  }, [delay]);

  return (
    <div className="overflow-hidden leading-tight">
      <div ref={el} className="origin-top-left will-change-transform">
        {children}
      </div>
    </div>
  );
};

const ContactLink = ({ label, value, link, onContactClick }: { label: string; value: string; link: string; onContactClick?: () => void }) => {
  const handleClick = (e: React.MouseEvent) => {
    if (label === 'EMAIL' && onContactClick) {
      e.preventDefault();
      e.stopPropagation();
      onContactClick();
    }
  };

  return (
    <a 
      href={link} 
      target={label !== 'EMAIL' ? "_blank" : undefined}
      rel={label !== 'EMAIL' ? "noopener noreferrer" : undefined}
      onClick={handleClick}
      className="text-xs font-light hover:text-foreground/50 transition-colors relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-foreground after:transition-all after:duration-300 hover:after:w-full cursor-pointer"
    >
      {value}
    </a>
  );
};

// ----------------------------------------------------------------------
// About Component
// ----------------------------------------------------------------------

const transformBioContent = (html: string | undefined, works: Work[], lang: string) => {
  if (!html) return '';
  if (typeof window === 'undefined') return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = Array.from(doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li'));
    let changed = false;

    // Helper to find and link works in text
    const linkWorksInText = (text: string) => {
        let processedText = text;
        
        // Sort works by title length to match longest first
        const sortedWorks = [...works].sort((a, b) => {
            const titleA = (lang === 'ko' ? a.title_ko : a.title_en) || a.title;
            const titleB = (lang === 'ko' ? b.title_ko : b.title_en) || b.title;
            return (titleB?.length || 0) - (titleA?.length || 0);
        });

        for (const work of sortedWorks) {
            const title = (lang === 'ko' ? work.title_ko : work.title_en) || work.title;
            if (!title) continue;

            // Escape regex special chars in title
            // Flexible matching:
            // 1. Allow variable whitespace (including none) where spaces exist in title
            // 2. Match HTML entities for < and >
            let safeTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Basic escape
            
            // Allow spaces to match "no space" or "multiple spaces" or "nbsp"
            safeTitle = safeTitle.replace(/\s+/g, '[\\s\\u00A0]*');
            
            // Allow < and > to match &lt; and &gt;
            safeTitle = safeTitle.replace(/</g, '(?:<|&lt;)').replace(/>/g, '(?:>|&gt;)');

            const regex = new RegExp(`(${safeTitle})`, 'gi'); 
            
            if (regex.test(processedText)) {
                 processedText = processedText.replace(regex, (match) => {
                     return `<span class="relative inline-flex flex-col items-center align-baseline text-current">
                       <span class="hover-line peer relative cursor-pointer" data-work-id="${work.id}">${match}</span>
                       <a href="#/work/${work.id}" class="hidden lg:inline-flex absolute top-full left-1/2 -translate-x-1/2 mt-1 items-center justify-center px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest border border-foreground/20 rounded-full bg-background/90 backdrop-blur-sm shadow-sm !text-foreground hover:bg-foreground hover:!text-background transition-all opacity-0 peer-hover:opacity-100 hover:opacity-100 whitespace-nowrap z-[100]" onclick="event.stopPropagation()">OPEN PROJECT</a>
                     </span>`;
                 });
            }
        }
        return processedText;
    };

    elements.forEach(el => {
      const rawHtml = el.innerHTML;
      const parts = rawHtml.split(/<br\s*\/?>/i);
      
      const processedRows: { year: string, content: string }[] = [];
      let hasYearEntry = false;

      parts.forEach(part => {
        const temp = document.createElement('div');
        temp.innerHTML = part;
        const text = (temp.textContent || '').replace(/[\u200B\uFEFF]/g, '').trim();
        
        const match = text.match(/^(\d{4}(?:[-.~]\d{2,4})?)[\s.,\u00A0\t]+(.*)/s) || 
                      text.match(/^(\d{4}(?:[-.~]\d{2,4})?)(?=[^\w\s])(.*)/s);
        
        if (match) {
          hasYearEntry = true;
          const yearStr = match[1];
          const safeYear = yearStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
          const removeRegex = new RegExp(`^[\\s\\u200B\\uFEFF]*${safeYear}[\\s.,\\u00A0\\t]*`);
          
          let contentHtml = part;
          if (removeRegex.test(contentHtml)) {
             contentHtml = contentHtml.replace(removeRegex, '');
          } else {
             const entityRegex = new RegExp(`^[\\s\\u200B\\uFEFF]*${safeYear}(?:&nbsp;|[\\s.,\\u00A0\\t])*`);
             contentHtml = contentHtml.replace(entityRegex, '');
          }
          
          // Link Works in Content
          contentHtml = linkWorksInText(contentHtml);

          processedRows.push({ year: yearStr, content: contentHtml });
        } else {
          if (text.length > 0) {
             const linkedContent = linkWorksInText(part);
             processedRows.push({ year: '', content: linkedContent });
          }
        }
      });

      if (hasYearEntry && processedRows.length > 0) {
        const table = document.createElement('table');
        table.className = 'wp-block-table';
        const tbody = document.createElement('tbody');
        
        processedRows.forEach(row => {
           const tr = document.createElement('tr');
           
           const tdYear = document.createElement('td');
           tdYear.textContent = row.year;
           
           const tdContent = document.createElement('td');
           tdContent.innerHTML = row.content;
           
           tr.appendChild(tdYear);
           tr.appendChild(tdContent);
           tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        el.replaceWith(table);
        changed = true;
      }
    });

    return changed ? doc.body.innerHTML : html;
  } catch (e) {
    return html;
  }
};

export const About = () => {
  const { lang } = useLanguage();
  const { works } = useWorks();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  
  // Tooltip State
  const [tooltipWorkId, setTooltipWorkId] = useState<string | null>(null);
  
  // Mobile Detection (1024px 미만)
  const [isMobile, setIsMobile] = useState(false);
  
  // Data State
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Scroll State
  const state = useRef({
    current: 0,
    target: 0,
    ease: 0.08,
    last: 0,
    delta: 0,
    touch: { start: 0, prev: 0 },
    isTouching: false,
    maxScroll: 0,
    winH: 0,
    rafId: 0
  });

  // Fetch Data
  useEffect(() => {
    const loadData = async () => {
       try {
         const [about, history] = await Promise.all([
           fetchAboutPage(),
           fetchHistoryItems()
         ]);
         setAboutData(about);
         setHistoryItems(history);
       } catch (error) {
         console.error("Failed to load About data", error);
       } finally {
         setLoading(false);
       }
    };
    loadData();
  }, []);

  // Mobile Detection (1024px 미만)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Process Content
  const processedContent = useMemo(() => 
    transformBioContent(aboutData?.content, works, lang), 
  [aboutData?.content, works, lang]);

  // Event Handlers for Dynamic Content (React Synthetic Events)
  const handleContentClick = (e: any) => {
    const target = e.target as HTMLElement;
    const link = target.closest('.hover-line') as HTMLElement;
    
    if (link) {
      const id = link.getAttribute('data-work-id');
      if (id) {
        e.preventDefault();
        e.stopPropagation();
        
        // 모바일: 툴팁 토글, 데스크탑: WorkModal 열기
        if (isMobile) {
          if (tooltipWorkId === id) {
            setTooltipWorkId(null); // 같은 작품 재클릭 시 툴팁 닫기
          } else {
            setTooltipWorkId(id); // 툴팁 열기
          }
        } else {
          setTooltipWorkId(null);
          setSelectedWorkId(id);
        }
      }
    }
  };

  const handleContentMouseOver = (e: any) => {
    // 데스크탑에서만 호버 작동
    if (isMobile) return;
    
    const target = e.target as HTMLElement;
    const link = target.closest('.hover-line') as HTMLElement;
    if (link) {
      const id = link.getAttribute('data-work-id');
      if (id) setTooltipWorkId(id);
    }
  };

  const handleContentMouseOut = (e: any) => {
    // 데스크탑에서만 호버 작동
    if (isMobile) return;
    
     const target = e.target as HTMLElement;
     if (target.closest('.hover-line')) {
        setTooltipWorkId(null);
     }
  };
  
  // 모바일: 툴팁 외부 클릭 감지
  useEffect(() => {
    if (!isMobile || !tooltipWorkId) return;
    
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // 툴팁 자체나 작품명을 클릭한 경우 무시
      if (target.closest('.tooltip') || target.closest('.hover-line')) {
        return;
      }
      setTooltipWorkId(null);
    };
    
    // 짧은 딜레이 후 리스너 등록 (툴팁 열기 클릭과 충돌 방지)
    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isMobile, tooltipWorkId]);
  
  // 모바일: 스크롤 시 툴팁 닫기
  useEffect(() => {
    if (!isMobile || !tooltipWorkId) return;
    
    const handleScroll = () => {
      setTooltipWorkId(null);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile, tooltipWorkId]);

  // Scroll Logic
  useEffect(() => {
    if (typeof window === 'undefined' || loading) return;
    
    // 모바일에서는 커스텀 스크롤 로직 완전 비활성화
    if (window.innerWidth < 768) return;

    const s = state.current;
    
    const onResize = () => {
      s.winH = window.innerHeight;
      if (contentRef.current) {
        s.maxScroll = Math.max(0, contentRef.current.scrollHeight - s.winH + 100);
      }
    };
    
    const resizeObserver = new ResizeObserver(() => onResize());
    if (contentRef.current) resizeObserver.observe(contentRef.current);

    window.addEventListener('resize', onResize);
    setTimeout(onResize, 100);

    const onWheel = (e: WheelEvent) => {
      let delta = e.deltaY;
      delta *= 0.8; 
      s.target += delta;
      s.target = Math.max(0, Math.min(s.target, s.maxScroll));
    };

    const onTouchStart = (e: TouchEvent) => {
      s.isTouching = true;
      s.touch.start = e.touches[0].clientY;
      s.touch.prev = s.target;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!s.isTouching) return;
      
      const y = e.touches[0].clientY;
      const distance = (s.touch.start - y) * 2; 
      s.target = s.touch.prev + distance;
      s.target = Math.max(0, Math.min(s.target, s.maxScroll));
    };

    const onTouchEnd = () => {
      s.isTouching = false;
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    const render = () => {
      s.current += (s.target - s.current) * s.ease;
      
      if (Math.abs(s.target - s.current) < 0.1) {
        s.current = s.target;
      }
      
      if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(0, ${-s.current}px, 0)`;
      }

      if (thumbRef.current && s.maxScroll > 0) {
        const progress = s.current / s.maxScroll;
        const trackH = s.winH - 80;
        const thumbY = progress * (trackH - 60);
        thumbRef.current.style.transform = `translate3d(0, ${thumbY}px, 0)`;
      }

      s.rafId = requestAnimationFrame(render);
    };

    s.rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      cancelAnimationFrame(s.rafId);
      resizeObserver.disconnect();
    };
  }, [loading]);

  const groupedHistory = historyItems.reduce((acc, item) => {
    const year = item.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(item);
    return acc;
  }, {} as Record<string, HistoryItem[]>);

  const sortedYears = Object.keys(groupedHistory).sort((a, b) => parseInt(b) - parseInt(a));

  const contactLinks = aboutData?.contact ? [
    { label: 'WEBSITE', value: aboutData.contact.website, link: aboutData.contact.website.startsWith('http') ? aboutData.contact.website : `http://${aboutData.contact.website}` },
    { label: 'EMAIL', value: aboutData.contact.email, link: `mailto:${aboutData.contact.email}` },
    { label: 'INSTAGRAM', value: aboutData.contact.instagram, link: aboutData.contact.instagram.startsWith('http') ? aboutData.contact.instagram : `https://instagram.com/${aboutData.contact.instagram.replace('@', '')}` },
  ].filter(c => c.value) : [];

  if (loading) return <div className="min-h-screen bg-background" />;

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 md:fixed md:inset-0 w-full h-full bg-background text-foreground md:overflow-hidden font-sans selection:bg-foreground selection:text-background overflow-y-auto"
      style={{ fontFamily: 'Pretendard, "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
    >
      <div className="w-full h-full px-6 md:px-12 relative flex">
        
        {/* Left Column */}
        <div className="hidden md:flex flex-col w-[20%] h-full pt-28 md:pt-32 relative z-20">
           <div className="flex flex-col gap-6 max-w-full">
             <RevealText delay={0.2}>
               <div className="flex flex-col gap-1">
                 {/* Priority: ACF Name > Page Title */}
                 <h1 className="text-xl font-medium tracking-tight mb-4">
                   {aboutData?.name || aboutData?.title || 'About'}
                 </h1>
                 {aboutData?.profile_info && (
                   <div 
                     className="text-[14px] leading-relaxed text-foreground/80 font-sans whitespace-pre-line mb-4"
                     dangerouslySetInnerHTML={{ __html: aboutData.profile_info }}
                   />
                 )}
                 {aboutData?.profile_info2 && (
                   <div 
                     className="text-[14px] leading-relaxed text-foreground/80 font-sans whitespace-pre-line"
                     dangerouslySetInnerHTML={{ __html: aboutData.profile_info2 }}
                   />
                 )}
               </div>
             </RevealText>
           </div>

           <div className="absolute bottom-12 left-0 flex flex-col gap-4 pointer-events-auto">
              {contactLinks.map((item, idx) => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <RevealText delay={0.5 + (idx * 0.1)}>
                    <span className="text-[8px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1 block">
                        {item.label}
                    </span>
                    <ContactLink 
                      label={item.label}
                      value={item.value}
                      link={item.link}
                      onContactClick={item.label === 'EMAIL' ? () => setIsContactModalOpen(true) : undefined} 
                    />
                  </RevealText>
                </div>
              ))}
           </div>
        </div>

        {/* Right Column (Content) */}
        <div 
          className="flex-1 h-full relative"
          style={{ perspective: '1000px' }} 
        >
          <div 
            ref={scrollbarRef}
            className="absolute right-[-10px] md:right-0 top-32 bottom-12 w-[1px] bg-border z-50 hidden md:block"
          >
            <div 
              ref={thumbRef}
              className="w-[3px] h-[60px] bg-foreground/30 -ml-[1px]"
            />
          </div>

          <div 
            ref={contentRef}
            onClick={handleContentClick}
            onMouseOver={handleContentMouseOver}
            onMouseOut={handleContentMouseOut}
            className="relative md:absolute top-0 right-0 w-full md:w-[80%] pt-28 md:pt-32 pb-32 flex flex-col gap-20 md:will-change-transform"
          >
            {/* Mobile Header */}
            <div className="md:hidden flex flex-col gap-6 mb-12">
               {aboutData && (
                 <>
                    <RevealText delay={0.2}>
                      <div className="flex flex-col gap-1">
                        <h1 className="text-xl font-medium tracking-tight mb-4">
                           {aboutData.name || aboutData.title || 'About'}
                        </h1>
                        {aboutData.profile_info && (
                           <div 
                             className="text-[14px] leading-relaxed text-foreground/80 font-sans whitespace-pre-line mb-4"
                             dangerouslySetInnerHTML={{ __html: aboutData.profile_info }}
                           />
                        )}
                        {aboutData.profile_info2 && (
                           <div 
                             className="text-[14px] leading-relaxed text-foreground/80 font-sans whitespace-pre-line"
                             dangerouslySetInnerHTML={{ __html: aboutData.profile_info2 }}
                           />
                        )}
                      </div>
                    </RevealText>
                    
                    <div className="flex flex-col gap-4 mt-8 mb-8">
                       {contactLinks.map((item, idx) => (
                         <div key={item.label} className="flex flex-col gap-0.5">
                             <span className="text-[8px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1 block">
                                 {item.label}
                             </span>
                             <ContactLink 
                               label={item.label}
                               value={item.value}
                               link={item.link}
                               onContactClick={item.label === 'EMAIL' ? () => setIsContactModalOpen(true) : undefined} 
                             />
                         </div>
                       ))}
                    </div>
                 </>
               )}
            </div>

            {/* Bio Content */}
            {aboutData && aboutData.content && (
              <div className="flex flex-col gap-6 max-w-3xl">
                <RevealText delay={0.3}>
                   <div 
                     className="text-[16px] leading-relaxed text-foreground [&_p]:mb-4 [&_h2]:text-[12px] [&_h2]:font-serif [&_h2]:uppercase [&_h2]:tracking-[0.2em] [&_h2]:text-muted-foreground/70 [&_h2]:font-normal [&_h2]:mt-24 [&_h2]:mb-12 [&_ul]:list-none [&_ul]:pl-0 [&_li]:mb-2 [&_table]:!w-full [&_table]:!block [&_tbody]:!block [&_tr]:!flex [&_tr]:!flex-col [&_tr]:gap-2 md:[&_tr]:!flex-row md:[&_tr]:!gap-0 [&_tr]:mb-2 [&_tr>*:first-child]:!block [&_tr>*:last-child]:!block md:[&_tr>*:first-child]:!w-[64px] md:[&_tr>*:first-child]:!min-w-[64px] md:[&_tr>*:first-child]:shrink-0 md:[&_tr>*:first-child]:!mr-8 [&_tr>*:first-child]:w-full [&_tr>*:first-child]:font-mono [&_tr>*:first-child]:!text-[12px] [&_tr>*:first-child]:text-muted-foreground/50 [&_tr>*:first-child]:!font-normal [&_tr>*:first-child]:text-left [&_tr>*:last-child]:flex-1 [&_tr>*:last-child]:text-sm [&_tr>*:last-child]:font-light [&_tr>*:last-child]:leading-relaxed [&_tr]:relative [&_tr]:-mx-4 [&_tr]:px-4 [&_tr]:py-2 [&_tr]:rounded-lg [&_tr]:transition-all [&_tr]:duration-300 [&_tr:hover]:bg-[var(--color-bg-shift)]/80 [&_tr:hover]:!text-white [&_tr:hover_>_*]:!text-white md:[&_tr]:before:content-['→'] md:[&_tr]:before:absolute md:[&_tr]:before:left-2 md:[&_tr]:before:top-1/2 md:[&_tr]:before:-translate-y-1/2 md:[&_tr]:before:text-white md:[&_tr]:before:opacity-0 md:[&_tr:hover]:before:opacity-100 md:[&_tr]:before:-translate-x-2 md:[&_tr:hover]:before:translate-x-0 md:[&_tr]:before:transition-all md:[&_tr]:before:duration-300 md:[&_tr_>_*]:transition-transform md:[&_tr_>_*]:duration-300 md:[&_tr:hover_>_*]:translate-x-2 [&_tr_p]:!mb-0 md:[&_tr]:items-baseline"
                     dangerouslySetInnerHTML={{ __html: processedContent || '' }}
                   />
                </RevealText>
              </div>
            )}
            
            <div className="pt-24 opacity-30 hover:opacity-100 transition-opacity duration-500">
               <Footer />
            </div>
          </div>
        </div>
      </div>
      
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
      
      {/* Moved WorkModal to end and ensure z-index is high */}
      <WorkModal 
        workId={selectedWorkId} 
        onClose={() => setSelectedWorkId(null)} 
      />
      
      {/* Tooltip Transition Effect */}
      <TooltipTransition 
        hoveredWorkId={tooltipWorkId} 
        isOpen={false} 
        onClose={() => {}}
        onClick={() => {
          if (tooltipWorkId) {
            setTooltipWorkId(null);
            setSelectedWorkId(tooltipWorkId);
          }
        }}
        isMobile={isMobile}
      />

    </div>
  );
};