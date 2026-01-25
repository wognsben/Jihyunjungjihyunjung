import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({ children, className = '' }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(5px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
      transition={{ 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1], // Ultra-smooth "Apple-like" easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
