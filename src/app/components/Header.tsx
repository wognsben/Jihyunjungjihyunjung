import { useLanguage } from '@/contexts/LanguageContext';
import { SplitTextLink } from '@/app/components/SplitTextLink';

interface HeaderProps {
  currentView: 'index' | 'work' | 'work-detail' | 'about' | 'text';
  onNavigate: (view: 'index' | 'work' | 'work-detail' | 'about' | 'text') => void;
  isDarkBackground?: boolean;
}

type NavItem = 'work' | 'text' | 'about';

export const Header = ({ currentView, onNavigate, isDarkBackground = true }: HeaderProps) => {
  const { lang, setLang } = useLanguage();

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

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 mix-blend-difference"
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
              className="text-lg md:text-xl font-light tracking-tight"
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
        /* Mix-blend-mode를 사용할 때는 그림자가 오히려 가독성을 해칠 수 있어 제거하거나 최소화합니다 */
      `}</style>
    </header>
  );
};