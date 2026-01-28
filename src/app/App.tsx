import React, { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'motion/react';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { WorkProvider, useWorks } from '@/contexts/WorkContext';
import { Header } from '@/app/components/Header';
import { PremiumScrollSlider } from '@/app/components/PremiumScrollSlider';
import { WorkGrid } from '@/app/components/WorkGrid';
import { WorkDetail } from '@/app/components/WorkDetail';
import { About } from '@/app/components/About';
import { Text } from '@/app/components/Text';
import { TextDetail } from '@/app/components/TextDetail';
import { PageTransition } from '@/app/components/ui/PageTransition';
import { OpeningIntro } from '@/app/components/intro/OpeningIntro';

type View = 'index' | 'work' | 'work-detail' | 'about' | 'text' | 'text-detail';

function AppContent() {
  const { lang } = useLanguage();
  const { works, isLoading } = useWorks();
  const [currentView, setCurrentView] = useState<View>('index');
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isDarkBackground, setIsDarkBackground] = useState(true);
  
  // Opening Intro State
  const [showIntro, setShowIntro] = useState(false);

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem('hasShownIntro', 'true');
  };

  // Check if should show intro (on reload or first visit to index)
  useEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const isReload = navigation?.type === 'reload';
    const hasShownIntro = sessionStorage.getItem('hasShownIntro');
    const hash = window.location.hash;
    const isIndex = !hash || hash === '#' || hash === '#/';
    
    // Show intro on reload OR first visit (only on index page)
    if (isIndex && (isReload || !hasShownIntro)) {
      setShowIntro(true);
    }
  }, []);

  // Use WordPress 최신 작품의 첫 번째 이미지
  const introImage = works[0]?.galleryImages?.[0] || works[0]?.thumbnail || '';
  
  // Select top 5 works for the slider based on YEAR (Latest first)
  const selectedWorks = [...works]
    .sort((a, b) => (b.year || 0) - (a.year || 0))
    .slice(0, 5);

  // Find the currently viewed work object (for retrieving title)
  const currentWork = selectedWorkId ? works.find(w => w.id === selectedWorkId) : null;
  
  // Resolve title based on current language
  const currentWorkTitle = currentWork ? (
    lang === 'ko' ? currentWork.title_ko :
    lang === 'jp' ? currentWork.title_jp :
    currentWork.title_en
  ) : undefined;

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      // Check for text detail route: #/text/:id
      const textDetailMatch = hash.match(/^#\/text\/([^\/]+)$/);
      if (textDetailMatch) {
        const textId = textDetailMatch[1];
        setSelectedTextId(textId);
        setCurrentView('text-detail');
        return;
      }
      
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
        setSelectedTextId(null);
        return;
      }
      
      // Default to index
      setCurrentView('index');
      setSelectedWorkId(null);
      setSelectedTextId(null);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Scroll to top whenever view changes
  useEffect(() => {
    window.scrollTo(0, 0);
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 10);
    return () => clearTimeout(timeoutId);
  }, [currentView, selectedWorkId]);

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    
    let hash = '#/';
    if (view === 'work') hash = '#/work';
    else if (view === 'about') hash = '#/about';
    else if (view === 'text') hash = '#/text';
    
    window.location.hash = hash;
  };

  // Show Opening Intro if active and image is ready
  if (showIntro && introImage) {
    return (
      <OpeningIntro
        onComplete={handleIntroComplete}
        imageSrc={introImage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        isDarkBackground={isDarkBackground}
        detailTitle={currentWorkTitle}
      />
      
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
        ) : currentView === 'text-detail' ? (
          <PageTransition key={`text-detail-${selectedTextId}`} className="min-h-screen">
            <TextDetail textId={selectedTextId} />
          </PageTransition>
        ) : (
          <PageTransition key="work" className="min-h-screen">
            <WorkGrid />
          </PageTransition>
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <WorkProvider>
          <AppContent />
        </WorkProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;