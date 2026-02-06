import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { X, Maximize2, Minimize2, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Resizable } from 're-resizable';
import Draggable from 'react-draggable';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

// Minimal components for the modal
const CustomArrow = ({ className, style, onClick, direction }: any) => (
  <div
    className={`${className} z-10 !w-8 !h-8 !flex !items-center !justify-center before:!content-none hover:!bg-black/5 dark:hover:!bg-white/10 rounded-full transition-colors duration-300`}
    style={{ ...style, display: "flex", right: direction === 'next' ? '10px' : undefined, left: direction === 'prev' ? '10px' : undefined }}
    onClick={onClick}
  >
    {direction === 'next' ? <ArrowRight className="w-4 h-4 text-foreground" /> : <ArrowLeft className="w-4 h-4 text-foreground" />}
  </div>
);

interface WorkModalProps {
  workId: string | null;
  onClose: () => void;
}

export const WorkModal = ({ workId, onClose }: WorkModalProps) => {
  const { lang } = useLanguage();
  const { works, translateWorksByIds } = useWorks();
  const draggableRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (workId && lang !== 'ko') {
       translateWorksByIds([workId], lang);
    }
  }, [workId, lang, translateWorksByIds]);

  const work = works.find(w => String(w.id) === String(workId));

  // Esc listener
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (workId) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [workId, onClose]);

  if (!mounted || !workId || !work) return null;

  const title = lang === 'ko' ? work.title_ko : (lang === 'jp' ? work.title_jp : work.title_en);
  const description = lang === 'ko' ? work.description_ko : (lang === 'jp' ? work.description_jp : work.description_en);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <CustomArrow direction="next" />,
    prevArrow: <CustomArrow direction="prev" />,
    dotsClass: "slick-dots !bottom-[10px]",
    autoplay: true,
    autoplaySpeed: 4000
  };

  return createPortal(
    <AnimatePresence>
      <Draggable 
        handle=".window-handle" 
        defaultPosition={{ 
            x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth / 2 - 300) : 20, 
            y: typeof window !== 'undefined' ? Math.max(50, window.innerHeight / 2 - 350) : 50
        }} 
        nodeRef={draggableRef}
        disabled={isMaximized}
        bounds="body"
      >
        <div 
           ref={draggableRef} 
           className={`fixed z-[9999] ${isMaximized ? 'inset-0 !transform-none !w-full !h-full' : 'w-fit h-fit'}${lang === 'ko' ? ' notranslate' : ''}`}
           translate={lang === 'ko' ? 'no' : undefined}
           style={isMaximized ? { transform: 'none', width: '100%', height: '100%', top: 0, left: 0 } : { position: 'fixed' }}
        >
          <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`shadow-2xl bg-background/95 backdrop-blur-md border border-foreground/10 overflow-hidden flex flex-col ${isMaximized ? 'w-full h-full rounded-none' : 'rounded-lg'}`}
          >
             <Resizable
                defaultSize={{ width: 600, height: 700 }}
                size={isMaximized ? { width: '100%', height: '100%' } : undefined}
                minWidth={400} minHeight={500}
                maxWidth={isMaximized ? '100%' : 1200}
                enable={!isMaximized ? { right: true, bottom: true, bottomRight: true } : false}
                className="flex flex-col h-full relative"
             >
                {/* Header */}
                <div className="window-handle h-10 bg-muted/20 flex items-center justify-between px-4 cursor-move select-none border-b border-foreground/5 shrink-0 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                     <div className="flex gap-1.5 group">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500/80 transition-colors cursor-pointer flex items-center justify-center" onClick={onClose}>
                            <X size={8} className="opacity-0 group-hover:opacity-100 text-black/50" />
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 group-hover:bg-amber-500/80 transition-colors" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 group-hover:bg-green-500/80 transition-colors cursor-pointer" onClick={() => setIsMaximized(!isMaximized)} />
                     </div>
                     <span className="ml-3 text-[9px] uppercase tracking-[0.2em] font-mono opacity-50 truncate max-w-[200px]">
                        {title}
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

                {/* Content - Scrollable */}
                <div className="flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar bg-background/50">
                   {/* Slider */}
                   <div className="w-full aspect-video bg-black/5 mb-6">
                      <Slider {...sliderSettings}>
                        {(work.galleryImages || []).slice(0, 5).map((img, i) => (
                           <div key={i} className="w-full h-full outline-none">
                              <div className="w-full aspect-video relative flex items-center justify-center bg-black/5">
                                 <img src={img} alt="" className="max-w-full max-h-full object-contain" />
                              </div>
                           </div>
                        ))}
                      </Slider>
                   </div>

                   {/* Info */}
                   <div className="px-8 pb-8 space-y-6">
                      <div className="flex flex-col gap-2">
                         <div className="flex items-baseline justify-between border-b border-foreground/10 pb-2">
                            <h2 className="text-xl font-serif font-medium">{title}</h2>
                            <span className="font-mono text-xs text-muted-foreground">{work.year}</span>
                         </div>
                         {work.client && (
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">{work.client}</span>
                         )}
                      </div>

                      <p className="text-sm font-serif leading-relaxed text-foreground/80 whitespace-pre-wrap">
                         {description?.slice(0, 300)}...
                      </p>

                      <div className="pt-4 flex justify-end">
                         <button 
                           onClick={() => {
                             window.location.hash = `#/work/${workId}`;
                             onClose();
                           }}
                           className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] hover:text-foreground/60 transition-colors bg-foreground text-background px-4 py-2 rounded-full"
                         >
                            <span>Open Project</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                         </button>
                      </div>
                   </div>
                </div>
             </Resizable>
          </motion.div>
        </div>
      </Draggable>
    </AnimatePresence>,
    document.body
  );
};
