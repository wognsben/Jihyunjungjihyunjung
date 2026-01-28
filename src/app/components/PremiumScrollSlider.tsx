import { useState, useEffect, useRef } from 'react';
import { Work } from '@/data/works';
import { PremiumImage } from '@/app/components/ui/PremiumImage';

interface PremiumScrollSliderProps {
  works: Work[];
  onWorkClick?: (workId: string) => void;
  onBrightnessChange?: (isDark: boolean) => void;
}

export const PremiumScrollSlider = ({ works, onWorkClick, onBrightnessChange }: PremiumScrollSliderProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDark, setIsDark] = useState(true); 
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 이미지 밝기 감지 함수 (Canvas API 사용) - 비활성화 가능성 고려
  // GitHub Raw 이미지는 CORS 이슈로 인해 Canvas tainting이 발생할 수 있음
  // 이 경우 안전하게 기본값(Dark)을 반환하도록 처리
  const analyzeImageBrightness = (imageSrc: string) => {
    if (!imageSrc) return;
    
    // Create a detached image specifically for analysis
    const img = new Image();
    img.crossOrigin = "Anonymous"; 
    img.src = imageSrc;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 50;
        canvas.height = 50;
        
        // This line might throw SecurityError if CORS headers are missing
        ctx.drawImage(img, 0, 0, 50, 50);

        const imageData = ctx.getImageData(0, 0, 50, 50);
        const data = imageData.data;
        let totalBrightness = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Standard luminance formula
          const brightness = Math.sqrt(
            0.299 * (r * r) +
            0.587 * (g * g) +
            0.114 * (b * b)
          );
          totalBrightness += brightness;
        }

        const avgBrightness = totalBrightness / (data.length / 4);
        const isDarkBackground = avgBrightness < 128;
        
        setIsDark(isDarkBackground); 
        if (onBrightnessChange) onBrightnessChange(isDarkBackground);
        
      } catch (e) {
        // Silent fail on CORS or other canvas errors -> Default to Dark theme
        console.warn("Brightness analysis skipped (CORS/Canvas):", e);
        setIsDark(true); 
        if (onBrightnessChange) onBrightnessChange(true);
      }
    };

    img.onerror = () => {
       setIsDark(true);
       if (onBrightnessChange) onBrightnessChange(true);
    };
  };

  // 활성 슬라이드 변경 시 밝기 감지 실행
  useEffect(() => {
    if (works && works.length > 0 && works[activeIndex]) {
      // Run analysis in background, don't block rendering
      const currentWork = works[activeIndex];
      // 우선순위 변경: 갤러리 첫번째 이미지 > 썸네일
      const imageSrc = (currentWork.galleryImages && currentWork.galleryImages[0]) || currentWork.thumbnail;
      analyzeImageBrightness(imageSrc);
    }
  }, [activeIndex, works]);

  // 안전장치: works가 비어있으면 로딩 중 표시
  if (!works || works.length === 0) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center text-white/20 text-xs tracking-widest uppercase">Loading Visuals...</div>; 
  }

  // 슬라이드 이동 함수
  const navigateToSlide = (targetIndex: number) => {

    if (isTransitioning || targetIndex === activeIndex) return;
    
    setIsTransitioning(true);
    setActiveIndex(targetIndex);

    // CSS transition-duration(1000ms)과 타이밍 맞춤
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
  };


  // 휠 및 터치 이벤트 핸들링
  useEffect(() => {
    let lastScrollTime = 0;
    const scrollDelay = 1200; // 전환 시간(1000ms)보다 약간 길게 설정하여 중복 실행 방지

    const handleWheel = (e: WheelEvent) => {
      // 슬라이더가 전체 화면이므로 기본 스크롤 동작 방지
      e.preventDefault();
      
      const now = Date.now();
      if (now - lastScrollTime < scrollDelay || isTransitioning) return;
      
      // 임계값 설정 (너무 작은 휠 움직임 무시)
      if (Math.abs(e.deltaY) < 20) return;

      lastScrollTime = now;

      if (e.deltaY > 0) {
        const nextIndex = (activeIndex + 1) % works.length;
        navigateToSlide(nextIndex);
      } else if (e.deltaY < 0) {
        const prevIndex = (activeIndex - 1 + works.length) % works.length;
        navigateToSlide(prevIndex);
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const now = Date.now();
      if (now - lastScrollTime < scrollDelay || isTransitioning) return;
      
      const diff = touchStartY - touchEndY;
      if (Math.abs(diff) > 50) { // 터치 스와이프 민감도
        lastScrollTime = now;
        if (diff > 0) { // 아래쪽으로 스와이프 (다음 슬라이드)
            navigateToSlide((activeIndex + 1) % works.length);
        } else { // 위쪽으로 스와이프 (이전 슬라이드)
            navigateToSlide((activeIndex - 1 + works.length) % works.length);
        }
      }
    };

    // passive: false를 주어 preventDefault()가 작동하도록 함
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeIndex, isTransitioning, works.length]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        const prevIndex = (activeIndex - 1 + works.length) % works.length;
        navigateToSlide(prevIndex);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        const nextIndex = (activeIndex + 1) % works.length;
        navigateToSlide(nextIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, isTransitioning, works.length]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none">
      {/* Background Images */}
      {works.map((work, index) => {
        // 우선순위 변경: 갤러리 첫번째 이미지 > 썸네일
        const imageSrc = (work.galleryImages && work.galleryImages[0]) || work.thumbnail;
        return (
        <div
          key={work.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          aria-hidden={index !== activeIndex}
        >
          {/* Use PremiumImage for consistent loading behavior */}
          <PremiumImage
            src={imageSrc}
            alt={work.title_en}
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            style={{ objectPosition: 'center' }}
            draggable={false}
          />
          {/* 미세한 딤 처리 (선택 사항 - 텍스트 가독성용) */}
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        </div>
      )})}

      {/* Navigation UI - Bottom Left (Smart Contrast) */}
      <nav className="fixed left-8 bottom-8 z-30">
        <div className="flex flex-col gap-3">
          {/* Label */}
          <span 
            className={`font-mono text-[10px] uppercase tracking-wider transition-colors duration-700 ${
              isDark ? 'text-white/40' : 'text-black/40'
            }`}
          >
            Variations
          </span>
          
          {/* Number Grid */}
          <div className="flex flex-wrap gap-x-3 gap-y-2 max-w-[200px]">
            {works.map((work, index) => (
              <button
                key={work.id}
                onClick={() => navigateToSlide(index)}
                disabled={isTransitioning}
                className={`font-mono text-xs transition-all duration-300 ${
                  index === activeIndex
                    ? (isDark ? 'text-white font-bold' : 'text-black font-bold')
                    : (isDark ? 'text-white/30 hover:text-white/60' : 'text-black/30 hover:text-black/60')
                }`}
                style={{
                  letterSpacing: '0.05em',
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};
