import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Footer } from '@/app/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { ScrambleText } from '@/app/components/ui/ScrambleText';
import { ContactModal } from '@/app/components/ContactModal';
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
      // 모바일(768px 미만)에서는 애니메이션 없이 즉시 표시
      if (window.innerWidth < 768) {
        gsap.set(el.current, { y: '0%', opacity: 1 });
        return;
      }
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
    if (label === 'email' && onContactClick) {
      e.preventDefault();
      e.stopPropagation();
      onContactClick();
    }
  };

  return (
    <a 
      href={link} 
      target={label !== 'email' ? "_blank" : undefined}
      rel={label !== 'email' ? "noopener noreferrer" : undefined}
      onClick={handleClick}
      className="text-xs font-light hover:text-foreground/50 transition-colors relative inline-block md:after:content-[''] md:after:absolute md:after:bottom-0 md:after:left-0 md:after:w-0 md:after:h-[1px] md:after:bg-foreground md:after:transition-all md:after:duration-300 md:hover:after:w-full cursor-pointer"
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

    // Helper to check if text contains work title
    const findWorkIdInText = (text: string) => {
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
            let safeTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Allow spaces to match "no space" or "multiple spaces" or "nbsp"
            safeTitle = safeTitle.replace(/\s+/g, '[\\s\\u00A0]*');
            
            // Allow < and > to match &lt; and &gt;
            safeTitle = safeTitle.replace(/</g, '(?:<|&lt;)').replace(/>/g, '(?:>|&gt;)');

            const regex = new RegExp(`(${safeTitle})`, 'gi'); 
            
            if (regex.test(text)) {
                return work.id;
            }
        }
        return null;
    };

    elements.forEach(el => {
      const rawHtml = el.innerHTML;
      const parts = rawHtml.split(/<br\s*\/?>/i);
      
      const processedRows: { year: string, content: string, workId: string | null }[] = [];
      let hasYearEntry = false;

      parts.forEach(originalPart => {
        // Fix encoding issues (specifically en-dash)
        const part = originalPart.replace(/&#8211;/g, '–');

        const temp = document.createElement('div');
        temp.innerHTML = part;
        const text = (temp.textContent || '').replace(/[\u200B\uFEFF]/g, '').trim();
        
        const match = text.match(/^(\d{4}(?:[-.~]\d{2,4})?)\s+(.*)/s) || 
                      text.match(/^(\d{4}(?:[-.~]\d{2,4})?)(?=[^\w\s])(.*)/s) ||
                      text.match(/^(\d{4}(?:[-.~]\d{2,4})?)$/);
        
        if (match) {
          hasYearEntry = true;
          const yearStr = match[1];
          const restText = (match[2] || '').trim();
          
          let contentHtml: string;
          
          if (!restText) {
            // Year-only line (e.g. "<strong>2014</strong>") — no content after year
            contentHtml = '';
          } else {
            // Year + content on same line — remove the year from HTML
            const safeYear = yearStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
            const removeRegex = new RegExp(`^[\\s\\u200B\\uFEFF]*${safeYear}[\\s.,\\u00A0\\t]*`);
            
            contentHtml = part;
            if (removeRegex.test(contentHtml)) {
               contentHtml = contentHtml.replace(removeRegex, '');
            } else {
               // Try removing year wrapped in inline tags like <strong>2014</strong> or <b>2014</b>
               const taggedYearRegex = new RegExp(
                 `^[\\s\\u200B\\uFEFF]*(?:<(?:strong|b|em|span)[^>]*>\\s*)?${safeYear}(?:\\s*</(?:strong|b|em|span)>)?[\\s.,\\u00A0\\t]*`,
                 'i'
               );
               if (taggedYearRegex.test(contentHtml)) {
                 contentHtml = contentHtml.replace(taggedYearRegex, '');
               } else {
                 const entityRegex = new RegExp(`^[\\s\\u200B\\uFEFF]*${safeYear}(?:&nbsp;|[\\s.,\\u00A0\\t])*`);
                 contentHtml = contentHtml.replace(entityRegex, '');
               }
            }
            
            // Double-check: if after removal only empty tags remain, treat as empty
            const strippedCheck = contentHtml.replace(/<[^>]*>/g, '').trim();
            if (!strippedCheck) {
              contentHtml = '';
            }
          }
          
          if (!contentHtml) {
            // Year-only line: attach year to next content row
            processedRows.push({ year: yearStr, content: '', workId: null });
          } else {
            // Find if this row contains a work title
            const workId = findWorkIdInText(text);
            processedRows.push({ year: yearStr, content: contentHtml, workId });
          }
        } else {
          if (text.length > 0) {
             const workId = findWorkIdInText(text);
             // If previous row has a year but empty content, merge this content into it
             const prevRow = processedRows[processedRows.length - 1];
             if (prevRow && prevRow.year && !prevRow.content) {
               prevRow.content = part;
               prevRow.workId = prevRow.workId || workId;
             } else {
               processedRows.push({ year: '', content: part, workId });
             }
          }
        }
      });

      if (hasYearEntry && processedRows.length > 0) {
        const table = document.createElement('table');
        table.className = 'wp-block-table';
        const tbody = document.createElement('tbody');
        
        processedRows.forEach(row => {
           const tr = document.createElement('tr');
           
           // Add hover-line class and data-work-id to the entire row if it contains a work
           if (row.workId) {
             tr.className = 'hover-line';
             tr.setAttribute('data-work-id', row.workId);
           }
           
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

// Section header translations for About bio content
const translateSectionHeaders = (html: string, lang: string): string => {
  if (lang === 'ko' || !html) return html;
  
  // Longest phrases first to avoid partial matches
  const headers: [RegExp, string, string][] = [
    [/수상\s*경력\s*및\s*레지던스/g, 'Awards & Residencies', '受賞歴・レジデンス'],
    [/수상\s*경력/g, 'Awards', '賞歴'],
    [/레지던스/g, 'Residencies', 'レジデンス'],
    [/개인\s*전/g, 'Solo Exhibitions', '個展'],
    [/단체\s*전/g, 'Group Exhibitions', 'グループ展'],
    [/프로젝트/g, 'Projects', 'プロジェクト'],
    [/출\s*판/g, 'Publications', '出版'],
    [/학\s*력/g, 'Education', '学歴'],
  ];
  
  let result = html;
  
  for (const [regex, en, jp] of headers) {
    const translation = lang === 'en' ? en : lang === 'jp' ? jp : '';
    if (translation) {
      result = result.replace(regex, translation);
    }
  }
  
  return result;
};

export const About = () => {
  const { lang } = useLanguage();
  const { works } = useWorks();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  // Tooltip State
  const [tooltipWorkId, setTooltipWorkId] = useState<string | null>(null);
  const [isManualHover, setIsManualHover] = useState(false); // Track if user is manually hovering
  
  // Mobile Detection (768px 미만) — 레이아웃용
  const [isMobile, setIsMobile] = useState(false);
  // Touch Device Detection (1024px 미만) — 툴팁 동작용 (모바일+태블릿은 클릭 토글)
  const [isTouch, setIsTouch] = useState(false);
  
  // Intersection Observer State
  const [visibleWorkRows, setVisibleWorkRows] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Data State
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 툴팁 내부에 마우스가 있는지 추적 (ref로 관리 → 불필요한 리렌더 방지)
  const isInTooltip = useRef(false);

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

  // Mobile Detection (768px 미만)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTouch(window.innerWidth < 1025);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Process Content
  const processedContent = useMemo(() => {
    // Use ACF translated content when available, otherwise fall back to KO content with header translation
    let rawContent: string | undefined;
    if (lang === 'en' && aboutData?.content_en) {
      rawContent = aboutData.content_en;
    } else if (lang === 'jp' && aboutData?.content_jp) {
      rawContent = aboutData.content_jp;
    } else {
      rawContent = aboutData?.content;
    }
    
    const transformed = transformBioContent(rawContent, works, lang);
    
    // Only apply header translation when using KO fallback content
    if (lang !== 'ko' && !(lang === 'en' && aboutData?.content_en) && !(lang === 'jp' && aboutData?.content_jp)) {
      return translateSectionHeaders(transformed || '', lang);
    }
    
    return transformed;
  }, [aboutData?.content, aboutData?.content_en, aboutData?.content_jp, works, lang]);

  // Helper to safely replace name in profile text for translation
  const processProfileText = (text: string | undefined) => {
    if (!text) return '';
    
    if (lang === 'en') {
      let result = text;
      result = result.replace(/지현/g, '<span class="notranslate" translate="no">Jihyun Jung</span>');
      result = result.replace(/수원\s*생/g, 'Born in Suwon');
      result = result.replace(/서울\s*기반로\s*활동\s*중/g, 'Based in Seoul');
      result = result.replace(/\(1986\s*[–\-]\s*\)/g, '(1986 – )');
      return result;
    }
    
    if (lang === 'jp') {
      let result = text;
      result = result.replace(/정지현/g, 'チョン・ジヒョン');
      result = result.replace(/수원\s*생/g, '水原生まれ');
      result = result.replace(/서울\s*기반으로\s*활동\s*중/g, 'ソウルを拠点に活動中');
      result = result.replace(/\(1986\s*[–\-]\s*\)/g, '(1986 – )');
      return result;
    }
    
    return text;
  };

  // Event Handlers for Dynamic Content (React Synthetic Events)
  const handleContentClick = (e: any) => {
    const target = e.target as HTMLElement;
    const link = target.closest('.hover-line') as HTMLElement;
    
    if (link) {
      const id = link.getAttribute('data-work-id');
      if (id) {
        e.preventDefault();
        e.stopPropagation();
        
        // 모든 디바이스: 클릭 시 툴팁 토글 (open 버튼/썸네일 클릭으로만 상세 이동)
        if (tooltipWorkId === id) {
          setTooltipWorkId(null); // 같은 작품 재클릭 시 툴팁 닫기
        } else {
          setTooltipWorkId(id); // 툴팁 열기
        }
      }
    }
  };

  const handleContentMouseOver = (e: any) => {
    // 호버로 툴팁 열기 비활성화 — 클릭으로만 툴팁 토글
    return;
  };

  const handleContentMouseOut = (e: any) => {
    // 호버로 툴팁 닫기 비활성화 — 클릭으로만 툴팁 토글
    return;
  };

  const handleTooltipMouseEnter = () => {
    // 툴팁 진입 즉시 lock — 기 타이머 취소
    isInTooltip.current = true;
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setIsManualHover(true);
  };

  const handleTooltipMouseLeave = () => {
    // 툴팁 이탈 시 lock 해제, 짧은 딜레이 후 닫기
    isInTooltip.current = false;
    setIsManualHover(false);
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltipWorkId(null);
    }, 300);
  };
  
  // 모든 디바이스: 스크롤 시 툴팁 닫기
  useEffect(() => {
    if (!tooltipWorkId) return;
    
    // 모바일/태블릿: 네이티브 scroll 이벤트
    const scrollTarget = containerRef.current || window;
    
    const handleScroll = () => {
      setTooltipWorkId(null);
    };
    
    // 데스크탑(1025px+): 커스텀 스크롤이므로 wheel 이벤트로 감지
    const handleWheel = () => {
      setTooltipWorkId(null);
    };
    
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    if (scrollTarget !== window) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('wheel', handleWheel, { passive: true });
    
    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll);
      if (scrollTarget !== window) {
        window.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('wheel', handleWheel);
    };
  }, [tooltipWorkId]);

  // Intersection Observer for auto-showing work thumbnails on scroll (Tablet+)
  // DISABLED for now - manual hover only
  /*
  useEffect(() => {
    if (isMobile || !contentRef.current || loading) return;
    
    // Create Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const workId = entry.target.getAttribute('data-work-id');
          if (!workId) return;
          
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            // Row is visible in viewport - show thumbnail ONLY if not manually hovering
            setVisibleWorkRows((prev) => new Set(prev).add(workId));
            
            // Check if user is manually hovering before auto-showing
            if (!isManualHover) {
              setTooltipWorkId(workId);
            }
          } else {
            // Row is out of viewport - hide thumbnail
            setVisibleWorkRows((prev) => {
              const next = new Set(prev);
              next.delete(workId);
              return next;
            });
            
            // Only hide if not manually hovering
            if (!isManualHover && tooltipWorkId === workId) {
              setTooltipWorkId(null);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -20% 0px', // Center area of viewport
        threshold: [0, 0.5, 1]
      }
    );
    
    // Observe all work rows
    const observeRows = () => {
      if (!contentRef.current) return;
      const workRows = contentRef.current.querySelectorAll('.hover-line[data-work-id]');
      workRows.forEach((row) => {
        if (observerRef.current) {
          observerRef.current.observe(row);
        }
      });
    };
    
    // Wait for content to be rendered
    const timer = setTimeout(observeRows, 500);
    
    return () => {
      clearTimeout(timer);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isMobile, loading, processedContent]);
  */

  // Scroll Logic
  useEffect(() => {
    if (typeof window === 'undefined' || loading) return;
    
    // 모바일에서는 커스텀 스크롤 로직 완전 비활성화
    // 태블릿(768~1024)도 네이티브 스크롤 사용 → 1025px 이상만 커스텀 스크롤
    if (window.innerWidth < 1025) return;

    const s = state.current;
    
    const onResize = () => {
      s.winH = window.innerHeight;
      if (contentRef.current) {
        s.maxScroll = Math.max(0, contentRef.current.scrollHeight - s.winH);
      }
    };
    
    const resizeObserver = new ResizeObserver(() => onResize());
    if (contentRef.current) resizeObserver.observe(contentRef.current);

    window.addEventListener('resize', onResize);
    setTimeout(onResize, 100);
    // 3차: processedContent 변경 후 DOM 안정화 시점에 maxScroll 재계산
    setTimeout(onResize, 500);
    setTimeout(onResize, 1500);

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
  }, [loading, processedContent]);

  const groupedHistory = historyItems.reduce((acc, item) => {
    const year = item.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(item);
    return acc;
  }, {} as Record<string, HistoryItem[]>);

  const sortedYears = Object.keys(groupedHistory).sort((a, b) => parseInt(b) - parseInt(a));

  const contactLinks = aboutData?.contact ? [
    { label: 'website', value: aboutData.contact.website, link: aboutData.contact.website.startsWith('http') ? aboutData.contact.website : `http://${aboutData.contact.website}` },
    { label: 'email', value: aboutData.contact.email, link: `mailto:${aboutData.contact.email}` },
    { label: 'instagram', value: aboutData.contact.instagram, link: aboutData.contact.instagram.startsWith('http') ? aboutData.contact.instagram : `https://instagram.com/${aboutData.contact.instagram.replace('@', '')}` },
  ].filter(c => c.value) : [];

  if (loading) return <div className="min-h-screen bg-background" />;

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 min-[1025px]:fixed min-[1025px]:inset-0 w-full h-full bg-background text-foreground min-[1025px]:overflow-hidden font-sans selection:bg-foreground selection:text-background overflow-y-auto"
      style={{ fontFamily: 'Pretendard, "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
    >
      <div className="w-full min-h-full min-[1025px]:h-full px-6 md:px-12 relative flex">
        
        {/* Left Column */}
        <div className="hidden md:flex flex-col w-[20%] md:sticky md:top-0 md:h-screen md:overflow-hidden min-[1025px]:static min-[1025px]:h-full pt-28 md:pt-32 relative z-20 md:justify-between min-[1025px]:justify-start">
           <div className="flex flex-col gap-6 max-w-full">
             <RevealText delay={0.2}>
               <div className="flex flex-col gap-1">
                 {/* Priority: ACF Name > Page Title */}
                 <h1 
                   className={`text-xl font-medium tracking-tight mb-4${lang === 'en' ? ' notranslate' : ''}`}
                   translate={lang === 'en' ? 'no' : undefined}
                 >
                   {lang === 'en' ? 'Jihyun Jung' : lang === 'jp' ? 'チョン・ジヒョン' : (aboutData?.name || aboutData?.title || 'About')}
                 </h1>
                 {aboutData?.profile_info && (
                   <div 
                     className={`text-[14px] leading-relaxed text-foreground/80 font-sans whitespace-pre-line mb-4${lang === 'ko' ? ' notranslate' : ''}`}
                     translate={lang === 'ko' ? 'no' : undefined}
                     dangerouslySetInnerHTML={{ __html: processProfileText(aboutData.profile_info) }}
                   />
                 )}
                 {aboutData?.profile_info2 && (
                   <div 
                     className={`text-[14px] leading-relaxed text-foreground/80 font-sans whitespace-pre-line${lang === 'ko' ? ' notranslate' : ''}`}
                     translate={lang === 'ko' ? 'no' : undefined}
                     dangerouslySetInnerHTML={{ __html: processProfileText(aboutData.profile_info2) }}
                   />
                 )}
               </div>
             </RevealText>
           </div>

           <div className="mt-12 md:mt-8 min-[1025px]:mt-0 min-[1025px]:absolute min-[1025px]:bottom-12 min-[1025px]:left-0 flex flex-col gap-4 pointer-events-auto md:pb-8 min-[1025px]:pb-0">
              {contactLinks.map((item, idx) => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <RevealText delay={0.5 + (idx * 0.1)}>
                    <span className="text-[10px] font-mono text-muted-foreground/50 tracking-widest mb-1 block">
                        {item.label}
                    </span>
                    <ContactLink 
                      label={item.label}
                      value={item.value}
                      link={item.link}
                      onContactClick={item.label === 'email' ? () => setIsContactModalOpen(true) : undefined} 
                    />
                  </RevealText>
                </div>
              ))}
           </div>
        </div>

        {/* Right Column (Content) */}
        <div 
          className="flex-1 min-h-full min-[1025px]:h-full relative"
          style={{ perspective: '1000px' }} 
        >
          <div 
            ref={scrollbarRef}
            className="absolute right-[-10px] min-[1025px]:right-0 top-32 bottom-12 w-[1px] bg-border z-50 hidden min-[1025px]:block"
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
            className="relative min-[1025px]:absolute top-0 right-0 w-full md:w-[75%] md:ml-auto pt-28 md:pt-32 pb-8 flex flex-col gap-20 min-[1025px]:will-change-transform min-[1025px]:w-[80%] min-[1025px]:ml-0"
          >
            {/* Mobile Header */}
            <div className="md:hidden flex flex-col gap-6 mb-12">
               {aboutData && (
                 <>
                    <RevealText delay={0.2}>
                      <div className="flex flex-col gap-1">
                        <h1 
                          className={`text-xl font-medium tracking-tight mb-4${lang === 'en' ? ' notranslate' : ''}`}
                          translate={lang === 'en' ? 'no' : undefined}
                        >
                           {lang === 'en' ? 'Jihyun Jung' : lang === 'jp' ? 'チョン・ジヒョン' : (aboutData?.name || aboutData?.title || 'About')}
                        </h1>
                        {aboutData.profile_info && (
                           <div 
                             className={`text-[14px] leading-relaxed text-foreground/80 font-sans whitespace-pre-line mb-4${lang === 'ko' ? ' notranslate' : ''}`}
                             translate={lang === 'ko' ? 'no' : undefined}
                             dangerouslySetInnerHTML={{ __html: processProfileText(aboutData.profile_info) }}
                           />
                        )}
                        {aboutData.profile_info2 && (
                           <div 
                             className={`text-[14px] leading-relaxed text-foreground/80 font-sans whitespace-pre-line${lang === 'ko' ? ' notranslate' : ''}`}
                             translate={lang === 'ko' ? 'no' : undefined}
                             dangerouslySetInnerHTML={{ __html: processProfileText(aboutData.profile_info2) }}
                           />
                        )}
                      </div>
                    </RevealText>
                    
                    <div className="flex flex-col gap-4 mt-8 mb-8">
                       {contactLinks.map((item, idx) => (
                         <div key={item.label} className="flex flex-col gap-0.5">
                             <span className="text-[10px] font-mono text-muted-foreground/50 tracking-widest mb-1 block">
                                 {item.label}
                             </span>
                             <ContactLink 
                               label={item.label}
                               value={item.value}
                               link={item.link}
                               onContactClick={item.label === 'email' ? () => setIsContactModalOpen(true) : undefined} 
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
                     className={`text-[16px] leading-normal text-foreground [&_p]:mb-4 [&_h2]:text-[12px] [&_h2]:font-serif [&_h2]:uppercase [&_h2]:tracking-[0.2em] [&_h2]:text-muted-foreground/70 [&_h2]:font-normal [&_h2]:mt-24 [&_h2]:mb-12 [&_ul]:list-none [&_ul]:pl-0 [&_li]:mb-2 [&_table]:!w-full [&_table]:!block [&_tbody]:!block [&_tr]:!flex [&_tr]:!flex-row [&_tr]:gap-2 md:[&_tr]:gap-0 [&_tr]:mb-1.5 [&_tr>*:first-child]:!block [&_tr>*:last-child]:!block [&_tr>*:first-child]:!w-[40px] md:[&_tr>*:first-child]:!w-[64px] [&_tr>*:first-child]:!min-w-[40px] md:[&_tr>*:first-child]:!min-w-[64px] [&_tr>*:first-child]:shrink-0 md:[&_tr>*:first-child]:!mr-8 [&_tr>*:first-child]:font-mono [&_tr>*:first-child]:!text-[12px] [&_tr>*:first-child]:text-muted-foreground/50 [&_tr>*:first-child]:!font-normal [&_tr>*:first-child]:text-left [&_tr>*:last-child]:flex-1 [&_tr>*:last-child]:text-sm [&_tr>*:last-child]:font-light [&_tr>*:last-child]:leading-snug max-[1025px]:[&_tr>*:last-child]:truncate [&_tr]:relative [&_tr]:-mx-4 [&_tr]:px-4 [&_tr]:py-2 [&_tr]:rounded-lg [&_tr]:transition-all [&_tr]:duration-300 [&_tr.hover-line]:cursor-pointer [&_tr.hover-line:hover]:bg-white [&_tr.hover-line:hover]:!text-foreground [&_tr.hover-line:hover_>_*]:!text-foreground md:[&_tr.hover-line]:before:content-['→'] md:[&_tr.hover-line]:before:absolute md:[&_tr.hover-line]:before:left-2 md:[&_tr.hover-line]:before:top-1/2 md:[&_tr.hover-line]:before:-translate-y-1/2 md:[&_tr.hover-line]:before:text-foreground md:[&_tr.hover-line]:before:opacity-0 md:[&_tr.hover-line:hover]:before:opacity-100 md:[&_tr.hover-line]:before:-translate-x-2 md:[&_tr.hover-line:hover]:before:translate-x-0 md:[&_tr.hover-line]:before:transition-all md:[&_tr.hover-line]:before:duration-300 md:[&_tr.hover-line_>_*]:transition-transform md:[&_tr.hover-line_>_*]:duration-300 md:[&_tr.hover-line:hover_>_*]:translate-x-2 [&_tr_p]:!mb-0 md:[&_tr]:items-baseline${lang === 'ko' ? ' notranslate' : ''}`}
                     translate={lang === 'ko' ? 'no' : undefined}
                     dangerouslySetInnerHTML={{ __html: processedContent }}
                   />
                </RevealText>
              </div>
            )}
            
            <div className="pt-16 pb-4 opacity-100 md:opacity-30 md:hover:opacity-100 transition-opacity duration-500">
               <Footer />
            </div>
          </div>
        </div>
      </div>
      
      {/* pointer-events 스타 주입 제거 — 무한 루프의 원인이었음.
           tooltipWorkId가 설정되면 handleContentMouseOver에서 이미 새 툴팁 열기를 차단하므로 불필요 */}

      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
      
      {/* Tooltip Transition Effect */}
      <TooltipTransition 
        hoveredWorkId={tooltipWorkId} 
        isOpen={false} 
        onClose={() => setTooltipWorkId(null)}
        onClick={() => {
          if (tooltipWorkId) {
            // ★ 툴팁을 먼저 닫지 않고 바로 이동
            // (닫는 순간 마우스 아래 행이 재발동하는 버그 방지)
            window.location.hash = `#/work/${tooltipWorkId}`;
          }
        }}
        isMobile={isTouch}
        onMouseEnter={handleTooltipMouseEnter}
        onMouseLeave={handleTooltipMouseLeave}
      />

    </div>
  );
};