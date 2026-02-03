import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Footer } from '@/app/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorks } from '@/contexts/WorkContext';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { Category } from '@/data/texts';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(TextPlugin);
}

// ----------------------------------------------------------------------
// Types & Data
// ----------------------------------------------------------------------

const categories: Category[] = ['All', 'Article', 'Note', 'Review'];

const GHOST_PHRASES = [
    "Reflections on the Water",
    "Black and white film",
    "Quiet moments",
    "Knight on a Horse",
    "Minimalism is not absence",
    "Forms follow function"
];

// ----------------------------------------------------------------------
// Advanced Typography Component
// ----------------------------------------------------------------------
// Identifies 〈Bracketed Titles〉 and adjusts spacing with pixel-perfect precision.

const FormattedTitle = ({ text }: { text: string }) => {
  const match = text.match(/^(〈[^〉]+〉)\s*([/&])?\s*(.*)$/);

  if (!match) {
    return <span>{text}</span>;
  }

  const [_, bracketPart, separator, restPart] = match;

  return (
    <span>
      <span className="inline-block">{bracketPart}</span>
      {separator ? (
        <>
          <span className="inline-block mx-[3px] text-muted-foreground/50">{separator}</span>
          <span className="inline-block">{restPart}</span>
        </>
      ) : (
        <span className="inline-block ml-0">{restPart}</span>
      )}
    </span>
  );
};

// ----------------------------------------------------------------------
// Components
// ----------------------------------------------------------------------

export const Text = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { lang } = useLanguage();
  const { texts } = useWorks();
  
  // Mobile Floating Bar State
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Desktop Fade Out State
  const [sidebarOpacity, setSidebarOpacity] = useState(1);

  // Hover Image State
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  
  const ghostTextRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const imagePreviewRef = useRef<HTMLDivElement>(null);

  // Filter Logic
  const filteredData = useMemo(() => {
    return texts.filter((item) => {
      if (activeCategory !== 'All' && item.category !== activeCategory) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const title = item.title[lang].toLowerCase();
        const author = item.author[lang].toLowerCase();
        const content = item.content && item.content[lang] ? item.content[lang].toLowerCase() : '';
        const summary = item.summary && item.summary[lang] ? item.summary[lang].toLowerCase() : '';
        
        return (
          title.includes(query) ||
          author.includes(query) ||
          item.year.includes(query) ||
          item.category.toLowerCase().includes(query) ||
          content.includes(query) ||
          summary.includes(query)
        );
      }
      return true;
    });
  }, [activeCategory, searchQuery, lang, texts]);

  // Scroll & Intersection Logic
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // 1. Mobile Floating Bar Logic
      if (scrollY > 100) {
        setShowFloatingBar(true);
      } else {
        setShowFloatingBar(false);
        if (scrollY < 50) setIsMobileMenuOpen(false);
      }

      // 2. Desktop Fade Out Logic
      if (footerRef.current) {
        const footerRect = footerRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const distanceToFooter = footerRect.top - windowHeight;
        
        if (distanceToFooter < 100) {
           const newOpacity = Math.max(0, Math.min(1, (distanceToFooter + 200) / 300));
           setSidebarOpacity(newOpacity);
        } else {
           setSidebarOpacity(1);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ghost Text Animation
  useEffect(() => {
    if (!ghostTextRef.current) return;
    if (searchQuery.length > 0) {
      gsap.set(ghostTextRef.current, { opacity: 0 });
      return;
    }
    gsap.set(ghostTextRef.current, { opacity: 0.5 }); 

    const tl = gsap.timeline({ repeat: -1 });
    const textEl = ghostTextRef.current;

    GHOST_PHRASES.forEach((phrase) => {
        tl.call(() => { if (textEl) textEl.innerText = ""; });
        const chars = phrase.split("");
        chars.forEach((char) => {
            tl.to(textEl, {
                duration: 0.05 + Math.random() * 0.05, 
                text: { value: textEl.innerText + char },
                ease: "none"
            });
        });
        tl.to({}, { duration: 2 });
        tl.to(textEl, { duration: 0.5, opacity: 0, ease: "power2.out" });
        tl.to(textEl, { duration: 0, opacity: 0.5 });
    });
    return () => { tl.kill(); };
  }, [searchQuery]); 

  // Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
        if (window.innerWidth < 768) {
           setIsMobileMenuOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse Follower for Image Preview
  useEffect(() => {
    const el = imagePreviewRef.current;
    if (!el) return;

    // Use GSAP quickTo for smooth performance instead of React state updates
    const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

    const handleMouseMove = (e: MouseEvent) => {
        xTo(e.clientX);
        yTo(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background relative">
      
      {/* ------------------------------------------------------- */}
      {/* HOVER IMAGE PREVIEW                                     */}
      {/* ------------------------------------------------------- */}
      <div 
        ref={imagePreviewRef}
        className="fixed top-0 left-0 pointer-events-none z-50 hidden md:block" 
        style={{ x: 0, y: 0 }} 
      >
        <AnimatePresence mode="wait">
            {hoveredImage && hoveredImage !== '' && (
                <motion.div
                    key={hoveredImage}
                    initial={{ opacity: 0, scale: 0.9, x: 20, y: 20 }} // Reset offset
                    animate={{ opacity: 1, scale: 1, x: 20, y: 20 }} 
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="relative"
                >
                    <img 
                        src={hoveredImage} 
                        alt="Preview" 
                        className="w-80 h-auto max-h-[400px] object-cover shadow-2xl rounded-sm"
                    />
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="w-full px-6 md:px-12 pt-28 md:pt-32 pb-24 flex flex-col md:flex-row gap-8 md:gap-24 relative">

        {/* ------------------------------------------------------- */}
        {/* SIDEBAR (Desktop: Sticky, Mobile: Hidden on Scroll)     */}
        {/* ------------------------------------------------------- */}
        <motion.div 
            style={{ opacity: sidebarOpacity }}
            className={`
               md:w-1/4 lg:w-1/5 md:h-[calc(100vh-5rem)] 
               md:sticky md:top-32 z-30 flex flex-col gap-6 md:gap-12 
               transition-all duration-300 ease-out
               ${showFloatingBar ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'}
            `}
        >
          {/* GHOST SEARCH BAR */}
          <div className="relative group w-full">
            <div className="relative flex items-center border-b border-foreground/20 pb-2 transition-colors duration-300 focus-within:border-foreground">
                <div className="mr-3 text-muted-foreground">
                   <Search size={16} strokeWidth={1.5} />
                </div>
                <div className="relative flex-1 h-6 overflow-hidden">
                    <div 
                        ref={ghostTextRef}
                        className="absolute left-0 top-0 w-full h-full text-sm font-light text-muted-foreground/40 pointer-events-none whitespace-nowrap overflow-hidden"
                        aria-hidden="true"
                    ></div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="relative w-full h-full bg-transparent text-sm font-light outline-none text-foreground placeholder-transparent z-10"
                        autoComplete="off"
                        spellCheck="false"
                    />
                </div>
                <div className="ml-2">
                    {searchQuery ? (
                         <button 
                            onClick={() => setSearchQuery('')}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                         >
                            <X size={14} />
                         </button>
                    ) : (
                        <div 
                            onClick={() => inputRef.current?.focus()}
                            className="hidden md:flex items-center justify-center w-5 h-5 cursor-pointer group/hint"
                        >
                            <span className="text-xl leading-none font-serif text-muted-foreground/60 group-hover/hint:text-foreground transition-all duration-700 group-hover/hint:rotate-180 origin-center">
                                *
                            </span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-4 hidden md:block opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 delay-100">
                <button 
                    onClick={() => inputRef.current?.focus()}
                    className="text-[10px] uppercase tracking-widest font-mono text-foreground/40 hover:text-foreground transition-colors flex items-center gap-2"
                >
                    <span>SEARCH ARCHIVE</span>
                    <span className="w-4 h-[1px] bg-foreground/20" />
                </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col gap-2 md:gap-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 hidden md:block">
              Filter By
            </span>
            <div className="flex overflow-x-auto md:overflow-visible md:flex-col gap-2 md:gap-3 pb-2 md:pb-0 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 text-left text-sm transition-all duration-300 flex items-center gap-2 group/btn whitespace-nowrap px-3 py-1 md:px-0 md:py-0 rounded-full md:rounded-none border md:border-0 ${
                    activeCategory === cat 
                      ? 'bg-foreground text-background md:bg-transparent md:text-foreground md:font-medium md:pl-2 md:border-l md:border-foreground border-transparent' 
                      : 'bg-transparent text-muted-foreground hover:text-foreground border-foreground/10 md:border-transparent'
                  }`}
                >
                  <span className="capitalize">{cat}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ------------------------------------------------------- */}
        {/* RIGHT CONTENT: List                                     */}
        {/* ------------------------------------------------------- */}
        <div className="flex-1 min-h-[50vh]">
          
          {filteredData.length === 0 && (
            <div className="w-full h-64 flex flex-col items-center justify-center text-muted-foreground gap-4 border border-dashed border-foreground/10 rounded-lg mt-8">
              <Search size={24} strokeWidth={1} />
              <p className="text-sm font-light">No results found</p>
            </div>
          )}

          <div className="flex flex-col mt-4 md:mt-0">
            {filteredData.map((item, index) => (
              <motion.a
                href={`#/text/${item.id}`}
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                onMouseEnter={() => setHoveredImage(item.image)}
                onMouseLeave={() => setHoveredImage(null)}
                className="group/item relative border-b border-foreground/5 py-8 md:py-6 transition-all duration-500 md:-mx-6 md:px-6 cursor-pointer rounded-lg overflow-hidden"
              >
                {/* Hover Background (White instead of Dark) */}
                <div className="absolute inset-0 bg-white opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 z-0" />

                <div className="relative z-10 flex flex-col md:grid md:grid-cols-[1fr_80px] md:gap-8 md:items-baseline">
                  
                  {/* Title Area + Category */}
                  <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-8 order-1">
                    {/* Mobile: Category & Year in same row */}
                    <div className="flex md:hidden items-center justify-between w-full mb-2">
                      <span className="text-[10px] font-mono text-muted-foreground/60 group-hover/item:text-black/70 transition-colors duration-300">
                         {item.category.toLowerCase()}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground/60 group-hover/item:text-black/70 transition-colors duration-300">
                         {item.year}
                      </span>
                    </div>
                    
                    {/* Desktop: Category Label */}
                    <span className="hidden md:block text-[10px] font-mono text-muted-foreground/60 group-hover/item:text-black/70 w-16 shrink-0 transition-colors duration-300">
                       {item.category.toLowerCase()}
                    </span>
                    
                    <h3 className="font-serif text-sm font-light leading-snug group-hover/item:translate-x-1 transition-all duration-300 group-hover/item:text-black text-foreground">
                      <FormattedTitle text={item.title[lang]} />
                    </h3>
                  </div>

                  {/* Desktop Layout - Year Only */}
                  <div className="hidden md:block order-2 mt-1 md:mt-0 md:text-right md:group-hover/item:translate-x-1 transition-transform duration-300 delay-100">
                    <span className="text-xs font-mono text-muted-foreground group-hover/item:text-black transition-colors duration-300">
                      {item.year}
                    </span>
                  </div>
                </div>

                <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 -translate-x-4 group-hover/item:-translate-x-2 transition-all duration-300 text-black text-sm z-10">
                  →
                </div>
              </motion.a>
            ))}
          </div>

          <div ref={footerRef} className="mt-24 pt-12 border-t border-foreground/10">
             <Footer />
          </div>

        </div>

      </div>

      {/* ------------------------------------------------------- */}
      {/* MOBILE FLOATING ACTION BAR                              */}
      {/* ------------------------------------------------------- */}
      <AnimatePresence>
        {showFloatingBar && (
           <motion.div 
             initial={{ y: 100, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             exit={{ y: 100, opacity: 0 }}
             transition={{ type: "spring", stiffness: 300, damping: 30 }}
             className="fixed bottom-8 left-0 right-0 z-50 flex justify-center md:hidden pointer-events-none"
           >
              <button
                 onClick={() => setIsMobileMenuOpen(true)}
                 className="pointer-events-auto flex items-center gap-3 bg-foreground text-background px-6 py-3 rounded-full shadow-2xl shadow-black/20"
              >
                  <span className="text-lg font-serif italic">*</span>
                  <span className="text-xs font-mono uppercase tracking-widest">Search</span>
              </button>
           </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------- */}
      {/* MOBILE FULLSCREEN MENU (Overlay)                        */}
      {/* ------------------------------------------------------- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
           <motion.div 
             initial={{ opacity: 0, y: "100%" }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: "100%" }}
             transition={{ type: "spring", damping: 30, stiffness: 300 }}
             className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl md:hidden flex flex-col p-6"
           >
              {/* Close Button */}
              <div className="flex justify-end mb-8">
                 <button 
                   onClick={() => setIsMobileMenuOpen(false)}
                   className="p-2 rounded-full hover:bg-foreground/5"
                 >
                    <X size={24} />
                 </button>
              </div>

              {/* Search Content */}
              <div className="flex-1 flex flex-col gap-12">
                 <div className="flex flex-col gap-2">
                    <p className="text-sm font-mono text-muted-foreground">SEARCH</p>
                    <input 
                      autoFocus
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type keywords..."
                      className="text-3xl font-light bg-transparent border-b border-foreground/20 pb-4 outline-none placeholder:text-foreground/20"
                    />
                 </div>

                 <div className="flex flex-col gap-4">
                    <p className="text-sm font-mono text-muted-foreground">FILTER BY</p>
                    <div className="flex flex-wrap gap-3">
                       {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => {
                                setActiveCategory(cat);
                                setIsMobileMenuOpen(false); // Close on select
                            }}
                            className={`px-4 py-2 rounded-full border text-sm transition-all ${
                                activeCategory === cat 
                                ? 'bg-foreground text-background border-foreground' 
                                : 'bg-transparent text-foreground border-foreground/20'
                            }`}
                          >
                            {cat}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="mt-auto">
                    <p className="text-xs text-center text-muted-foreground">
                        {filteredData.length} results found
                    </p>
                 </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};