import { useState, useEffect } from 'react';
import '@/styles/fonts.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';
import { PremiumScrollSlider } from '@/app/components/PremiumScrollSlider';
import { WorkGrid } from '@/app/components/WorkGrid';
import { WorkDetail } from '@/app/components/WorkDetail';
import { About } from '@/app/components/About';
import { Text } from '@/app/components/Text';
import { getSelectedWorks, getAllWorks, worksData } from '@/data/works';

type View = 'index' | 'work' | 'work-detail' | 'about' | 'text';

function App() {
  const [currentView, setCurrentView] = useState<View>('index');
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [isDarkBackground, setIsDarkBackground] = useState(true);
  const selectedWorks = getSelectedWorks();
  const allWorks = getAllWorks();

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      // Check for work detail route: #/work/:id
      const workDetailMatch = hash.match(/^#\/work\/([^\/]+)$/);
      if (workDetailMatch) {
        const workId = workDetailMatch[1];
        setSelectedWorkId(workId);
        setCurrentView('work-detail');
        return;
      }
      
      // Check for work list route: #/work
      if (hash.startsWith('#/work')) {
        setCurrentView('work');
        setSelectedWorkId(null);
        return;
      }

      // Check for about route: #/about
      if (hash.startsWith('#/about')) {
        setCurrentView('about');
        setSelectedWorkId(null);
        return;
      }

      // Check for text route: #/text
      if (hash.startsWith('#/text')) {
        setCurrentView('text');
        setSelectedWorkId(null);
        return;
      }
      
      // Default to index
      setCurrentView('index');
      setSelectedWorkId(null);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    window.location.hash = view === 'index' ? '#/' : '#/work';
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header shows on all pages */}
        <Header currentView={currentView} onNavigate={handleNavigate} isDarkBackground={isDarkBackground} />
        
        {currentView === 'index' ? (
          <PremiumScrollSlider 
            works={selectedWorks} 
            onBrightnessChange={setIsDarkBackground}
          />
        ) : currentView === 'work-detail' ? (
          <WorkDetail workId={selectedWorkId} />
        ) : currentView === 'about' ? (
          <About />
        ) : currentView === 'text' ? (
          <Text />
        ) : (
          <WorkGrid works={allWorks} />
        )}
        
        {/* Footer moved inside WorkGrid for proper ScrollSmoother handling */}
        {/* {currentView !== 'index' && currentView !== 'work-detail' && <Footer />} */}
      </div>
    </LanguageProvider>
  );
}

export default App;