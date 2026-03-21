import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { parseMultilingualCaption } from '@/services/wp-api';

// ============================================================
// BlockRenderer: WordPress Gutenberg 블록 → React 컴포넌트
// WP 에디터에서 배치한 순서 그대로 프론트에 렌더링
// ============================================================

interface ParsedBlock {
  type: 'paragraph' | 'heading' | 'image' | 'gallery' | 'video' | 'embed' | 'list' | 'quote' | 'separator' | 'spacer' | 'unknown';
  html: string;
  attrs?: Record<string, any>;
  align?: 'left' | 'center' | 'right' | 'wide' | 'full';
}

interface RenderGroup {
  type: 'single' | 'image-slider';
  blocks: ParsedBlock[];
}

// ============================================================
// HTML Sanitization: WP에서 들어오는 더러운 HTML 정제
// ============================================================
const sanitizeHtml = (html: string): string => {
  let cleaned = html;

  // 0a. [caption] WordPress 숏코드 → <figure><img><figcaption> 변환
  cleaned = cleaned.replace(
    /\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/gi,
    (_, inner) => {
      const imgMatch = inner.match(/<img[^>]+>/i);
      const imgTag = imgMatch ? imgMatch[0] : '';
      const captionText = inner
        .replace(/<img[^>]+>/i, '')
        .replace(/<\/?a[^>]*>/gi, '')
        .trim();
      return `<figure class="wp-block-image">${imgTag}${captionText ? `<figcaption>${captionText}</figcaption>` : ''}</figure>`;
    }
  );

  // 0b. [embed]URL[/embed] WordPress 숏코드 → iframe 변환
  cleaned = cleaned.replace(/\[embed\](.*?)\[\/embed\]/gi, (_, url) => {
    const trimmedUrl = url.trim();

    const vimeoMatch = trimmedUrl.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return `<figure class="wp-block-embed"><div class="wp-block-embed__wrapper"><iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div></figure>`;
    }

    const ytMatch = trimmedUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
    if (ytMatch) {
      return `<figure class="wp-block-embed"><div class="wp-block-embed__wrapper"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></figure>`;
    }

    return `<figure class="wp-block-embed"><div class="wp-block-embed__wrapper"><iframe src="${trimmedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe></div></figure>`;
  });

  // 1. &nbsp; 만 있는 빈 문단 제거
  cleaned = cleaned.replace(/<p[^>]*>\s*(&nbsp;\s*)+<\/p>/gi, '');

  // 2. <br>만 있는 빈 문단 제거
  cleaned = cleaned.replace(/<p[^>]*>\s*(<br\s*\/?\s*>\s*)+<\/p>/gi, '');

  // 3. 연속 <br> 3개 이상 → 2개로 축소
  cleaned = cleaned.replace(/(<br\s*\/?\s*>\s*){3,}/gi, '<br><br>');

  // 4. 빈 문단 제거
  cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, '');

  return cleaned;
};

// ============================================================
// Detect alignment from WP block attrs + HTML classes
// ============================================================
const detectAlign = (html: string, attrs?: Record<string, any>): ParsedBlock['align'] => {
  const validAligns = ['left', 'center', 'right', 'wide', 'full'] as const;
  type AlignType = typeof validAligns[number];
  const isValid = (v: string): v is AlignType => validAligns.includes(v as AlignType);

  if (attrs?.align && isValid(attrs.align)) return attrs.align;
  if (attrs?.textAlign && isValid(attrs.textAlign)) return attrs.textAlign;

  const textAlignMatch = html.match(/has-text-align-(left|center|right)/i);
  if (textAlignMatch) return textAlignMatch[1].toLowerCase() as AlignType;

  const mediaAlignMatch = html.match(/\balign(left|right|center|wide|full)\b/i);
  if (mediaAlignMatch) return mediaAlignMatch[1].toLowerCase() as AlignType;

  const styleMatch = html.match(/style="[^"]*text-align:\s*(left|center|right)/i);
  if (styleMatch) return styleMatch[1].toLowerCase() as AlignType;

  return undefined;
};

const textAlignClass = (align?: ParsedBlock['align']): string => {
  switch (align) {
    case 'left': return 'text-left';
    case 'center': return 'text-center';
    case 'right': return 'text-right';
    default: return '';
  }
};

// ============================================================
// Multilingual Content Filter
// ============================================================
const LANG_MARKERS = ['[KO]', '[EN]', '[JP]'] as const;
const hasLangMarkers = (text: string) => LANG_MARKERS.some(m => text.includes(m));

const parseMultilingualHtml = (html: string, lang: string): string => {
  if (!hasLangMarkers(html)) return html;

  const langKey = `[${lang.toUpperCase()}]`;
  const allMarkers = LANG_MARKERS as readonly string[];

  const startIdx = html.indexOf(langKey);
  if (startIdx === -1) {
    const koIdx = html.indexOf('[KO]');
    if (koIdx === -1) return html;
    const koStart = koIdx + 4;
    let koEnd = html.length;
    for (const m of allMarkers) {
      if (m === '[KO]') continue;
      const idx = html.indexOf(m, koStart);
      if (idx !== -1 && idx < koEnd) koEnd = idx;
    }
    return html.slice(0, html.indexOf('[KO]')) + html.slice(koStart, koEnd);
  }

  const contentStart = startIdx + langKey.length;
  let contentEnd = html.length;
  for (const m of allMarkers) {
    if (m === langKey) continue;
    const idx = html.indexOf(m, contentStart);
    if (idx !== -1 && idx < contentEnd) contentEnd = idx;
  }

  const beforeMarkers = html.slice(0, html.indexOf(LANG_MARKERS[0]));
  return beforeMarkers + html.slice(contentStart, contentEnd);
};

const filterBlocksByLanguage = (blocks: ParsedBlock[], lang: string): ParsedBlock[] => {
  const textTypes = new Set(['paragraph', 'heading', 'list', 'quote', 'unknown']);

  const isStandaloneMarker = (b: ParsedBlock) => {
    const text = b.html.replace(/<[^>]+>/g, '').trim();
    return text === '[KO]' || text === '[EN]' || text === '[JP]';
  };

  const hasStandaloneMarkers = blocks.some(isStandaloneMarker);

  if (hasStandaloneMarkers) {
    const langKey = `[${lang.toUpperCase()}]`;
    let currentSection: string | null = null;
    const filtered: ParsedBlock[] = [];

    for (const block of blocks) {
      const text = block.html.replace(/<[^>]+>/g, '').trim();

      if (text === '[KO]' || text === '[EN]' || text === '[JP]') {
        currentSection = text;
        continue;
      }

      if (currentSection === null) {
        filtered.push(block);
      } else if (currentSection === langKey) {
        filtered.push(block);
      } else if (!textTypes.has(block.type)) {
        filtered.push(block);
      }
    }

    return filtered;
  }

  const anyBlockHasMarkers = blocks.some(b => textTypes.has(b.type) && hasLangMarkers(b.html));
  if (!anyBlockHasMarkers) return blocks;

  return blocks.map(b => {
    if (textTypes.has(b.type) && hasLangMarkers(b.html)) {
      const filtered = parseMultilingualHtml(b.html, lang);
      return { ...b, html: filtered };
    }
    return b;
  }).filter(b => {
    if (textTypes.has(b.type)) {
      const text = b.html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      return text.length > 0;
    }
    return true;
  });
};

// ============================================================
// Shared inline link + nested list styles
// ============================================================
const wpContentStyles = [
  '[&_a]:underline [&_a]:decoration-foreground/20 [&_a]:underline-offset-[3px]',
  '[&_a]:transition-colors [&_a]:duration-300',
  '[&_a:hover]:decoration-foreground/50 [&_a:hover]:text-foreground',
  '[&_ul_ul]:mt-1 [&_ul_ul]:pl-4 [&_ol_ol]:mt-1 [&_ol_ol]:pl-4',
].join(' ');

// ============================================================
// Parse WordPress block comments
// ============================================================
const parseBlocks = (html: string): ParsedBlock[] => {
  if (!html || !html.trim()) return [];

  const cleanHtml = sanitizeHtml(html);

  const blocks: ParsedBlock[] = [];
  const blockPattern = /<!-- wp:(\S+?)(?:\s+(\{[^}]*\}))?\s*(?:\/)?-->([\s\S]*?)(?:<!-- \/wp:\1\s*-->)?/g;

  let lastIndex = 0;
  let match;

  while ((match = blockPattern.exec(cleanHtml)) !== null) {
    const beforeContent = cleanHtml.slice(lastIndex, match.index).trim();
    if (beforeContent) {
      blocks.push(...parseOrphanHtml(beforeContent));
    }

    const blockName = match[1];
    const attrsStr = match[2];
    const innerHtml = match[3]?.trim() || '';

    let attrs: Record<string, any> = {};
    if (attrsStr) {
      try {
        attrs = JSON.parse(attrsStr);
      } catch {}
    }

    const align = detectAlign(innerHtml, attrs);
    blocks.push({ type: mapBlockType(blockName), html: innerHtml, attrs, align });
    lastIndex = match.index + match[0].length;
  }

  const remaining = cleanHtml.slice(lastIndex).trim();
  if (remaining) blocks.push(...parseOrphanHtml(remaining));

  if (blocks.length === 0 && cleanHtml.trim()) return parseOrphanHtml(cleanHtml);

  return blocks.filter(b => b.html.trim() || b.type === 'separator' || b.type === 'spacer');
};

const mapBlockType = (blockName: string): ParsedBlock['type'] => {
  switch (blockName) {
    case 'paragraph': return 'paragraph';
    case 'heading': return 'heading';
    case 'image': return 'image';
    case 'gallery': return 'gallery';
    case 'video': return 'video';
    case 'embed':
    case 'core-embed/youtube':
    case 'core-embed/vimeo':
      return 'embed';
    case 'list': return 'list';
    case 'quote': return 'quote';
    case 'separator': return 'separator';
    case 'spacer': return 'spacer';
    default: return 'unknown';
  }
};

const parseOrphanHtml = (html: string): ParsedBlock[] => {
  const blocks: ParsedBlock[] = [];
  const parts = html.split(/(<(?:figure|p|h[1-6]|ul|ol|blockquote|hr|div|iframe)[^>]*>[\s\S]*?<\/(?:figure|p|h[1-6]|ul|ol|blockquote|div|iframe)>|<img[^>]*\/?>|<hr\s*\/?>)/gi);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const align = detectAlign(trimmed);

    if (/<figure/i.test(trimmed)) {
      if (/<img/i.test(trimmed)) {
        const imgCount = (trimmed.match(/<img/gi) || []).length;
        blocks.push({ type: imgCount > 1 ? 'gallery' : 'image', html: trimmed, align });
      } else if (/<iframe/i.test(trimmed) || /<video/i.test(trimmed)) {
        blocks.push({ type: 'embed', html: trimmed, align });
      }
    } else if (/^<img\b/i.test(trimmed)) {
      blocks.push({ type: 'image', html: `<figure>${trimmed}</figure>`, align });
    } else if (/<h[1-6]/i.test(trimmed)) {
      blocks.push({ type: 'heading', html: trimmed, align });
    } else if (/<p/i.test(trimmed)) {
      if (/<iframe/i.test(trimmed)) blocks.push({ type: 'embed', html: trimmed, align });
      else if (/<img/i.test(trimmed)) blocks.push({ type: 'image', html: trimmed, align });
      else blocks.push({ type: 'paragraph', html: trimmed, align });
    } else if (/<ul|<ol/i.test(trimmed)) {
      blocks.push({ type: 'list', html: trimmed, align });
    } else if (/<blockquote/i.test(trimmed)) {
      blocks.push({ type: 'quote', html: trimmed, align });
    } else if (/<hr/i.test(trimmed)) {
      blocks.push({ type: 'separator', html: trimmed });
    } else if (/<iframe/i.test(trimmed)) {
      blocks.push({ type: 'embed', html: trimmed, align });
    } else if (trimmed.replace(/<[^>]+>/g, '').trim()) {
      const cleanText = trimmed.replace(/<[^>]+>/g, '').trim();
      if (cleanText) {
        if (!/<p/i.test(trimmed)) {
          const paragraphs = trimmed.split(/\n\s*\n/).filter(p => p.trim());
          for (const p of paragraphs) {
            const pTrimmed = p.trim();
            if (pTrimmed) {
              blocks.push({ type: 'paragraph', html: `<p>${pTrimmed.replace(/\n/g, '<br>')}</p>`, align });
            }
          }
        } else {
          blocks.push({ type: 'paragraph', html: trimmed, align });
        }
      }
    }
  }

  return blocks;
};

// ============================================================
// Group consecutive image blocks into sliders
// ============================================================
const groupBlocksForRendering = (blocks: ParsedBlock[]): RenderGroup[] => {
  const groups: RenderGroup[] = [];
  let currentImageGroup: ParsedBlock[] = [];

  const flushImageGroup = () => {
    if (currentImageGroup.length > 0) {
      groups.push({ type: 'image-slider', blocks: [...currentImageGroup] });
      currentImageGroup = [];
    }
  };

  for (const block of blocks) {
    if (block.type === 'image') {
      if (block.align === 'left' || block.align === 'right') {
        flushImageGroup();
        groups.push({ type: 'single', blocks: [block] });
      } else {
        currentImageGroup.push(block);
      }
    } else if (block.type === 'gallery') {
      flushImageGroup();
      groups.push({ type: 'image-slider', blocks: [block] });
    } else {
      flushImageGroup();
      groups.push({ type: 'single', blocks: [block] });
    }
  }

  flushImageGroup();
  return groups;
};

// ============================================================
// Helper: Extract images from block(s)
// ============================================================
const stripWpResolutionSuffix = (url: string): string => {
  return url.replace(/-\d+x\d+\.(jpe?g|png|webp|gif|avif)$/i, '.$1');
};

const getBestImageUrl = (html: string): string | null => {
  const aHrefMatch = html.match(/<a[^>]+href="([^"]+\.(?:jpe?g|png|webp|gif|avif)(?:\?[^"]*)?)"/i);
  if (aHrefMatch) return aHrefMatch[1];

  const srcsetMatch = html.match(/srcset="([^"]+)"/i);
  if (srcsetMatch) {
    const entries = srcsetMatch[1].split(',').map(s => s.trim());
    let bestUrl = '';
    let bestW = 0;
    for (const entry of entries) {
      const parts = entry.split(/\s+/);
      if (parts.length >= 2) {
        const w = parseInt(parts[1]);
        if (!isNaN(w) && w > bestW) {
          bestW = w;
          bestUrl = parts[0];
        }
      }
    }
    if (bestUrl) return stripWpResolutionSuffix(bestUrl);
  }

  const dataFullMatch = html.match(/data-(?:full-url|orig-file)="([^"]+)"/i);
  if (dataFullMatch) return dataFullMatch[1];

  const srcMatch = html.match(/<img[^>]+src="([^"]+)"/i);
  return srcMatch ? stripWpResolutionSuffix(srcMatch[1]) : null;
};

const decodeHtmlEntities = (text: string): string => {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, '&');
};

const extractImagesFromBlocks = (blocks: ParsedBlock[]): { src: string; caption: string }[] => {
  const images: { src: string; caption: string }[] = [];

  for (const block of blocks) {
    if (block.type === 'gallery') {
      const figureRegex = /<figure[^>]*>([\s\S]*?)<\/figure>/gi;
      let m;
      while ((m = figureRegex.exec(block.html)) !== null) {
        const figureHtml = m[1];
        const src = getBestImageUrl(m[0]) || getBestImageUrl(figureHtml);
        const captionMatch = figureHtml.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/);
        if (src) {
          images.push({
            src,
            caption: captionMatch ? decodeHtmlEntities(captionMatch[1].replace(/<[^>]+>/g, '').trim()) : ''
          });
        }
      }
      if (images.length === 0) {
        const imgRegex = /<img[^>]+>/g;
        let im;
        while ((im = imgRegex.exec(block.html)) !== null) {
          const src = getBestImageUrl(im[0]);
          if (src) images.push({ src, caption: '' });
        }
      }
    } else if (block.type === 'image') {
      const src = getBestImageUrl(block.html);
      const captionMatch = block.html.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/);
      if (src) {
        images.push({
          src,
          caption: captionMatch ? decodeHtmlEntities(captionMatch[1].replace(/<[^>]+>/g, '').trim()) : ''
        });
      }
    }
  }

  return images;
};

// ============================================================
// Individual Block Renderers
// ============================================================

const ParagraphBlock = ({ html, lang, align }: { html: string; lang: string; align?: ParsedBlock['align'] }) => {
  const text = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  if (!text) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12">
      <div
        className={`${
          lang === 'jp'
            ? 'font-[var(--font-body-jp)]'
            : lang === 'en'
            ? 'font-[Space_Grotesk]'
            : 'font-[var(--font-body-ko)]'
        } text-foreground/80 text-sm md:text-base leading-[1.8] opacity-80 ${textAlignClass(align)} ${wpContentStyles}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

const HeadingBlock = ({ html, lang, align }: { html: string; lang: string; align?: ParsedBlock['align'] }) => (
  <div className="max-w-3xl mx-auto px-6 md:px-12">
    <div
      className={`${
        lang === 'jp'
          ? 'font-[var(--font-body-jp)]'
          : lang === 'en'
          ? 'font-[var(--font-display-latin)]'
          : 'font-[var(--font-body-ko)]'
      } text-foreground/90 [&_h1]:text-xl [&_h1]:md:text-2xl [&_h2]:text-lg [&_h2]:md:text-xl [&_h3]:text-base [&_h3]:md:text-lg ${textAlignClass(align)} ${wpContentStyles}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  </div>
);

// ============================================================
// Aligned Single Image
// ============================================================
const AlignedSingleImage = ({ block, lang }: { block: ParsedBlock; lang: string }) => {
  const images = extractImagesFromBlocks([block]);
  if (images.length === 0) return null;

  const { src, caption } = images[0];
  const parsedCaption = caption ? parseMultilingualCaption(caption, lang) : '';

  const positionClass = block.align === 'left' ? 'mr-auto' : 'ml-auto';

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12">
      <div className={`max-w-md min-[1025px]:max-w-lg ${positionClass}`}>
        <img
          src={src}
          alt={caption || 'Image'}
          className="w-full h-auto block"
          loading="lazy"
          draggable={false}
        />
        {parsedCaption && (
          <p className={`text-[10px] md:text-[11px] tracking-wide text-muted-foreground/50 font-sans mt-3 ${block.align === 'right' ? 'text-right' : 'text-left'}`}>
            {parsedCaption}
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Image Slider
// ============================================================
const ImageSliderBlock = ({ blocks, lang, compact }: { blocks: ParsedBlock[]; lang: string; compact?: boolean }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const images = extractImagesFromBlocks(blocks);

  useEffect(() => {
    const updateDeviceType = () => {
      setIsTouchDevice(window.innerWidth <= 1024);
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  const goToNext = () => setCurrentSlide((prev) => (prev + 1) % images.length);
  const goToPrev = () => setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length]);

  if (images.length === 0) return null;

  const currentCaption = images[currentSlide]?.caption || '';
  const parsedCaption = currentCaption ? parseMultilingualCaption(currentCaption, lang) : '';

  if (images.length === 1) {
    return (
      <div className={`${compact ? 'mb-8 md:mb-12' : 'mb-32 md:mb-48 min-[1025px]:mb-64'} -mx-6 md:-mx-12`}>
        <div className="w-full overflow-hidden">
          <div className="flex min-h-[240px] max-h-[70vh] items-center justify-center md:min-h-[320px] md:max-h-[85vh] min-[1025px]:max-h-[90vh]">
            <div className="flex items-center justify-center min-h-[240px] max-h-[520px] md:min-h-[320px] md:max-h-[620px] min-[1025px]:max-h-[90vh]">
  <img
    src={images[0].src}
    alt={images[0].caption || 'Image'}
    className="block w-full h-full object-contain"
    loading="lazy"
    draggable={false}
  />
</div>
          </div>
        </div>

        <div className="mt-5 h-6 flex items-center justify-center">
          {parsedCaption && (
            <p className="text-center text-[10px] md:text-[11px] tracking-wide text-muted-foreground/50 font-sans">
              {parsedCaption}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${compact ? 'mb-8 md:mb-12' : 'mb-32 md:mb-48 min-[1025px]:mb-64'} -mx-6 md:-mx-12`}>
      <div className="flex w-full flex-col items-center gap-5 md:gap-6">
        <div className="group relative w-full overflow-hidden">
          <div className="flex min-h-[240px] max-h-[70vh] items-center justify-center md:min-h-[320px] md:max-h-[85vh] min-[1025px]:max-h-[90vh]">
            <div
              className="hidden md:block absolute left-0 top-0 z-20 h-full w-1/2 cursor-pointer"
              onClick={goToPrev}
            />
            <div
              className="hidden md:block absolute right-0 top-0 z-20 h-full w-1/2 cursor-pointer"
              onClick={goToNext}
            />
            <div
              className="md:hidden absolute inset-0 z-20 cursor-pointer active:bg-black/5"
              onClick={goToNext}
            />

            {isTouchDevice ? (
              <motion.div
                key={currentSlide}
                className="w-full"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(e, { offset, velocity }) => {
                  if (Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 500) {
                    if (offset.x > 0) goToPrev();
                    else goToNext();
                  }
                }}
              >
                <img
                  src={images[currentSlide].src}
                  alt={`Gallery ${currentSlide + 1}`}
                  className="block max-h-[70vh] w-full object-contain pointer-events-none md:max-h-[85vh] min-[1025px]:max-h-[90vh]"
                  draggable={false}
                  loading="lazy"
                />
              </motion.div>
            ) : (
              <img
                src={images[currentSlide].src}
                alt={`Gallery ${currentSlide + 1}`}
                className="block max-h-[70vh] w-full object-contain pointer-events-none md:max-h-[85vh] min-[1025px]:max-h-[90vh]"
                draggable={false}
                loading="lazy"
              />
            )}
          </div>
        </div>

        <div className="h-6 flex items-center justify-center">
          {parsedCaption && (
            <p className="text-[10px] md:text-[11px] tracking-wide text-muted-foreground/50 font-sans">
              {parsedCaption}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-8 md:gap-10">
          <button
            type="button"
            className="relative z-10 flex min-h-[44px] min-w-[44px] items-center justify-center cursor-pointer text-foreground/50 transition-colors active:scale-95 hover:text-foreground min-[1025px]:min-h-0 min-[1025px]:min-w-0"
            aria-label="Previous"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToPrev();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="rotate-180 pointer-events-none min-[1025px]:h-5 min-[1025px]:w-5">
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="square" />
            </svg>
          </button>

          <span className="whitespace-nowrap text-[11px] tracking-[0.1em] text-foreground/50 min-[1025px]:font-['Ojuju'] min-[1025px]:text-[14px] font-mono">
            {String(currentSlide + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
          </span>

          <button
            type="button"
            className="relative z-10 flex min-h-[44px] min-w-[44px] items-center justify-center cursor-pointer text-foreground/50 transition-colors active:scale-95 hover:text-foreground min-[1025px]:min-h-0 min-[1025px]:min-w-0"
            aria-label="Next"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToNext();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="pointer-events-none min-[1025px]:h-5 min-[1025px]:w-5">
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="square" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Featured Film Label
// ============================================================
const FeaturedFilmLabel = () => (
  <div className="mt-4 flex items-center justify-between opacity-50">
    <span className="text-[14px] uppercase tracking-widest font-mono">Featured Film</span>
    <div className="h-px bg-current flex-grow ml-4"></div>
  </div>
);

// ============================================================
// Video/Embed
// ============================================================
const VideoEmbedRenderer = ({ src, isIframe = true, align }: { src: string; isIframe?: boolean; align?: ParsedBlock['align'] }) => {
  const alignWrapper = align === 'left'
    ? 'max-w-xl mr-auto'
    : align === 'right'
    ? 'max-w-xl ml-auto'
    : align === 'full'
    ? 'w-full'
    : 'max-w-4xl mx-auto';

  return (
    <div className="mb-40 md:mb-64 px-6 md:px-12">
      <div className={alignWrapper}>
        <div className="relative w-full aspect-video bg-black/5 overflow-hidden">
          {isIframe ? (
            <iframe
              src={src}
              title="Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <video src={src} controls className="absolute inset-0 w-full h-full object-contain" />
          )}
        </div>
        <FeaturedFilmLabel />
      </div>
    </div>
  );
};

const VideoBlock = ({ html, align }: { html: string; align?: ParsedBlock['align'] }) => {
  const iframeSrcMatch = html.match(/<iframe[^>]+src="([^"]+)"/);
  const videoSrcMatch = html.match(/<video[^>]+src="([^"]+)"/);
  const sourceSrcMatch = html.match(/<source[^>]+src="([^"]+)"/);

  const src = iframeSrcMatch?.[1] || videoSrcMatch?.[1] || sourceSrcMatch?.[1];
  if (!src) return null;

  return <VideoEmbedRenderer src={src} isIframe={!!iframeSrcMatch} align={align} />;
};

const EmbedBlock = ({ html, align }: { html: string; align?: ParsedBlock['align'] }) => {
  const iframeSrcMatch = html.match(/<iframe[^>]+src="([^"]+)"/);
  const urlMatch = html.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)([^\s<"]+)/);

  if (iframeSrcMatch) {
    return <VideoEmbedRenderer src={iframeSrcMatch[1]} align={align} />;
  }

  if (urlMatch) {
    const url = urlMatch[0];
    let embedUrl = url;

    if (url.includes('youtube') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('vimeo')) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`;
    }

    return <VideoEmbedRenderer src={embedUrl} align={align} />;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12">
      <div
        className="[&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:max-w-full"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

const ListBlock = ({ html, lang, align }: { html: string; lang: string; align?: ParsedBlock['align'] }) => (
  <div className="max-w-3xl mx-auto px-6 md:px-12">
    <div
      className={`${lang === 'jp' ? 'font-[Shippori_Mincho]' : 'font-serif'} text-foreground/80 text-sm md:text-base leading-[1.8] opacity-80 [&_li]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ${textAlignClass(align)} ${wpContentStyles}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  </div>
);

const QuoteBlock = ({ html, lang, align }: { html: string; lang: string; align?: ParsedBlock['align'] }) => (
  <div className="max-w-3xl mx-auto px-6 md:px-12">
    <blockquote
      className={`border-l-2 border-foreground/10 pl-6 ${lang === 'jp' ? 'font-[Shippori_Mincho]' : 'font-serif'} text-foreground/70 text-sm md:text-base leading-[1.8] italic ${textAlignClass(align)} ${wpContentStyles}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  </div>
);

const SeparatorBlock = () => (
  <div className="max-w-3xl mx-auto px-6 md:px-12">
    <hr className="border-t border-black/5 dark:border-white/10" />
  </div>
);

const SpacerBlock = () => <div className="h-8 md:h-12" />;

// ============================================================
// Main BlockRenderer Component
// ============================================================

interface BlockRendererProps {
  html: string;
  lang: string;
  mediaOnly?: boolean;
  imageOnly?: boolean;
  compact?: boolean;
}

const MEDIA_TYPES = new Set(['image', 'gallery', 'video', 'embed']);
const IMAGE_ONLY_TYPES = new Set(['image', 'gallery']);

export { parseBlocks, MEDIA_TYPES, groupBlocksForRendering };
export type { ParsedBlock, RenderGroup };

export const BlockRenderer = ({ html, lang, mediaOnly = false, imageOnly = false, compact = false }: BlockRendererProps) => {
  const rawBlocks = parseBlocks(html);
  if (rawBlocks.length === 0) return null;

  let blocks = filterBlocksByLanguage(rawBlocks, lang);

  if (mediaOnly) {
    const allowedTypes = imageOnly ? IMAGE_ONLY_TYPES : MEDIA_TYPES;
    blocks = blocks.filter(b => allowedTypes.has(b.type) || b.type === 'spacer' || b.type === 'separator');
  }

  if (blocks.length === 0) return null;

  const groups = groupBlocksForRendering(blocks);

  return (
    <div className="space-y-8 md:space-y-12 min-[1025px]:space-y-16">
      {groups.map((group, index) => {
        const key = `group-${index}`;

        if (group.type === 'image-slider') {
          return <ImageSliderBlock key={key} blocks={group.blocks} lang={lang} compact={compact} />;
        }

        const block = group.blocks[0];
        const blockKey = `block-${index}-${block.type}`;

        switch (block.type) {
          case 'paragraph':
            return <ParagraphBlock key={blockKey} html={block.html} lang={lang} align={block.align} />;
          case 'heading':
            return <HeadingBlock key={blockKey} html={block.html} lang={lang} align={block.align} />;
          case 'image':
            return <AlignedSingleImage key={blockKey} block={block} lang={lang} />;
          case 'video':
            return <VideoBlock key={blockKey} html={block.html} align={block.align} />;
          case 'embed':
            return <EmbedBlock key={blockKey} html={block.html} align={block.align} />;
          case 'list':
            return <ListBlock key={blockKey} html={block.html} lang={lang} align={block.align} />;
          case 'quote':
            return <QuoteBlock key={blockKey} html={block.html} lang={lang} align={block.align} />;
          case 'separator':
            return <SeparatorBlock key={blockKey} />;
          case 'spacer':
            return <SpacerBlock key={blockKey} />;
          case 'unknown':
            return (
              <div key={blockKey} className="max-w-3xl mx-auto px-6 md:px-12">
                <div
                  className={`text-foreground/80 text-sm md:text-base leading-[1.8] ${textAlignClass(block.align)} ${wpContentStyles}`}
                  dangerouslySetInnerHTML={{ __html: block.html }}
                />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};