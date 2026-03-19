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

  const [currentView, setCurrentView] = useState<View>('index');
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isDarkBackground, setIsDarkBackground] = useState(true);

  // General list-page scroll restoration
  const scrollPositionsRef = React.useRef<Record<string, number>>({});
  const isRestoringScrollRef = React.useRef(false);
  const pendingScrollRef = React.useRef<number | null>(null);
  const scrollSpacerRef = React.useRef<HTMLDivElement | null>(null);

  // Current view refs
  const currentViewRef = React.useRef<View>('index');
  const selectedWorkIdRef = React.useRef<string | null>(null);
  const selectedTextIdRef = React.useRef<string | null>(null);

  // Detail/back stack restoration
  const detailScrollStackRef = React.useRef<
    { view: View; id: string | null; scrollY: number }[]
  >([]);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    selectedWorkIdRef.current = selectedWorkId;
  }, [selectedWorkId]);

  useEffect(() => {
    selectedTextIdRef.current = selectedTextId;
  }, [selectedTextId]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const prevView = currentViewRef.current;

      // Save current page scroll before switching
      scrollPositionsRef.current[prevView] = window.scrollY;

      // text detail: #/text/:id
      const textDetailMatch = hash.match(/^#\/text\/([^\\/]+)$/);
      if (textDetailMatch) {
        const textId = textDetailMatch[1];
        const stack = detailScrollStackRef.current;
        const top = stack[stack.length - 1];

        const isReturningToTextDetail =
          top?.view === 'text-detail' && top?.id === textId;

        if (!isReturningToTextDetail) {
          if (prevView === 'about') {
            stack.push({
              view: 'about',
              id: null,
              scrollY: window.scrollY,
            });
          }

          if (prevView === 'work-detail' && selectedWorkIdRef.current) {
            stack.push({
              view: 'work-detail',
              id: selectedWorkIdRef.current,
              scrollY: window.scrollY,
            });
          }

          if (prevView === 'text-detail' && selectedTextIdRef.current) {
            stack.push({
              view: 'text-detail',
              id: selectedTextIdRef.current,
              scrollY: window.scrollY,
            });
          }
        }

        setSelectedTextId(textId);
        setCurrentView('text-detail');
        return;
      }

      // work detail: #/work/:id
      const workDetailMatch = hash.match(/^#\/work\/([^\/]+)$/);
      if (workDetailMatch) {
        const workId = workDetailMatch[1];
        const stack = detailScrollStackRef.current;
        const top = stack[stack.length - 1];

        const isReturningToWorkDetail =
          top?.view === 'work-detail' && top?.id === workId;

        if (!isReturningToWorkDetail) {
          if (prevView === 'about') {
            stack.push({
              view: 'about',
              id: null,
              scrollY: window.scrollY,
            });
          }

          if (prevView === 'work-detail' && selectedWorkIdRef.current) {
            stack.push({
              view: 'work-detail',
              id: selectedWorkIdRef.current,
              scrollY: window.scrollY,
            });
          }

          if (prevView === 'text-detail' && selectedTextIdRef.current) {
            stack.push({
              view: 'text-detail',
              id: selectedTextIdRef.current,
              scrollY: window.scrollY,
            });
          }
        }

        setSelectedWorkId(workId);
        setCurrentView('work-detail');
        return;
      }

      // work list: #/work
      if (hash === '#/work') {
        setCurrentView('work');
        setSelectedWorkId(null);
        return;
      }

      // about: #/about
      if (hash === '#/about') {
        setCurrentView('about');
        setSelectedWorkId(null);
        return;
      }

      // text list: #/text
      if (hash === '#/text') {
        setCurrentView('text');
        setSelectedWorkId(null);
        setSelectedTextId(null);
        return;
      }

      // index
      setCurrentView('index');
      setSelectedWorkId(null);
      setSelectedTextId(null);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (isRestoringScrollRef.current) {
      const savedPosition = scrollPositionsRef.current[currentView] || 0;
      isRestoringScrollRef.current = false;
      pendingScrollRef.current = savedPosition;

      if (scrollSpacerRef.current) {
        scrollSpacerRef.current.style.height = `${savedPosition + window.innerHeight}px`;
      }

      requestAnimationFrame(() => {
        window.scrollTo(0, savedPosition);
      });

      const EXIT_MS = 850;
      const delays = [50, EXIT_MS, EXIT_MS + 100, EXIT_MS + 300, EXIT_MS + 600, EXIT_MS + 1200];
      const timeoutIds = delays.map(delay =>
        setTimeout(() => {
          window.scrollTo(0, savedPosition);
          if (
            scrollSpacerRef.current &&
            document.documentElement.scrollHeight -
              parseInt(scrollSpacerRef.current.style.height || '0', 10) >=
              savedPosition
          ) {
            scrollSpacerRef.current.style.height = '0px';
          }
        }, delay)
      );

      const cleanupId = setTimeout(() => {
        if (scrollSpacerRef.current) scrollSpacerRef.current.style.height = '0px';
      }, 3000);

      return () => {
        timeoutIds.forEach(id => clearTimeout(id));
        clearTimeout(cleanupId);
      };
    } else {
      const stack = detailScrollStackRef.current;
      const currentId =
        currentView === 'work-detail'
          ? selectedWorkId
          : currentView === 'text-detail'
          ? selectedTextId
          : currentView === 'about'
          ? null
          : null;

      if (stack.length > 0) {
        const lastEntry = stack[stack.length - 1];

        if (lastEntry.view === currentView && lastEntry.id === currentId) {
          stack.pop();
          const savedPosition = lastEntry.scrollY;
          pendingScrollRef.current = savedPosition;

          if (scrollSpacerRef.current) {
            scrollSpacerRef.current.style.height = `${savedPosition + window.innerHeight}px`;
          }

          requestAnimationFrame(() => {
            window.scrollTo(0, savedPosition);
          });

          const EXIT_MS = 850;
          const delays = [50, EXIT_MS, EXIT_MS + 100, EXIT_MS + 300, EXIT_MS + 600, EXIT_MS + 1200];
          const timeoutIds = delays.map(delay =>
            setTimeout(() => {
              window.scrollTo(0, savedPosition);
              if (
                scrollSpacerRef.current &&
                document.documentElement.scrollHeight -
                  parseInt(scrollSpacerRef.current.style.height || '0', 10) >=
                  savedPosition
              ) {
                scrollSpacerRef.current.style.height = '0px';
              }
            }, delay)
          );

          const cleanupId = setTimeout(() => {
            if (scrollSpacerRef.current) scrollSpacerRef.current.style.height = '0px';
          }, 3000);

          return () => {
            timeoutIds.forEach(id => clearTimeout(id));
            clearTimeout(cleanupId);
          };
        }
      }

      pendingScrollRef.current = 0;
      if (scrollSpacerRef.current) scrollSpacerRef.current.style.height = '0px';
    }
  }, [currentView, selectedWorkId, selectedTextId]);

  const ScrollRestorer = React.useCallback(() => {
    useLayoutEffect(() => {
      const target = pendingScrollRef.current;
      if (target !== null) {
        window.scrollTo(0, target);
        requestAnimationFrame(() => {
          window.scrollTo(0, target);
          setTimeout(() => {
            if (scrollSpacerRef.current) scrollSpacerRef.current.style.height = '0px';
          }, 500);
        });
        pendingScrollRef.current = null;
      }
    }, []);
    return null;
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const selectedWorks = [...works]
    .sort((a, b) => (b.year || 0) - (a.year || 0))
    .slice(0, 5);

  const currentWork = selectedWorkId ? works.find(w => w.id === selectedWorkId) : null;
  const currentWorkTitle = currentWork
    ? lang === 'ko'
      ? currentWork.title_ko
      : lang === 'jp'
      ? currentWork.title_jp
      : currentWork.title_en
    : undefined;

  const currentText = selectedTextId ? texts.find(t => t.id === selectedTextId) : null;
  const currentTextTitle = currentText
    ? lang === 'ko'
      ? currentText.title.ko
      : lang === 'jp'
      ? currentText.title.jp
      : currentText.title.en
    : undefined;

  const detailTitle =
    currentView === 'work-detail'
      ? currentWorkTitle
      : currentView === 'text-detail'
      ? currentTextTitle
      : undefined;

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
            <TextDetail textId={selectedTextId} isPage />
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