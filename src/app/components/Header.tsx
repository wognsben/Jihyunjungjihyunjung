import { useLanguage } from '@/contexts/LanguageContext';
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

  // --------------------------------------------------------------------------------
  // [Premium UX] Smart Scroll Behavior
  // 스크롤을 내릴 때는 작품에 집중하도록 헤더를 숨기고(Retreat),
  // 올릴 때는 네비게이션을 위해 다시 드러냅니다(Reveal).
  // 최상단에서는 항상 보입니다.
  // --------------------------------------------------------------------------------
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // 최상단이거나 스크롤을 올릴 때 보임
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
  // 검정 배경 -> 텍스트가 흰색으로 반전
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
      case 'index': return 'INDEX / OVERVIEW';
      case 'work': return 'SELECTED WORKS';
      case 'work-detail': 
        if (detailTitle) {
          return (
            <span className="flex items-baseline gap-2">
              {/* Italiana 폰트 적용: 우아함을 강조 */}
              <span className="font-['Italiana'] text-sm md:text-base tracking-widest opacity-100 relative top-[1px]">
                {detailTitle.toUpperCase()}
              </span>
            </span>
          );
        }
        return 'DETAIL VIEW';
      case 'text': return 'CRITIQUE & ESSAYS';
      case 'text-detail': 
        if (detailTitle) {
          return (
            <span className="flex items-baseline gap-2">
              <span className="font-['Italiana'] text-sm md:text-base tracking-widest opacity-100 relative top-[1px]">
                {detailTitle.toUpperCase()}
              </span>
            </span>
          );
        }
        return 'READING';
      case 'about': return 'STUDIO INFORMATION';
      default: return '';
    }
  };

  return (
    <>
      {/* 1. Main Navigation (Disappears on Scroll Down) */}
      <header 
        className={`
          fixed top-0 left-0 right-0 z-50 mix-blend-difference
          transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isVisible ? 'translate-y-0' : '-translate-y-full'}
        `}
        style={{
          backgroundColor: 'transparent',
          borderBottom: 'none',
        }}
      >
        <div className="px-6 md:px-12 py-4 md:py-6 text-white">
          {/* Logo + Navigation */}
          <div className="flex flex-col gap-3 md:gap-4">
            {/* Top Row: Logo + Language */}
            <div className="flex items-center justify-between">
              {/* Logo - Left */}
              <SplitTextLink
                text="jihyunjung"
                onClick={() => onNavigate('index')}
                isActive={false}
                className="text-lg md:text-xl font-extralight tracking-tight"
                activeColor={baseColor}
                inactiveColor={baseColor}
                hoverColor={hoverColor}
                underlineColor={borderColor}
                showUnderline={false}
              />

              {/* Language Toggle - Right */}
              <div className="flex items-center gap-2">
                {languages.map((language, index) => (
                  <span key={language.code} className="flex items-center gap-2">
                    <button
                      onClick={() => setLang(language.code)}
                      className={`text-[10px] md:text-xs uppercase tracking-[0.1em] transition-all font-light ${
                        lang === language.code 
                          ? 'text-white' 
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {language.label}
                    </button>
                    {index < languages.length - 1 && (
                      <span className={`text-[10px] md:text-xs ${separatorColor}`}>/</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Row: Navigation */}
            <nav className="flex items-center gap-6 md:gap-10">
              <SplitTextLink
                text="WORK"
                onClick={() => handleNavClick('work')}
                isActive={currentView === 'work'}
                className="text-xs md:text-sm uppercase tracking-[0.15em] font-light"
                activeColor="text-white"
                inactiveColor={inactiveColor}
                hoverColor={hoverColor}
                underlineColor={borderColor}
              />

              <SplitTextLink
                text="TEXT"
                onClick={() => handleNavClick('text')}
                isActive={currentView === 'text'}
                className="text-xs md:text-sm uppercase tracking-[0.15em] font-light"
                activeColor="text-white"
                inactiveColor={inactiveColor}
                hoverColor={hoverColor}
                underlineColor={borderColor}
              />

              <SplitTextLink
                text="ABOUT"
                onClick={() => handleNavClick('about')}
                isActive={currentView === 'about'}
                className="text-xs md:text-sm uppercase tracking-[0.15em] font-light"
                activeColor="text-white"
                inactiveColor={inactiveColor}
                hoverColor={hoverColor}
                underlineColor={borderColor}
              />
            </nav>
          </div>
        </div>

        <style>{`
          header {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `}</style>
      </header>

      {/* 2. Context Indicator (Appears when Main Nav is gone) */}
      {/* 
          Main Header가 사라질 때(Scroll Down), 그 빈 자리를 채우는 미니멀한 상태 표시줄입니다.
          mix-blend-difference를 유지하여 어떤 이미지 위에서도 가독성을 확보합니다.
          약간의 딜레이(delay-100)를 주어 헤더가 사라진 후 등장하는 '교차' 느낌을 줍니다.
      */}
      <div 
        className={`
          fixed top-0 left-0 z-40 px-6 md:px-12 py-4 md:py-6 mix-blend-difference pointer-events-none
          transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-100
          ${!isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        `}
      >
        <div className="flex items-center gap-3">
          {/* 
            Premium Indicator: The Pixel
            완벽한 정사각형(Square)으로 "시니컬함"과 "정확성"을 표현합니다.
            애니메이션을 제거하여(Static) 변하지 않는 본질을 암시합니다.
          */}
          <div className="w-[3px] h-[3px] bg-white rounded-none" />
          
          {/* Context Text */}
          <span className="text-white font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase opacity-80">
            {renderContextLabel()}
          </span>
        </div>
      </div>
    </>
  );
};