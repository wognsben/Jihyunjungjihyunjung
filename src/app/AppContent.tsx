import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { Header } from '@/app/components/Header';
import { IndexSlideshow } from '@/app/components/IndexSlideshow';
import { fetchMainIndexPage } from '@/services/wp-api';
import { MainIndexSlide } from '@/data/works';
import { WorkGrid } from '@/app/components/WorkGrid';
import { WorkDetail } from '@/app/components/WorkDetail';
import { About, preloadAboutData } from '@/app/components/About';
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
  const [workDetailRestoreMap, setWorkDetailRestoreMap] = useState<Record<string, boolean>>({});

  // General list-page scroll restoration
  const scrollPositionsRef = React.useRef<Record<string, number>>({});
  const isRestoringScrollRef = React.useRef(false);
  const pendingScrollRef = React.useRef<number | null>(null);
  const scrollSpacerRef = React.useRef<HTMLDivElement | null>(null);

  // Current view refs
  const currentViewRef = React.useRef<View>('index');
  const selectedWorkIdRef = React.useRef<string | null>(null);
  const selectedTextIdRef = React.useRef<string | null>(null);

  const [mainSlides, setMainSlides] = useState<MainIndexSlide[]>([]);
  const [isMainSlidesLoading, setIsMainSlidesLoading] = useState(true);

  // Detail/back stack restoration
  const detailScrollStackRef = React.useRef<
    { view: View; id: string | null; scrollY: number }[]
  >([]);

  // Global nav → work fresh entry 구분용
  const isFreshNavToWorkRef = React.useRef(false);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    selectedWorkIdRef.current = selectedWorkId;
  }, [selectedWorkId]);

  useEffect(() => {
    selectedTextIdRef.current = selectedTextId;
  }, [selectedTextId]);

  // ✅ main index slides fetch
  useEffect(() => {
    let isMounted = true;

    const loadMainSlides = async () => {
      setIsMainSlidesLoading(true);

      try {
        const data = await fetchMainIndexPage(lang);
        if (isMounted) {
          setMainSlides(data.slides || []);
        }
      } catch (error) {
        console.error('Failed to load main index slides:', error);
        if (isMounted) {
          setMainSlides([]);
        }
      } finally {
        if (isMounted) {
          setIsMainSlidesLoading(false);
        }
      }
    };

    loadMainSlides();

    return () => {
      isMounted = false;
    };
  }, [lang]);

  // ✅ app 시작 시 About 데이터 미리 로드
  useEffect(() => {
    preloadAboutData().catch((error) => {
      console.error('Failed to preload About data:', error);
    });
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';
      const prevView = currentViewRef.current;

      // Save current page scroll before switching
      scrollPositionsRef.current[prevView] = window.scrollY;

      // text detail: #/text/:id
      const textDetailMatch = hash.match(/^#\/text\/([^/]+)$/);
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
        setSelectedWorkId(null);
        setCurrentView('text-detail');
        return;
      }

      // work detail: #/work/:id
      const workDetailMatch = hash.match(/^#\/work\/([^/]+)$/);
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

        setWorkDetailRestoreMap((prev) => ({
          ...prev,
          [workId]: false,
        }));

        setSelectedWorkId(workId);
        setSelectedTextId(null);
        setCurrentView('work-detail');
        return;
      }

      // work list: #/work
      if (hash === '#/work') {
        if (isFreshNavToWorkRef.current) {
          // 글로벌 Work 클릭으로 들어온 경우는 fresh entry
          isRestoringScrollRef.current = false;
          pendingScrollRef.current = 0;
          isFreshNavToWorkRef.current = false;
        } else {
          // back / 복원 흐름
          isRestoringScrollRef.current = true;
        }

        setCurrentView('work');
        setSelectedWorkId(null);
        setSelectedTextId(null);
        return;
      }

      // about: #/about
      if (hash === '#/about') {
        setCurrentView('about');
        setSelectedWorkId(null);
        setSelectedTextId(null);
        return;
      }

      // text list: #/text
      if (hash === '#/text') {
        isRestoringScrollRef.current = true;
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
    // 🔥 text-detail에서는 전역 window scroll 복원 자체를 막음
    if (currentView === 'text-detail') {
      isRestoringScrollRef.current = false;
      pendingScrollRef.current = null;

      if (scrollSpacerRef.current) {
        scrollSpacerRef.current.style.height = '0px';
      }

      return;
    }

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

      const timeoutIds = delays.map((delay) =>
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
        if (scrollSpacerRef.current) {
          scrollSpacerRef.current.style.height = '0px';
        }
      }, 3000);

      return () => {
        timeoutIds.forEach((id) => clearTimeout(id));
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

          if (lastEntry.view === 'work-detail' && lastEntry.id) {
            setWorkDetailRestoreMap((prev) => ({
              ...prev,
              [lastEntry.id as string]: true,
            }));
          }

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

          const timeoutIds = delays.map((delay) =>
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
            if (scrollSpacerRef.current) {
              scrollSpacerRef.current.style.height = '0px';
            }
          }, 3000);

          return () => {
            timeoutIds.forEach((id) => clearTimeout(id));
            clearTimeout(cleanupId);
          };
        }
      }

      pendingScrollRef.current = 0;

      if (scrollSpacerRef.current) {
        scrollSpacerRef.current.style.height = '0px';
      }
    }
  }, [currentView, selectedWorkId, selectedTextId]);

  const ScrollRestorer = React.useCallback(() => {
    useLayoutEffect(() => {
      // 🔥 text-detail에서는 ScrollRestorer도 실행하지 않음
      if (currentViewRef.current === 'text-detail') {
        pendingScrollRef.current = null;

        if (scrollSpacerRef.current) {
          scrollSpacerRef.current.style.height = '0px';
        }

        return;
      }

      const target = pendingScrollRef.current;

      if (target !== null) {
        window.scrollTo(0, target);

        requestAnimationFrame(() => {
          window.scrollTo(0, target);

          setTimeout(() => {
            if (scrollSpacerRef.current) {
              scrollSpacerRef.current.style.height = '0px';
            }
          }, 500);
        });

        pendingScrollRef.current = null;
      }
    }, []);

    return null;
  }, []);

  const shouldBlockEntireApp = currentView !== 'index' && isLoading;

  if (shouldBlockEntireApp) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const currentWork = selectedWorkId ? works.find((w) => w.id === selectedWorkId) : null;
  const currentWorkTitle = currentWork
    ? lang === 'ko'
      ? currentWork.title_ko
      : lang === 'jp'
      ? currentWork.title_jp
      : currentWork.title_en
    : undefined;

  const currentText = selectedTextId ? texts.find((t) => t.id === selectedTextId) : null;
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
    // 글로벌 네비게이션 클릭은 "새 진입"으로 간주
    // → BACK 복원용 상태들 초기화
    isRestoringScrollRef.current = false;
    pendingScrollRef.current = 0;
    detailScrollStackRef.current = [];

    // work detail 복원 플래그도 초기화
    setWorkDetailRestoreMap({});

    // global nav로 work에 들어가는 경우를 별도 표식
    if (view === 'work') {
      isFreshNavToWorkRef.current = true;
    }

    // 섹션 이동 시 선택 상태 정리
    if (view !== 'work-detail') {
      setSelectedWorkId(null);
    }
    if (view !== 'text-detail') {
      setSelectedTextId(null);
    }

    setCurrentView(view);

    let hash = '#/';
    if (view === 'work') hash = '#/work';
    else if (view === 'about') hash = '#/about';
    else if (view === 'text') hash = '#/text';

    window.location.hash = hash;

    // 글로벌 네비게이션은 항상 fresh entry
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      if (scrollSpacerRef.current) {
        scrollSpacerRef.current.style.height = '0px';
      }
    });
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

      {currentView === 'index' ? (
        <PageTransition className="fixed inset-0 z-0">
          <ScrollRestorer />
          {isMainSlidesLoading ? (
            <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
              <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : (
            <IndexSlideshow slides={mainSlides} />
          )}
        </PageTransition>
      ) : currentView === 'work-detail' ? (
        <PageTransition className="min-h-screen">
          <ScrollRestorer />
          <WorkDetail
            workId={selectedWorkId}
            shouldRestoreGrid={
              selectedWorkId ? !!workDetailRestoreMap[selectedWorkId] : false
            }
          />
        </PageTransition>
      ) : currentView === 'about' ? (
        <PageTransition className="min-h-screen">
          <ScrollRestorer />
          <About />
        </PageTransition>
      ) : currentView === 'text' ? (
        <PageTransition className="min-h-screen">
          <ScrollRestorer />
          <Text />
        </PageTransition>
      ) : currentView === 'text-detail' ? (
        <PageTransition className="min-h-screen">
          <TextDetail textId={selectedTextId} isPage />
        </PageTransition>
      ) : (
        <PageTransition className="min-h-screen">
          <ScrollRestorer />
          <WorkGrid />
        </PageTransition>
      )}
    </div>
  );
};