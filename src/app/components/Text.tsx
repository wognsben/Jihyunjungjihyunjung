import { useState, useMemo, useEffect, useRef } from 'react';
import { Footer } from '@/app/components/Footer';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(TextPlugin);
}

// ----------------------------------------------------------------------
// Types & Data
// ----------------------------------------------------------------------

type Category = 'All' | 'Article' | 'Note' | 'Review';

interface TextItem {
  id: string;
  year: string;
  category: Category;
  author: {
    en: string;
    ko: string;
    jp: string;
  };
  title: {
    en: string;
    ko: string;
    jp: string;
  };
  link: string;
  image: string; // Added image field
}

// Data with images populated from user input (25 items filled, 3 empty)
// UPDATED: Using raw.githubusercontent.com for reliable CORS support
const textData: TextItem[] = [
  { 
    id: 'post-1585', year: '2024', category: 'Article', 
    author: { en: 'Hyejin Mun', ko: '문혜진', jp: 'Hyejin Mun' },
    title: { en: 'Poking the Side of Sculpture', ko: '조각의 옆구리를 슬쩍 찌르기 : 있는 듯 없는 듯 부지런한 정지현의 사물들', jp: '조각의 옆구리를 슬쩍 찌르기' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/1.jpg'
  },
  { 
    id: 'post-1587', year: '2024', category: 'Article', 
    author: { en: 'Soyeon Ahn', ko: '안소연', jp: 'Soyeon Ahn' },
    title: { en: '〈Hang-Dog〉 The Bird on the Roof Outside', ko: '〈행도그〉 저 창문 밖 지붕 위의 새', jp: '〈Hang-Dog〉 窓の外の屋根の上の鳥' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/10.jpg'
  },
  { 
    id: 'post-1429', year: '2023', category: 'Article', 
    author: { en: 'Hanbum Lee', ko: '이한범', jp: 'Hanbum Lee' },
    title: { en: '〈Gouge〉 / Sculpture Gone Far', ko: '〈가우지〉 / 멀리가는 조각', jp: '〈Gouge〉 / 遠くへ行く彫刻' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/11.jpg'
  },
  { 
    id: 'post-1410', year: '2022', category: 'Article', 
    author: { en: 'Wonhwa Yoon', ko: '윤원화', jp: 'Wonhwa Yoon' },
    title: { en: '〈Gouge〉 / Invisible Sculpture', ko: '〈가우지〉 / 보이지 않는 조각', jp: '〈Gouge〉 / 見えない彫刻' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/12.jpg'
  },
  { 
    id: 'post-1220', year: '2021', category: 'Article', 
    author: { en: 'Hanbum Lee', ko: '이한범', jp: 'Hanbum Lee' },
    title: { en: 'Unapproachable Land & Person with a Bag', ko: '갈 수 없는 땅 & 가방을 든 사람', jp: '行けない土地 & 鞄を持った人' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/13.jpg'
  },
  { 
    id: 'post-1191', year: '2021', category: 'Article', 
    author: { en: 'Jeongwon Ye', ko: '예정원', jp: 'Jeongwon Ye' },
    title: { en: 'Alley Play of Loose Community 〈Room Adventure_with VR〉', ko: '느슨한 공동체의 골목놀이 〈방구석 대모험_VR끼고〉', jp: '緩やかな共同体の路地遊び' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/14.jpg'
  },
  { 
    id: 'post-947', year: '2019', category: 'Article', 
    author: { en: 'Yuki Konno', ko: '콘노 유키', jp: 'Yuki Konno' },
    title: { en: '〈Multipurpose Henry〉 / Plus Plus Minus', ko: '〈다목적 헨리〉 / 더하기 더하기 빼기', jp: '〈Multipurpose Henry〉 / 足す足す引く' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/15.jpg'
  },
  { 
    id: 'post-840', year: '2019', category: 'Article', 
    author: { en: 'Yunkyoung Kim', ko: '김윤경', jp: 'Yunkyoung Kim' },
    title: { en: '〈Multipurpose Henry〉 / Is this world worthy to be destroyed?', ko: '〈다목적 헨리〉 / 이 세상은 파괴할 만한 가치가 있을까?', jp: '〈Multipurpose Henry〉 / この世界は破壊される価値があるか？' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/16.jpg'
  },
  { 
    id: 'post-822', year: '2019', category: 'Article', 
    author: { en: 'Hyokyoung Jeon', ko: '전효경', jp: 'Hyokyoung Jeon' },
    title: { en: "Jihyun Jung: Practice of 'Making'", ko: "정지현: ‘만들기’의 실천", jp: "Jihyun Jung: ‘作る’の実践" }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/17.jpg'
  },
  { 
    id: 'post-931', year: '2019', category: 'Review', 
    author: { en: 'Hanbum Lee', ko: '이한범', jp: 'Hanbum Lee' },
    title: { en: '〈Once a Day〉 / A Stage Contemplating the World of Objects', ko: '〈하루 한 번〉 / 사물의 세계를 사유하는 무대', jp: '〈一日一回〉 / 物の世界を思惟する舞台' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/18.jpg'
  },
  { 
    id: 'post-933', year: '2018', category: 'Note', 
    author: { en: 'Table Talk', ko: '테이블 토크', jp: 'Table Talk' },   
    title: { en: '〈Once a Day〉 / Story of Three', ko: '〈하루 한 번〉 / 셋의 이야기', jp: '〈一日一回〉 / 三つの話' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/19.jpg'
  },
  { 
    id: 'post-636', year: '2017', category: 'Review', 
    author: { en: 'Haeju Kim', ko: '김해주', jp: 'Haeju Kim' },
    title: { en: '〈Dawn Breaks, Seoul〉 / Time of Adventure', ko: '〈도운브레익스,서울〉 / 모험의 시간', jp: '〈Dawn Breaks, Seoul〉 / 冒険の時間' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/2.jpg'
  },
  { 
    id: 'post-662', year: '2016', category: 'Review', 
    author: { en: 'Jee Young Maeng', ko: '맹지영', jp: 'Jee Young Maeng' },
    title: { en: '〈Gomyomsom〉 / Resisting Signification', ko: '〈곰염섬〉 / 의미화를 거스르기', jp: '〈Gomyomsom〉 / 意味化に逆らう' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/20.jpg'
  },
  { 
    id: 'post-604', year: '2016', category: 'Review', 
    author: { en: 'Hanbum Lee', ko: '이한범', jp: 'Hanbum Lee' },
    title: { en: '〈Gomyomsom〉 / I Would Choose Not To', ko: '〈곰염섬〉 / 안 하는 편을 택하겠습니다', jp: '〈Gomyomsom〉 / しない方を選びます' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/21.jpg'
  },
  { 
    id: 'post-606', year: '2016', category: 'Review', 
    author: { en: 'Anonymous', ko: 'Anonymous', jp: 'Anonymous' },
    title: { en: '〈Gomyomsom〉 / Walking Between Shaking and Overlapping Framing', ko: '〈곰염섬〉 / 흔들리고 중첩되는 프레이밍 사이에서 거닐기', jp: '〈Gomyomsom〉 / 揺れて重なるフレーミングの間を歩く' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/22.jpg'
  },
  { 
    id: 'post-611', year: '2016', category: 'Review', 
    author: { en: 'Kyunghwan Yeo', ko: '여경환', jp: 'Kyunghwan Yeo' },
    title: { en: '〈Gomyomsom〉', ko: '〈곰염섬〉', jp: '〈Gomyomsom〉' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/23.jpg'
  },
  { 
    id: 'post-608', year: '2016', category: 'Review', 
    author: { en: 'Bbyabbya Kim', ko: '김뺘뺘', jp: 'Bbyabbya Kim' },
    title: { en: 'Thinking of ◼︎◼︎◼︎ Repeatedly', ko: '◼︎◼︎◼︎을 자꾸 생각하기', jp: '◼︎◼︎◼︎を何度も考える' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/24.jpg'
  },
  { 
    id: 'post-520', year: '2016', category: 'Note', 
    author: { en: 'Junghyun Kim', ko: '김정현', jp: 'Junghyun Kim' },
    title: { en: 'Memo or Before Words', ko: '메모 또는 낱말 이전', jp: 'メモまたは言葉以前' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/25.jpg'
  },
  { 
    id: 'post-501', year: '2014', category: 'Note', 
    author: { en: 'Jee Young Maeng', ko: '맹지영', jp: 'Jee Young Maeng' },   
    title: { en: 'Story about Conversation', ko: '대화에 관한 이야기: 반복적 혹은 분절된 대화', jp: '会話についての物語' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/3.jpg'
  },
  { 
    id: 'post-342', year: '2014', category: 'Review', 
    author: { en: 'Jee Young Maeng', ko: '맹지영', jp: 'Jee Young Maeng' },
    title: { en: 'Using The Ear In Order To Hear', ko: '듣기 위해 귀를 사용한 일', jp: '聞くために耳を使ったこと' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/4.jpg'
  },
  { 
    id: 'post-341', year: '2013', category: 'Review', 
    author: { en: 'Sujin Park', ko: '박수진', jp: 'Sujin Park' },
    title: { en: 'Bird Eat Bird', ko: 'Bird Eat Bird', jp: 'Bird Eat Bird' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/5.jpg'
  },
  { 
    id: 'post-340', year: '2013', category: 'Review', 
    author: { en: 'Areum Woo', ko: '우아름', jp: 'Areum Woo' },
    title: { en: 'Bird Eat Bird', ko: 'Bird Eat Bird', jp: 'Bird Eat Bird' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/6.jpg'
  },
  { 
    id: 'post-339', year: '2012', category: 'Note', 
    author: { en: 'Jihyun Jung', ko: '정지현', jp: 'Jihyun Jung' },
    title: { en: 'Same but Different Landscape', ko: '매일 비슷하면서 다른 풍경', jp: '毎日似ているようで違う風景' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/7.jpg'
  },
  { 
    id: 'post-338', year: '2011', category: 'Article', 
    author: { en: 'Seulbi Lee', ko: '이슬비', jp: 'Seulbi Lee' },
    title: { en: 'Missed Spot 2', ko: '빗나간 자리 2', jp: '外れた場所 2' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/8.jpg'
  },
  { 
    id: 'post-337', year: '2011', category: 'Article', 
    author: { en: 'Areum Woo', ko: '우아름', jp: 'Areum Woo' },
    title: { en: 'Missed Spot', ko: '빗나간 자리', jp: '外れた場所' }, 
    link: '#',
    image: 'https://raw.githubusercontent.com/wognsben/gallery/main/9.jpg'
  },
  { 
    id: 'post-336', year: '2011', category: 'Review', 
    author: { en: 'Young-geul Kim', ko: '김영글', jp: 'Young-geul Kim' },
    title: { en: 'Missed Spot', ko: '빗나간 자리', jp: '外れた場所' }, 
    link: '#',
    image: ''
  },
  { 
    id: 'post-334', year: '2011', category: 'Note', 
    author: { en: 'Jihyun Jung', ko: '정지현', jp: 'Jihyun Jung' },
    title: { en: 'Missed Spot', ko: '빗나간 자리', jp: '外れた場所' }, 
    link: '#',
    image: ''
  },
  { 
    id: 'post-333', year: '2010', category: 'Review', 
    author: { en: 'Jiyeon Kim', ko: '김지연', jp: 'Jiyeon Kim' },
    title: { en: 'Unspoken Words', ko: '못다한 말', jp: '言えなかった言葉' }, 
    link: '#',
    image: ''
  },
];

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
    return textData.filter((item) => {
      if (activeCategory !== 'All' && item.category !== activeCategory) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const title = item.title[lang].toLowerCase();
        const author = item.author[lang].toLowerCase();
        return (
          title.includes(query) ||
          author.includes(query) ||
          item.year.includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [activeCategory, searchQuery, lang]);

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
        style={{ x: 0, y: 0 }} // Initial position
      >
        <AnimatePresence mode="wait">
            {hoveredImage && hoveredImage !== '' && (
                <motion.div
                    key={hoveredImage}
                    initial={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 20, y: 20 }} // Offset from cursor
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="relative"
                >
                    <img 
                        src={hoveredImage} 
                        alt="Preview" 
                        className="w-80 h-auto max-h-[400px] object-cover shadow-2xl rounded-sm bg-background/50 backdrop-blur-sm"
                    />
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 md:px-12 pt-24 md:pt-24 pb-24 flex flex-col md:flex-row gap-8 md:gap-24 relative">

        {/* ------------------------------------------------------- */}
        {/* SIDEBAR (Desktop: Sticky, Mobile: Hidden on Scroll)     */}
        {/* ------------------------------------------------------- */}
        <motion.div 
            style={{ opacity: sidebarOpacity }}
            className={`
               md:w-1/4 lg:w-1/5 md:h-[calc(100vh-6rem)] 
               md:sticky md:top-24 z-30 flex flex-col gap-6 md:gap-12 
               transition-all duration-300 ease-out
               ${showFloatingBar ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'}
            `}
        >
          {/* GHOST SEARCH BAR */}
          <div className="relative group w-full pt-2">
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
                href={item.link}
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                onMouseEnter={() => setHoveredImage(item.image)}
                onMouseLeave={() => setHoveredImage(null)}
                className="group relative border-b border-foreground/5 py-8 md:py-6 transition-all duration-500 hover:bg-foreground/[0.02] md:-mx-6 md:px-6 cursor-pointer"
              >
                <div className="flex flex-col md:grid md:grid-cols-[1fr_200px_80px] md:gap-8 md:items-baseline">
                  
                  {/* Title Area + Category */}
                  <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-8 order-1">
                    {/* Category Label (Desktop & Mobile) */}
                    <span className="text-[10px] font-mono text-muted-foreground/60 w-16 shrink-0">
                       {item.category.toLowerCase()}
                    </span>
                    
                    <h3 className="font-serif text-sm font-light leading-snug group-hover:translate-x-1 transition-transform duration-300">
                      <FormattedTitle text={item.title[lang]} />
                    </h3>
                  </div>

                  {/* Mobile Layout */}
                  <div className="flex md:hidden items-center gap-3 mt-4 text-xs font-light text-muted-foreground order-2 pl-[calc(4rem+2px)]"> {/* Indent to align with title */}
                     <span>{item.author[lang]}</span>
                     <span className="w-[1px] h-3 bg-foreground/20"></span>
                     <span className="font-mono text-xs">{item.year}</span>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:block order-2 mt-2 md:mt-0 md:group-hover:translate-x-1 transition-transform duration-300 delay-75">
                    <span className="text-xs font-light text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.author[lang]}
                    </span>
                  </div>
                  <div className="hidden md:block order-3 mt-1 md:mt-0 md:text-right md:group-hover:translate-x-1 transition-transform duration-300 delay-100">
                    <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.year}
                    </span>
                  </div>
                </div>

                <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:-translate-x-2 transition-all duration-300 text-muted-foreground text-sm">
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
