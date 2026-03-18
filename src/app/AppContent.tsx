import React, { useState, useEffect, useLayoutEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { Header } from '@/app/components/Header';
import { PremiumScrollSlider } from '@/app/components/PremiumScrollSlider';
import { WorkGrid } from '@/app/components/WorkGrid';
import { WorkDetail } from '@/app/components/WorkDetail';
import { About } from '@/app/components/About';
import { Text } from '@/app/components/Text';
import { TextDetail } from '@/app/components/TextDetail';
import { PageTransition } from '@/app/components/ui/PageTransition';
import { SeoHead } from '@/app/components/seo/SeoHead';

type View = 'index' | 'work' | 'work-detail' | 'about' | 'text' | 'text-detail';

export const AppContent = () => {
  const { lang } = useLanguage();
  const { works, isLoading, texts } = useWorks();
  
  // 1. All hooks must be declared unconditionally at the top
  const [currentView, setCurrentView] = useState<View>('index');
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isDarkBackground, setIsDarkBackground] = useState(true);

  // Scroll position restoration
  const scrollPositionRef = React.useRef<number>(0);
  const isRestoringScrollRef = React.useRef(false);
  const pendingScrollRef = React.useRef<number | null>(null);
  const scrollSpacerRef = React.useRef<HTMLDivElement | null>(null);
  const currentViewRef = React.useRef<View>('index');

  // Keep ref in sync with state
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

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
        // Save scroll position before entering work-detail
        if (currentViewRef.current !== 'work-detail') {
          scrollPositionRef.current = window.scrollY;
        }
        setSelectedWorkId(workId);
        setCurrentView('work-detail');
        return;
      }
      
      // Check for work list route: #/work
      if (hash.startsWith('#/work')) {
        // If coming back from work-detail, mark for scroll restoration
        if (currentViewRef.current === 'work-detail') {
          isRestoringScrollRef.current = true;
        }
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
      // If coming back from work-detail, mark for scroll restoration
      if (currentViewRef.current === 'work-detail') {
        isRestoringScrollRef.current = true;
      }
      setCurrentView('index');
      setSelectedWorkId(null);
      setSelectedTextId(null);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Scroll to top whenever view changes (unless restoring)
  // IMPORTANT: AnimatePresence mode="wait" means the exit animation (0.8s)
  // must complete BEFORE the new view mounts. All scroll operations must
  // account for this delay, especially on mobile/tablet where content
  // rendering and GSAP initialization add further latency.

  useEffect(() => {
    if (isRestoringScrollRef.current) {
      const savedPosition = scrollPositionRef.current;
      isRestoringScrollRef.current = false;
      pendingScrollRef.current = savedPosition;

      // Inject temporary spacer to guarantee page height BEFORE new view mounts.
      // This ensures scrollTo succeeds at opacity:0 → no visible scroll movement.
      if (scrollSpacerRef.current) {
        scrollSpacerRef.current.style.height = `${savedPosition + window.innerHeight}px`;
      }

      // Desktop: immediate attempt
      requestAnimationFrame(() => {
        window.scrollTo(0, savedPosition);
      });

      // Progressive retries after exit animation (~850ms)
      const EXIT_MS = 850;
      const delays = [50, EXIT_MS, EXIT_MS + 100, EXIT_MS + 300, EXIT_MS + 600, EXIT_MS + 1200];
      const timeoutIds = delays.map(delay =>
        setTimeout(() => {
          window.scrollTo(0, savedPosition);
          // Remove spacer once real content is tall enough
          if (scrollSpacerRef.current && document.documentElement.scrollHeight - parseInt(scrollSpacerRef.current.style.height || '0') >= savedPosition) {
            scrollSpacerRef.current.style.height = '0px';
          }
        }, delay)
      );

      // Safety: always remove spacer after 3s
      const cleanupId = setTimeout(() => {
        if (scrollSpacerRef.current) scrollSpacerRef.current.style.height = '0px';
      }, 3000);

      return () => {
        timeoutIds.forEach(id => clearTimeout(id));
        clearTimeout(cleanupId);
      };
    } else {
      // Scroll to top for new page entry
      pendingScrollRef.current = 0;
      if (scrollSpacerRef.current) scrollSpacerRef.current.style.height = '0px';
      window.scrollTo(0, 0);

      const EXIT_MS = 850;
      const delays = [10, EXIT_MS, EXIT_MS + 100];
      const timeoutIds = delays.map(delay =>
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, delay)
      );

      return () => timeoutIds.forEach(id => clearTimeout(id));
    }
  }, [currentView, selectedWorkId]);

  // ScrollRestorer: mounts inside PageTransition at opacity:0,
  // fires useLayoutEffect to scroll BEFORE browser paint → invisible scroll
  const ScrollRestorer = React.useCallback(() => {
    useLayoutEffect(() => {
      const target = pendingScrollRef.current;
      if (target !== null) {
        window.scrollTo(0, target);
        requestAnimationFrame(() => {
          window.scrollTo(0, target);
          // Remove spacer once scroll is set and content is rendering
          setTimeout(() => {
            if (scrollSpacerRef.current) scrollSpacerRef.current.style.height = '0px';
          }, 500);
        });
        pendingScrollRef.current = null;
      }
    }, []);
    return null;
  }, []);

  // 2. Loading check comes AFTER all hooks
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  // 3. Logic dependent on data
  // Select top 5 works for the slider based on YEAR (Latest first)
  const selectedWorks = [...works]
    .sort((a, b) => (b.year || 0) - (a.year || 0))
    .slice(0, 5);

  // Find the currently viewed work object (for retrieving title)
  const currentWork = selectedWorkId ? works.find(w => w.id === selectedWorkId) : null;
  
  // Resolve work title based on current language
  const currentWorkTitle = currentWork ? (
    lang === 'ko' ? currentWork.title_ko :
    lang === 'jp' ? currentWork.title_jp :
    currentWork.title_en
  ) : undefined;

  // Find the currently viewed text object (for retrieving title)
  const currentText = selectedTextId ? texts.find(t => t.id === selectedTextId) : null;
  
  // Resolve text title based on current language
  const currentTextTitle = currentText ? (
    lang === 'ko' ? currentText.title.ko :
    lang === 'jp' ? currentText.title.jp :
    currentText.title.en
  ) : undefined;
  
  // Determine which detail title to show based on current view
  const detailTitle = currentView === 'work-detail' ? currentWorkTitle : 
                      currentView === 'text-detail' ? currentTextTitle : 
                      undefined;

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    
    let hash = '#/';
    if (view === 'work') hash = '#/work';
    else if (view === 'about') hash = '#/about';
    else if (view === 'text') hash = '#/text';
    
    window.location.hash = hash;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Invisible spacer: guarantees page height for instant scroll restoration */}
      <div ref={scrollSpacerRef} aria-hidden="true" style={{ height: 0 }} />
      <SeoHead />
      <Header 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        isDarkBackground={isDarkBackground}
        detailTitle={detailTitle}
      />
      
      <AnimatePresence mode="wait">
        {currentView === 'index' ? (
          <PageTransition key="index" className="fixed inset-0 z-0">
            <ScrollRestorer />
            <PremiumScrollSlider 
              works={selectedWorks} 
              onBrightnessChange={setIsDarkBackground}
            />
          </PageTransition>
        ) : currentView === 'work-detail' ? (
          <PageTransition key={`work-detail-${selectedWorkId}`} className="min-h-screen">
            <ScrollRestorer />
            <WorkDetail workId={selectedWorkId} />
          </PageTransition>
        ) : currentView === 'about' ? (
          <PageTransition key="about" className="min-h-screen">
            <ScrollRestorer />
            <About />
          </PageTransition>
        ) : currentView === 'text' ? (
          <PageTransition key="text" className="min-h-screen">
            <ScrollRestorer />
            <Text />
          </PageTransition>
        ) : currentView === 'text-detail' ? (
          <PageTransition key={`text-detail-${selectedTextId}`} className="min-h-screen">
            <ScrollRestorer />
            <TextDetail textId={selectedTextId} isPage={true} />
          </PageTransition>
        ) : (
          <PageTransition key="work" className="min-h-screen">
            <ScrollRestorer />
            <WorkGrid />
          </PageTransition>
        )}
      </AnimatePresence>
    </div>
  );
};