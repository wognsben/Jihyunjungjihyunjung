import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Maximize2, Minimize2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

interface WorkPreviewModalProps {
  workId: string;
  onClose: () => void;
}

export const WorkPreviewModal = ({ workId, onClose }: WorkPreviewModalProps) => {
  const { lang } = useLanguage();
  const { works } = useWorks();
  const [isMaximized, setIsMaximized] = useState(false);
  const draggableRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const work = works.find(w => w.id === workId);
  if (!work) return null;

  const title = lang === 'ko' ? work.title_ko : (lang === 'jp' ? work.title_jp : work.title_en);
  const description = lang === 'ko' ? work.description_ko : (lang === 'jp' ? work.description_jp : work.description_en);

  const handleFullView = () => {
    window.location.hash = `#/work/${workId}`;
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 4000,
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <Draggable
        handle=".window-handle"
        defaultPosition={{ 
            x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth / 2 - 300) : 20, 
            y: 100 
        }}
        nodeRef={draggableRef}
        disabled={isMaximized}
      >
        <div 
          ref={draggableRef}
          className={`fixed z-[9999] ${isMaximized ? 'inset-0 !transform-none !w-full !h-full' : 'top-0 left-0 w-fit h-fit'}`}
          style={isMaximized ? { transform: 'none', width: '100%', height: '100%', top: 0, left: 0 } : { position: 'fixed' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`shadow-2xl bg-background/95 backdrop-blur-md border border-foreground/10 overflow-hidden flex flex-col ${isMaximized ? 'w-full h-full rounded-none' : 'rounded-lg'}`}
          >
            <Resizable
              defaultSize={{ width: 600, height: 700 }}
              size={isMaximized ? { width: '100%', height: '100%' } : undefined}
              minWidth={400}
              minHeight={500}
              maxWidth={isMaximized ? '100%' : 1000}
              enable={!isMaximized ? { right: true, bottom: true, bottomRight: true } : false}
              className="flex flex-col h-full relative"
            >
              {/* Header */}
              <div className="window-handle h-10 bg-muted/20 flex items-center justify-between px-4 cursor-move select-none border-b border-foreground/5 transition-colors hover:bg-muted/30 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 group">
                    <div 
                        className="w-2.5 h-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500/80 transition-colors cursor-pointer flex items-center justify-center" 
                        onClick={onClose}
                    >
                        <X size={8} className="text-black/50 opacity-0 group-hover:opacity-100" />
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 group-hover:bg-amber-500/80 transition-colors" />
                    <div 
                        className="w-2.5 h-2.5 rounded-full bg-green-500/20 group-hover:bg-green-500/80 transition-colors cursor-pointer" 
                        onClick={() => setIsMaximized(!isMaximized)}
                    />
                  </div>
                  <span className="ml-3 text-[9px] uppercase tracking-[0.2em] font-mono opacity-40 truncate max-w-[200px]">
                    Project Preview
                  </span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsMaximized(!isMaximized)} 
                        className="text-muted-foreground/40 hover:text-foreground transition-colors p-1"
                    >
                        {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <button onClick={onClose} className="text-muted-foreground/40 hover:text-foreground transition-colors p-1">
                        <X size={14} />
                    </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-grow flex flex-col overflow-y-auto overflow-x-hidden relative scrollbar-hide">
                
                {/* Image Area */}
                <div className="w-full aspect-video bg-muted/5 relative group">
                    {work.galleryImages && work.galleryImages.length > 0 ? (
                        <Slider {...sliderSettings} className="w-full h-full overflow-hidden">
                            {work.galleryImages.slice(0, 5).map((img, idx) => (
                                <div key={idx} className="w-full h-full outline-none">
                                    <div className="w-full aspect-video relative">
                                        <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                                    </div>
                                </div>
                            ))}
                        </Slider>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                            No Images
                        </div>
                    )}
                </div>

                {/* Info Area */}
                <div className="p-8 flex flex-col gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">{work.year}</span>
                            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">{work.client}</span>
                        </div>
                        <h2 className="text-2xl font-serif font-light text-foreground">{title}</h2>
                    </div>

                    <div className="w-12 h-px bg-foreground/10" />

                    <p className="text-sm font-serif leading-relaxed text-muted-foreground line-clamp-6 whitespace-pre-line">
                        {description}
                    </p>
                </div>
              </div>

              {/* Footer Action */}
              <div className="p-4 border-t border-foreground/5 bg-muted/5 flex justify-end flex-shrink-0">
                <button 
                    onClick={handleFullView}
                    className="group flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase bg-foreground text-background px-6 py-3 rounded-full hover:bg-foreground/90 transition-all"
                >
                    <span>View Project</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </Resizable>
          </motion.div>
        </div>
      </Draggable>
    </AnimatePresence>,
    document.body
  );
};
