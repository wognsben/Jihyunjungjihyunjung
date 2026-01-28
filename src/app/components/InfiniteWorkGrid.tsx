import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import SplitType from 'split-type';
import { Work } from '@/contexts/WorkContext';

interface InfiniteWorkGridProps {
  works: Work[];
  onWorkClick?: (workId: number) => void;
}

interface GridItem {
  el: HTMLDivElement;
  container: HTMLDivElement;
  wrapper: HTMLDivElement;
  img: HTMLImageElement;
  x: number;
  y: number;
  w: number;
  h: number;
  extraX: number;
  extraY: number;
  rect: DOMRect;
  ease: number;
  workId: number;
}

export const InfiniteWorkGrid = ({ works, onWorkClick }: InfiniteWorkGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef({
    ease: 0.06,
    current: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    last: { x: 0, y: 0 },
    delta: { x: { c: 0, t: 0 }, y: { c: 0, t: 0 } }
  });
  const mouseRef = useRef({
    x: { t: 0.5, c: 0.5 },
    y: { t: 0.5, c: 0.5 },
    press: { t: 0, c: 0 }
  });
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    scrollX: 0,
    scrollY: 0
  });
  const tileSizeRef = useRef({ w: 0, h: 0 });
  const itemsRef = useRef<GridItem[]>([]);
  const rafRef = useRef<number>();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const introItemsRef = useRef<HTMLDivElement[]>([]);

  // Silent Luxury 레이아웃: 더 타이트하고 비대칭적인 그리드
  // 원본 Figma 사이즈에서 60%로 축소하여 절제미 강화
  const layoutData = [
    { x: 71, y: 58, w: 240, h: 162 },    // 60% scaled
    { x: 211, y: 255, w: 324, h: 216 },
    { x: 631, y: 158, w: 240, h: 162 },
    { x: 1191, y: 245, w: 156, h: 117 },
    { x: 351, y: 687, w: 156, h: 174 },
    { x: 751, y: 824, w: 123, h: 92 },
    { x: 911, y: 540, w: 156, h: 210 },
    { x: 1051, y: 803, w: 240, h: 180 },
    { x: 71, y: 922, w: 210, h: 156 },
  ];

  const originalSize = { w: 1522, h: 1238 };

  useEffect(() => {
    if (!containerRef.current || works.length === 0) {
      console.warn('InfiniteWorkGrid: Container or works not ready', { 
        hasContainer: !!containerRef.current, 
        worksLength: works.length 
      });
      return;
    }

    console.log('InfiniteWorkGrid: Initializing with works:', works);

    const container = containerRef.current;
    let winW = window.innerWidth;
    let winH = window.innerHeight;

    // IntersectionObserver for caption visibility
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle('visible', entry.isIntersecting);
      });
    });

    const resize = () => {
      winW = window.innerWidth;
      winH = window.innerHeight;

      tileSizeRef.current = {
        w: winW,
        h: winW * (originalSize.h / originalSize.w),
      };

      scrollRef.current.current = { x: 0, y: 0 };
      scrollRef.current.target = { x: 0, y: 0 };
      scrollRef.current.last = { x: 0, y: 0 };

      container.innerHTML = '';

      const scaleX = tileSizeRef.current.w / originalSize.w;
      const scaleY = tileSizeRef.current.h / originalSize.h;

      const baseItems = layoutData.map((d, i) => {
        const work = works[i % works.length];
        return {
          work,
          x: d.x * scaleX,
          y: d.y * scaleY,
          w: d.w * scaleX,
          h: d.h * scaleY,
        };
      });

      itemsRef.current = [];
      const repsX = [0, tileSizeRef.current.w];
      const repsY = [0, tileSizeRef.current.h];

      baseItems.forEach(base => {
        repsX.forEach(offsetX => {
          repsY.forEach(offsetY => {
            const el = document.createElement('div');
            el.classList.add('infinite-grid-item');
            el.style.width = `${base.w}px`;
            el.style.position = 'absolute';
            el.style.cursor = 'pointer';

            const wrapper = document.createElement('div');
            wrapper.classList.add('infinite-grid-wrapper');
            el.appendChild(wrapper);

            const itemImage = document.createElement('div');
            itemImage.classList.add('infinite-grid-image');
            itemImage.style.width = `${base.w}px`;
            itemImage.style.height = `${base.h}px`;
            itemImage.style.overflow = 'hidden';
            wrapper.appendChild(itemImage);

            // WordPress title 추출 (title_ko, title_en, title_jp 중 하나)
            const workTitle = base.work.title_ko || base.work.title_en || base.work.title_jp || 'UNTITLED';
            const workYear = base.work.year || '';

            const img = new Image();
            // WorkGrid와 동일한 fallback: thumbnail → galleryImages[0]
            const imgSrc = base.work.thumbnail || (base.work.galleryImages && base.work.galleryImages[0]) || '';
            
            if (!imgSrc) {
              console.warn(`No image URL for work: ${workTitle}`, base.work);
              // 이미지가 없으면 플레이스홀더 표시
              itemImage.style.background = '#e5e5e5';
              itemImage.innerHTML = `
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999; font-size: 0.7rem; font-family: 'Courier New', monospace;">
                  NO IMAGE
                </div>
              `;
            } else {
              console.log(`Loading image for ${workTitle}:`, imgSrc);
              
              img.src = imgSrc;
              img.style.width = '100%';
              img.style.height = '100%';
              img.style.objectFit = 'cover';
              img.style.willChange = 'transform';
              
              // Debug: 이미지 로딩 확인
              img.onload = () => {
                console.log('Image loaded successfully:', imgSrc);
              };
              
              img.onerror = () => {
                console.warn('Image failed to load:', imgSrc);
                // 이미지 로딩 실패시 플레이스홀더
                itemImage.style.background = '#e5e5e5';
                itemImage.innerHTML = `
                  <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999; font-size: 0.7rem; font-family: 'Courier New', monospace;">
                    LOAD FAILED
                  </div>
                `;
              };
              
              itemImage.appendChild(img);
            }

            // Silent Luxury Caption: 극도로 절제된 디자인
            const caption = document.createElement('div');
            caption.classList.add('infinite-grid-caption');
            caption.style.marginTop = '0.75rem';
            caption.style.display = 'flex';
            caption.style.alignItems = 'baseline';
            caption.style.gap = '0.5rem';
            
            // 제목 span
            const titleSpan = document.createElement('span');
            titleSpan.className = 'font-serif text-xs tracking-wider opacity-90 text-black';
            titleSpan.textContent = workTitle;
            
            // 연도 span
            const yearSpan = document.createElement('span');
            yearSpan.className = 'font-mono text-[0.65rem] opacity-50 text-black';
            yearSpan.textContent = workYear;
            
            caption.appendChild(titleSpan);
            caption.appendChild(yearSpan);

            const split = new SplitType(caption, { types: 'lines' });
            if (split.lines) {
              split.lines.forEach((line, i) => {
                (line as HTMLElement).style.transitionDelay = `${i * 0.15}s`;
              });
            }

            wrapper.appendChild(caption);
            container.appendChild(el);
            observerRef.current?.observe(caption);

            // Click handler
            el.addEventListener('click', () => {
              if (!dragRef.current.isDragging && onWorkClick) {
                onWorkClick(Number(base.work.id));
              }
            });

            itemsRef.current.push({
              el,
              container: itemImage,
              wrapper,
              img,
              x: base.x + offsetX,
              y: base.y + offsetY,
              w: base.w,
              h: base.h,
              extraX: 0,
              extraY: 0,
              rect: el.getBoundingClientRect(),
              ease: Math.random() * 0.5 + 0.5,
              workId: Number(base.work.id),
            });
          });
        });
      });

      tileSizeRef.current.w *= 2;
      tileSizeRef.current.h *= 2;

      scrollRef.current.current.x = scrollRef.current.target.x = scrollRef.current.last.x = -winW * 0.1;
      scrollRef.current.current.y = scrollRef.current.target.y = scrollRef.current.last.y = -winH * 0.1;

      // Init intro animation with delay to ensure DOM is ready
      setTimeout(() => {
        initIntro();
        intro();
      }, 100);
    };

    const initIntro = () => {
      introItemsRef.current = Array.from(container.querySelectorAll('.infinite-grid-wrapper')).filter((item) => {
        const rect = item.getBoundingClientRect();
        return (
          rect.x > -rect.width &&
          rect.x < window.innerWidth + rect.width &&
          rect.y > -rect.height &&
          rect.y < window.innerHeight + rect.height
        );
      }) as HTMLDivElement[];

      introItemsRef.current.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const x = -rect.x + window.innerWidth * 0.5 - rect.width * 0.5;
        const y = -rect.y + window.innerHeight * 0.5 - rect.height * 0.5;
        gsap.set(item, { x, y });
      });
    };

    const intro = () => {
      // Check if we have items before animating
      if (introItemsRef.current.length === 0) {
        console.warn('No intro items found for animation');
        return;
      }

      gsap.to(introItemsRef.current.reverse(), {
        duration: 3.5, // Slower for Silent Luxury
        ease: 'power2.inOut', // More elegant
        x: 0,
        y: 0,
        stagger: 0.08, // More breathing room
      });
    };

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      dragRef.current.isDragging = true;
      document.documentElement.classList.add('dragging');
      mouseRef.current.press.t = 1;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      dragRef.current.scrollX = scrollRef.current.target.x;
      dragRef.current.scrollY = scrollRef.current.target.y;
    };

    const onMouseUp = () => {
      dragRef.current.isDragging = false;
      document.documentElement.classList.remove('dragging');
      mouseRef.current.press.t = 0;
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x.t = e.clientX / winW;
      mouseRef.current.y.t = e.clientY / winH;

      if (dragRef.current.isDragging) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        scrollRef.current.target.x = dragRef.current.scrollX + dx;
        scrollRef.current.target.y = dragRef.current.scrollY + dy;
      }
    };

    const render = () => {
      // Auto-scroll animation: gentle continuous movement
      scrollRef.current.target.x += 0.2; // Slow horizontal drift
      scrollRef.current.target.y += 0.1; // Subtle vertical drift
      
      scrollRef.current.current.x += (scrollRef.current.target.x - scrollRef.current.current.x) * scrollRef.current.ease;
      scrollRef.current.current.y += (scrollRef.current.target.y - scrollRef.current.current.y) * scrollRef.current.ease;

      scrollRef.current.delta.x.t = scrollRef.current.current.x - scrollRef.current.last.x;
      scrollRef.current.delta.y.t = scrollRef.current.current.y - scrollRef.current.last.y;
      scrollRef.current.delta.x.c += (scrollRef.current.delta.x.t - scrollRef.current.delta.x.c) * 0.04;
      scrollRef.current.delta.y.c += (scrollRef.current.delta.y.t - scrollRef.current.delta.y.c) * 0.04;
      mouseRef.current.x.c += (mouseRef.current.x.t - mouseRef.current.x.c) * 0.04;
      mouseRef.current.y.c += (mouseRef.current.y.t - mouseRef.current.y.c) * 0.04;
      mouseRef.current.press.c += (mouseRef.current.press.t - mouseRef.current.press.c) * 0.04;

      const dirX = scrollRef.current.current.x > scrollRef.current.last.x ? 'right' : 'left';
      const dirY = scrollRef.current.current.y > scrollRef.current.last.y ? 'down' : 'up';

      itemsRef.current.forEach(item => {
        // Reduced parallax for more restraint (5 → 3)
        const newX = 3 * scrollRef.current.delta.x.c * item.ease + (mouseRef.current.x.c - 0.5) * item.rect.width * 0.4;
        const newY = 3 * scrollRef.current.delta.y.c * item.ease + (mouseRef.current.y.c - 0.5) * item.rect.height * 0.4;
        const scrollX = scrollRef.current.current.x;
        const scrollY = scrollRef.current.current.y;
        const posX = item.x + scrollX + item.extraX + newX;
        const posY = item.y + scrollY + item.extraY + newY;

        const beforeX = posX > winW;
        const afterX = posX + item.rect.width < 0;
        if (dirX === 'right' && beforeX) item.extraX -= tileSizeRef.current.w;
        if (dirX === 'left' && afterX) item.extraX += tileSizeRef.current.w;

        const beforeY = posY > winH;
        const afterY = posY + item.rect.height < 0;
        if (dirY === 'down' && beforeY) item.extraY -= tileSizeRef.current.h;
        if (dirY === 'up' && afterY) item.extraY += tileSizeRef.current.h;

        const fx = item.x + scrollX + item.extraX + newX;
        const fy = item.y + scrollY + item.extraY + newY;
        item.el.style.transform = `translate(${fx}px, ${fy}px)`;
        
        // Subtle hover effect: slight scale + reduced parallax
        item.img.style.transform = `scale(${1.05 + 0.05 * mouseRef.current.press.c * item.ease}) translate(${-mouseRef.current.x.c * item.ease * 5}%, ${-mouseRef.current.y.c * item.ease * 5}%)`;
      });

      scrollRef.current.last.x = scrollRef.current.current.x;
      scrollRef.current.last.y = scrollRef.current.current.y;

      rafRef.current = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [works, onWorkClick]);

  return (
    <div className="infinite-grid-section relative w-full" style={{ height: '70vh' }}>
      {/* Cynical Hint: Appears briefly then fades */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 animate-fade-out" style={{ animationDelay: '2s', animationDuration: '2s', animationFillMode: 'forwards' }}>
        <span className="text-black/20 text-xs uppercase tracking-[0.3em] font-light">
          Drag to Explore
        </span>
      </div>

      {/* Infinite Grid Container */}
      <div
        ref={containerRef}
        className="infinite-grid-container relative w-full h-full overflow-hidden bg-white"
        style={{ cursor: 'grab' }}
      />

      {/* Custom Styles */}
      <style>{`
        .dragging .infinite-grid-container {
          cursor: grabbing !important;
        }

        .infinite-grid-item {
          will-change: transform;
        }

        .infinite-grid-wrapper {
          will-change: transform;
          transition: opacity 0.3s ease;
        }

        .infinite-grid-image {
          background: #f5f5f5;
        }

        .infinite-grid-caption {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .infinite-grid-caption.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes fade-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        .animate-fade-out {
          animation-name: fade-out;
        }
      `}</style>
    </div>
  );
};