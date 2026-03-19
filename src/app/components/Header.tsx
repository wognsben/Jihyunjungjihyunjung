import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { SplitTextLink } from '@/app/components/SplitTextLink';
import { useState, useEffect } from 'react';

interface HeaderProps {
  currentView: 'index' | 'work' | 'work-detail' | 'about' | 'text' | 'text-detail';
  onNavigate: (view: 'index' | 'work' | 'work-detail' | 'about' | 'text') => void;
  isDarkBackground?: boolean;
  detailTitle?: string; // 상세 페이지에서 보여줄 제목 (옵션)
}

type NavItem = 'work' | 'text' | 'about';

export const Header = ({ currentView, onNavigate, isDarkBackground = true, detailTitle }: HeaderProps) => {
  const { lang, setLang } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Check if current view is About page (for mobile header styling)
  const isAboutPage = currentView === 'about';

  // --------------------------------------------------------------------------------
  // [Premium UX] Smart Scroll Behavior
  // 스크롤을 내릴 때는 작품에 집중하도록 헤더를 숨기고(Retreat),
  // 올릴 때는 네비게이션을 위해 다시 드러냅니다(Reveal).
  // 최상단에서는 항상 보입니다.
  // --------------------------------------------------------------------------------
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // 상단이거나 스크롤을 올릴 때 보임
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // 내리는 중 (100px 이상 내려갔을 때부터 숨김 시작)
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // 올리는 중
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    // 성능 최적화를 위한 Passive Event Listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const languages: Array<{ code: 'ko' | 'en' | 'jp'; label: string }> = [
    { code: 'ko', label: 'KO' },
    { code: 'en', label: 'EN' },
    { code: 'jp', label: 'JP' }
  ];

  const handleNavClick = (item: NavItem) => {
    if (item === 'work') {
      onNavigate('work');
    } else if (item === 'text') {
      onNavigate('text');
    } else if (item === 'about') {
      onNavigate('about');
    }
  };

  // --------------------------------------------------------------------------------
  // [Architect's Solution] Smart Contrast System
  // Mix-blend-mode: difference를 사용하여 배경색에 관계없이 항상 최적의 대비를 확보합니다.
  // 흰 배경 -> 텍스트가 검정으로 반전
  // 정 배경 -> 텍스트가 흰색으로 반전
  // --------------------------------------------------------------------------------
  
  // 항상 밝은 색상(White)을 기본으로 설정합니다.
  // mix-blend-difference가 적용되면 배경에 따라 자동으로 반전됩니다.
  const baseColor = 'text-white'; 
  const inactiveColor = 'text-white/60'; // 가독성을 위해 불투명도 상향 조정 (40% -> 60%)
  const hoverColor = 'hover:text-white';
  const borderColor = 'bg-white';
  const separatorColor = 'text-white/30';

  // --------------------------------------------------------------------------------
  // [Cynical Detail] Context Label Generator (Render Function)
  // 현재 뷰에 따라 라벨을 렌더링합니다.
  // work-detail의 경우, 제목에 우아한 Serif 폰트(Italiana)를 적용하여
  // 데이터(Mono)와 본질(Serif)을 시각적으로 분리합니다.
  // --------------------------------------------------------------------------------
  const renderContextLabel = () => {
    switch (currentView) {
      case 'index': return 'index / overview';
      case 'work': return 'work';
      case 'work-detail': 
        if (detailTitle) {
          return (
            <span className="flex items-baseline gap-2">
              {/* Italiana 폰트 적용: 우아함을 강조 */}
              <span className="font-['Italiana'] text-xs md:text-sm tracking-widest opacity-100 relative top-[1px] max-w-[120px] md:max-w-[220px] leading-tight break-words block">
                {detailTitle}
              </span>
            </span>
          );
        }
        return 'detail view';
      case 'text': return 'text';
      case 'text-detail': 
        if (detailTitle) {
          const parts = detailTitle.split('_');
          const hasAuthor = parts.length > 1;
          const titlePart = parts[0].trim();
          const authorPart = hasAuthor ? parts.slice(1).join('_').trim() : '';

          return (
            <span className="flex items-baseline gap-2">
              <span className="font-['Italiana'] text-[10px] min-[1025px]:text-sm tracking-widest opacity-100 relative top-[1px] max-w-[100px] min-[1025px]:max-w-[220px] leading-tight break-words block">
                {hasAuthor ? (
                  <>
                    {titlePart}
                    <span className="block opacity-70 mt-1">_{authorPart}</span>
                  </>
                ) : (
                  detailTitle
                )}
              </span>
            </span>
          );
        }
        return 'reading';
      case 'about': return 'about';
      default: return '';
    }
  };

  return (
    <>
      {/* 1. Main Navigation (Disappears on Scroll Down) */}
      <header 
        className={`
          fixed top-0 left-0 right-0 z-[9999999] pointer-events-none
          transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isVisible ? 'translate-y-0' : '-translate-y-full'}
          ${isAboutPage ? 'max-[767px]:bg-background' : 'mix-blend-difference'}
        `}
        style={{
          backgroundColor: 'transparent',
          borderBottom: 'none',
        }}
      >
        {/* Gradient fade at bottom - mobile About page only */}
        {isAboutPage && (
          <div className="max-[767px]:absolute max-[767px]:bottom-0 max-[767px]:left-0 max-[767px]:right-0 max-[767px]:h-[12px] max-[767px]:pointer-events-none hidden max-[767px]:block"
            style={{
              background: 'linear-gradient(to bottom, rgba(var(--background-rgb), 1) 0%, rgba(var(--background-rgb), 0) 100%)'
            }}
          />
        )}
        
        <div className={`px-6 md:px-12 py-4 md:py-6 pointer-events-auto relative z-[9999999] ${isAboutPage ? 'max-[767px]:text-foreground' : 'text-white'}`}>
          {/* Logo + Navigation */}
          <div className="flex flex-col gap-3 md:gap-4">
            {/* Top Row: Logo + Language */}
            <div className="flex items-center justify-between">
              {/* Logo - Left */}
              <div>
                <SplitTextLink
                  text="Jihyun Jung"
                  onClick={() => onNavigate('index')}
                  isActive={false}
                  className="text-lg md:text-xl font-extralight tracking-tight cursor-pointer"
                  activeColor={isAboutPage ? 'max-[767px]:text-foreground md:text-white' : baseColor}
                  inactiveColor={isAboutPage ? 'max-[767px]:text-foreground md:text-white' : baseColor}
                  hoverColor={isAboutPage ? 'max-[767px]:hover:text-foreground/70 md:hover:text-white' : hoverColor}
                  underlineColor={isAboutPage ? 'max-[767px]:bg-foreground md:bg-white' : borderColor}
                  showUnderline={false}
                />
              </div>

              {/* Language Toggle - Right */}
              <div className="flex items-center gap-2">
                {languages.map((language, index) => (
                  <span key={language.code} className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        console.log(`[UI Interaction] Language button clicked: ${language.code}`);
                        setLang(language.code);
                      }}
                      className={`text-[10px] md:text-xs uppercase tracking-[0.1em] transition-all font-light cursor-pointer select-none p-2 -m-2 ${
                        isAboutPage 
                          ? (lang === language.code 
                              ? 'max-[767px]:text-foreground md:text-white' 
                              : 'max-[767px]:text-foreground/50 max-[767px]:hover:text-foreground md:text-white/50 md:hover:text-white')
                          : (lang === language.code 
                              ? 'text-white' 
                              : 'text-white/50 hover:text-white')
                      }`}
                      style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    >
                      {language.label}
                    </button>
                    {index < languages.length - 1 && (
                      <span className={`text-[10px] md:text-xs ${isAboutPage ? 'max-[767px]:text-foreground/30 md:text-white/30' : separatorColor}`}>/</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Row: Navigation */}
            <nav className="flex items-center gap-6 md:gap-10">
              <SplitTextLink
                text="work"
                onClick={() => handleNavClick('work')}
                isActive={currentView === 'work'}
                className="text-xs md:text-sm tracking-[0.15em] font-light cursor-pointer"
                activeColor={isAboutPage ? 'max-[767px]:text-foreground md:text-white' : 'text-white'}
                inactiveColor={isAboutPage ? 'max-[767px]:text-foreground/60 md:text-white/60' : inactiveColor}
                hoverColor={isAboutPage ? 'max-[767px]:hover:text-foreground md:hover:text-white' : hoverColor}
                underlineColor={isAboutPage ? 'max-[767px]:bg-foreground md:bg-white' : borderColor}
              />

              <SplitTextLink
                text="text"
                onClick={() => handleNavClick('text')}
                isActive={currentView === 'text'}
                className="text-xs md:text-sm tracking-[0.15em] font-light cursor-pointer"
                activeColor={isAboutPage ? 'max-[767px]:text-foreground md:text-white' : 'text-white'}
                inactiveColor={isAboutPage ? 'max-[767px]:text-foreground/60 md:text-white/60' : inactiveColor}
                hoverColor={isAboutPage ? 'max-[767px]:hover:text-foreground md:hover:text-white' : hoverColor}
                underlineColor={isAboutPage ? 'max-[767px]:bg-foreground md:bg-white' : borderColor}
              />

              <SplitTextLink
                text="about"
                onClick={() => handleNavClick('about')}
                isActive={currentView === 'about'}
                className="text-xs md:text-sm tracking-[0.15em] font-light cursor-pointer"
                activeColor={isAboutPage ? 'max-[767px]:text-foreground md:text-white' : 'text-white'}
                inactiveColor={isAboutPage ? 'max-[767px]:text-foreground/60 md:text-white/60' : inactiveColor}
                hoverColor={isAboutPage ? 'max-[767px]:hover:text-foreground md:hover:text-white' : hoverColor}
                underlineColor={isAboutPage ? 'max-[767px]:bg-foreground md:bg-white' : borderColor}
              />
            </nav>
          </div>
        </div>

        <style>{`
          header {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          /* Mobile/Tablet: Hide header when contact modal is open */
          @media (max-width: 1024px) {
            body.contact-modal-open header {
              display: none !important;
            }
          }
        `}</style>
      </header>

      {/* 2. Context Indicator (Appears when Main Nav is gone) */}
      <div 
        className={`
          fixed top-0 left-0 z-40 px-6 md:px-12 py-4 md:py-6 pointer-events-none
          transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-100
          ${!isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
          ${isAboutPage ? 'max-[767px]:text-foreground' : 'mix-blend-difference'}
        `}
      >
        {currentView === 'text-detail' ? (
          <>
            {/* Mobile: ← back 버튼 */}
            <button
              onClick={() => { window.location.hash = '#/text'; }}
              className={`flex md:hidden items-center gap-3 pointer-events-auto cursor-pointer bg-transparent border-none focus:outline-none group ${isAboutPage ? 'max-[767px]:text-foreground' : ''}`}
            >
              <svg className={`w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity duration-300 ${isAboutPage ? 'max-[767px]:stroke-foreground' : ''}`} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              <span className={`font-mono text-[10px] tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity duration-300 ${isAboutPage ? 'max-[767px]:text-foreground' : 'text-white'}`}>
                back
              </span>
            </button>
            {/* Tablet/Desktop: 기존 context label (제목) */}
            <div className="hidden md:flex items-center gap-3">
              <div className={`w-[3px] h-[3px] rounded-none ${isAboutPage ? 'max-[767px]:bg-foreground md:bg-white' : 'bg-white'}`} />
              <span className={`font-mono text-[10px] md:text-xs tracking-[0.2em] opacity-80 ${isAboutPage ? 'max-[767px]:text-foreground md:text-white' : 'text-white'}`}>
                {renderContextLabel()}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className={`w-[3px] h-[3px] rounded-none ${isAboutPage ? 'max-[767px]:bg-foreground md:bg-white' : 'bg-white'}`} />
            <span className={`font-mono text-[10px] md:text-xs tracking-[0.2em] opacity-80 ${isAboutPage ? 'max-[767px]:text-foreground md:text-white' : 'text-white'}`}>
              {renderContextLabel()}
            </span>
          </div>
        )}
      </div>
    </>
  );
};