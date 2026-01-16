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

  // Dynamic color based on background brightness (only for index page)
  const textColor = currentView === 'index' 
    ? (isDarkBackground ? 'text-white' : 'text-black')
    : 'text-[var(--premium-black)]'; // Premium black for Work/Text/About pages
  
  const textColorInactive = currentView === 'index'
    ? (isDarkBackground ? 'text-white/40' : 'text-black/40')
    : 'text-[var(--premium-black)]/40';
  
  const textColorHover = currentView === 'index'
    ? (isDarkBackground ? 'hover:text-white/70' : 'hover:text-black/70')
    : 'hover:text-[var(--premium-black-soft)]';
  
  const textColorLangInactive = currentView === 'index'
    ? (isDarkBackground ? 'text-white/30 hover:text-white/60' : 'text-black/30 hover:text-black/60')
    : 'text-[var(--premium-black)]/30 hover:text-[var(--premium-black)]/60';
  
  const borderColor = currentView === 'index'
    ? (isDarkBackground ? 'bg-white' : 'bg-black')
    : 'bg-[var(--premium-black)]';
  
  const separatorColor = currentView === 'index'
    ? (isDarkBackground ? 'text-white/15' : 'text-black/15')
    : 'text-[var(--premium-black)]/15';

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: 'transparent', // All pages now have transparent header
        borderBottom: 'none',
      }}
    >
      <div className="px-6 md:px-12 py-4 md:py-6">
        {/* Logo + Navigation */}
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Top Row: Logo + Language */}
          <div className="flex items-center justify-between">
            {/* Logo - Left */}
            <SplitTextLink
              text="jihyunjung"
              onClick={() => onNavigate('index')}
              isActive={false}
              className="text-lg md:text-xl"
              style={{
                fontWeight: 300,
                letterSpacing: '-0.01em',
              }}
              activeColor={textColor}
              inactiveColor={textColor}
              hoverColor={textColorHover}
              underlineColor={borderColor}
              showUnderline={false}
            />

            {/* Language Toggle - Right */}
            <div className="flex items-center gap-2">
              {languages.map((language, index) => (
                <span key={language.code} className="flex items-center gap-2">
                  <button
                    onClick={() => setLang(language.code)}
                    className={`text-[10px] md:text-xs uppercase tracking-wider transition-all font-mono ${
                      lang === language.code 
                        ? textColor 
                        : textColorLangInactive
                    }`}
                    style={{
                      letterSpacing: '0.1em',
                    }}
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
              className="text-xs md:text-sm uppercase font-mono"
              style={{
                letterSpacing: '0.15em',
              }}
              activeColor={textColor}
              inactiveColor={textColorInactive}
              hoverColor={textColorHover}
              underlineColor={borderColor}
            />

            <SplitTextLink
              text="TEXT"
              onClick={() => handleNavClick('text')}
              isActive={currentView === 'text'}
              className="text-xs md:text-sm uppercase font-mono"
              style={{
                letterSpacing: '0.15em',
              }}
              activeColor={textColor}
              inactiveColor={textColorInactive}
              hoverColor={textColorHover}
              underlineColor={borderColor}
            />

            <SplitTextLink
              text="ABOUT"
              onClick={() => handleNavClick('about')}
              isActive={currentView === 'about'}
              className="text-xs md:text-sm uppercase font-mono"
              style={{
                letterSpacing: '0.15em',
              }}
              activeColor={textColor}
              inactiveColor={textColorInactive}
              hoverColor={textColorHover}
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
        
        /* Text shadow - stronger for index page (over images), subtle for other pages */
        header h1,
        header button,
        header nav button,
        header span {
          text-shadow: ${currentView === 'index' 
            ? '0 1px 8px rgba(0, 0, 0, 0.5), 0 2px 16px rgba(0, 0, 0, 0.3)' 
            : '0 1px 2px rgba(255, 255, 255, 0.3)'
          };
        }
      `}</style>
    </header>
  );
};