import { motion } from 'motion/react';
import { ReactNode, useRef, useCallback } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({ children, className = '' }: PageTransitionProps) => {
  const ref = useRef<HTMLDivElement>(null);

  // GPU 레이어 해제: 애니메이션 완료 후 인라인 스타일을 제거하여
  // 불필요한 합성 레이어가 잔류하지 않도록 합니다.
  // 이는 태블릿(iPad 등)에서 스크롤 떨림(jank)을 방지합니다.
  const handleAnimationComplete = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    // motion이 남기는 인라인 스타일 정리
    el.style.transform = '';
    el.style.filter = '';
    el.style.opacity = '';
    el.style.willChange = '';
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1], // Ultra-smooth "Apple-like" easing
      }}
      onAnimationComplete={handleAnimationComplete}
      className={className}
    >
      {children}
    </motion.div>
  );
};
