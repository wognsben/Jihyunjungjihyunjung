import { useEffect, useState } from 'react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface PremiumImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string; // e.g. "aspect-[4/3]"
}

export const PremiumImage = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  aspectRatio = 'aspect-[4/3]',
  ...props
}: PremiumImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(!src);
  }, [src]);

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
            transition-opacity duration-300 ease-out
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${className}
          `}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
};