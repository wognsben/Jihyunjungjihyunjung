import { useState, useEffect } from 'react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface PremiumImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string; // e.g., "aspect-[4/3]"
}

export const PremiumImage = ({ 
  src, 
  alt, 
  className = '', 
  containerClassName = '',
  aspectRatio = '',
  ...props 
}: PremiumImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Preload image
  useEffect(() => {
    if (!src) {
      setHasError(true);
      return;
    }
    
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setHasError(true);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-[#F0F0F0] dark:bg-[#1A1A1A] ${aspectRatio} ${containerClassName}`}>
      {/* Skeleton / Loading State - Subtle Pulse */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-neutral-200/50 dark:bg-neutral-800/50 z-10" />
      )}

      {/* Error / No Image State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 z-20">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
            No Image
          </span>
        </div>
      )}

      {/* Actual Image */}
      {!hasError && (
        <ImageWithFallback
          src={src}
        alt={alt}
        className={`
          w-full h-full object-cover transition-all duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-md'}
          ${className}
        `}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        decoding="async"
        {...props}
      />
      )}
    </div>
  );
};
