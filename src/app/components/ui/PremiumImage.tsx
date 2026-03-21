import { useEffect, useState } from 'react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface PremiumImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  priority?: boolean;
}

export const PremiumImage = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  aspectRatio = 'aspect-[4/3]',
  priority = false,
  ...props
}: PremiumImageProps) => {
  const [isLoaded, setIsLoaded] = useState(priority); // priority면 즉시 로드된 것으로 간주
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!priority) {
      setIsLoaded(false);
    }
    setHasError(!src);
  }, [src, priority]);

  return (
    <div
      className={`relative overflow-hidden bg-background ${aspectRatio} ${containerClassName}`}
    >
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-10 animate-pulse bg-neutral-200/50 dark:bg-neutral-800/50" />
      )}

      {hasError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            No Image
          </span>
        </div>
      )}

      {!hasError && (
        <ImageWithFallback
          src={src}
          alt={alt}
          className={`
            block w-full h-full object-cover
            ${priority ? '' : 'transition-opacity duration-300 ease-out'}
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${className}
          `}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchpriority={priority ? 'high' : 'auto'}
          {...props}
        />
      )}
    </div>
  );
};