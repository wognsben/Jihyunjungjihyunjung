import { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'motion/react';
import '@/styles/fonts.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Header } from '@/app/components/Header';
// Footer is currently unused in App.tsx based on the read output
// import { Footer } from '@/app/components/Footer'; 
import { PremiumScrollSlider } from '@/app/components/PremiumScrollSlider';
import { WorkGrid } from '@/app/components/WorkGrid';
import { WorkDetail } from '@/app/components/WorkDetail';
import { About } from '@/app/components/About';
import { Text } from '@/app/components/Text';
import { NoiseOverlay } from '@/app/components/effects/NoiseOverlay';
import { PageTransition } from '@/app/components/ui/PageTransition';
import { getSelectedWorks, getAllWorks } from '@/data/works';

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

  // Scroll to top whenever view changes
  useEffect(() => {
    // Immediate scroll reset to ensure the new page starts at the top
    window.scrollTo(0, 0);
    
    // Safety check for mobile browsers or delayed rendering
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [currentView, selectedWorkId]);

  const handleNavigate = (view: View) => {
    // Optimistic update for faster UI response
    setCurrentView(view);
    
    let hash = '#/';
    if (view === 'work') hash = '#/work';
    else if (view === 'about') hash = '#/about';
    else if (view === 'text') hash = '#/text';
    
    window.location.hash = hash;
  };

  return (
    <HelmetProvider>
      <LanguageProvider>
        <div className="min-h-screen bg-background text-foreground">
          <NoiseOverlay />
          {/* Header shows on all pages */}
          <Header currentView={currentView} onNavigate={handleNavigate} isDarkBackground={isDarkBackground} />
          
          <AnimatePresence mode="wait">
            {currentView === 'index' ? (
              <PageTransition key="index" className="fixed inset-0 z-0">
                <PremiumScrollSlider 
                  works={selectedWorks} 
                  onBrightnessChange={setIsDarkBackground}
                />
              </PageTransition>
            ) : currentView === 'work-detail' ? (
              <PageTransition key={`work-detail-${selectedWorkId}`} className="min-h-screen">
                <WorkDetail workId={selectedWorkId} />
              </PageTransition>
            ) : currentView === 'about' ? (
              <PageTransition key="about" className="min-h-screen">
                <About />
              </PageTransition>
            ) : currentView === 'text' ? (
              <PageTransition key="text" className="min-h-screen">
                <Text />
              </PageTransition>
            ) : (
              <PageTransition key="work" className="min-h-screen">
                <WorkGrid works={allWorks} />
              </PageTransition>
            )}
          </AnimatePresence>
        </div>
      </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
