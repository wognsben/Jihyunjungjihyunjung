import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { PremiumImage } from '@/app/components/ui/PremiumImage';

interface GalleryItemProps {
  image: string;
  title: string;
  index: number;
  layoutClass: string;
  containerClass: string;
}

export const GalleryItem = ({ image, title, index, layoutClass, containerClass }: GalleryItemProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Motion values for cursor follower
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation for the cursor
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    // Calculate position relative to the container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <div className={containerClass}>
      <div 
        ref={containerRef}
        className={`relative overflow-hidden group cursor-none ${layoutClass}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
      >
        <PremiumImage
          src={image}
          alt={`${title} - View ${index + 1}`}
          className="w-full h-auto object-contain transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
          containerClassName="w-full"
        />
        
        {/* Mouse Follower Label */}
        <motion.div 
          className="absolute z-30 pointer-events-none flex items-center justify-center"
          style={{ 
            x: cursorX, 
            y: cursorY,
            top: 0,
            left: 0
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.8
          }}
          transition={{ duration: 0.2 }}
        >
          <div 
            className="
              flex items-center gap-3 px-4 py-2 
              bg-black/50 backdrop-blur-md border border-white/20 rounded-full shadow-xl
              -translate-x-1/2 -translate-y-1/2
            "
          >
            <span className="text-white font-mono text-xs tracking-widest uppercase drop-shadow-sm whitespace-nowrap">
              View {String(index + 1).padStart(2, '0')}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
