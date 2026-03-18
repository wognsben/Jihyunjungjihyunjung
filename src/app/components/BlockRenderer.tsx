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
      // Extract <img> tag
      const imgMatch = inner.match(/<img[^>]+>/i);
      const imgTag = imgMatch ? imgMatch[0] : '';
      // Caption text is everything after the <img> tag (and optional </a>)
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
    // Vimeo
    const vimeoMatch = trimmedUrl.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return `<figure class="wp-block-embed"><div class="wp-block-embed__wrapper"><iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div></figure>`;
    }
    // YouTube
    const ytMatch = trimmedUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
    if (ytMatch) {
      return `<figure class="wp-block-embed"><div class="wp-block-embed__wrapper"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></figure>`;
    }
    // Generic iframe fallback
    return `<figure class="wp-block-embed"><div class="wp-block-embed__wrapper"><iframe src="${trimmedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe></div></figure>`;
  });

  // 1. &nbsp; 만 있는 빈 문단 제거: <p>&nbsp;</p>, <p> &nbsp; </p>
  cleaned = cleaned.replace(/<p[^>]*>\s*(&nbsp;\s*)+<\/p>/gi, '');

  // 2. <br>만 있는 빈 문단 제거: <p><br></p>, <p><br/></p>, <p><br /></p>
  cleaned = cleaned.replace(/<p[^>]*>\s*(<br\s*\/?\s*>\s*)+<\/p>/gi, '');

  // 3. 연속 <br> 3개 이상 → 2개로 축소 (의도적 1~2개는 유지)
  cleaned = cleaned.replace(/(<br\s*\/?\s*>\s*){3,}/gi, '<br><br>');

  // 4. 빈 문단 제거: <p></p>, <p>   </p>
  cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, '');

  return cleaned;
};

// ============================================================
// Detect alignment from WP block attrs + HTML classes
// 텍스트: has-text-align-*, attrs.textAlign
// 이미지/비디오: alignleft/right/center/wide/full, attrs.align
// ============================================================
const detectAlign = (html: string, attrs?: Record<string, any>): ParsedBlock['align'] => {
  const validAligns = ['left', 'center', 'right', 'wide', 'full'] as const;
  type AlignType = typeof validAligns[number];
  const isValid = (v: string): v is AlignType => validAligns.includes(v as AlignType);

  // 1. Block attrs: {"align":"left"} or {"textAlign":"center"}
  if (attrs?.align && isValid(attrs.align)) return attrs.align;
  if (attrs?.textAlign && isValid(attrs.textAlign)) return attrs.textAlign;

  // 2. WP text alignment class: has-text-align-left/center/right
  const textAlignMatch = html.match(/has-text-align-(left|center|right)/i);
  if (textAlignMatch) return textAlignMatch[1].toLowerCase() as AlignType;

  // 3. WP media alignment class: alignleft, alignright, aligncenter, alignwide, alignfull
  const mediaAlignMatch = html.match(/\balign(left|right|center|wide|full)\b/i);
  if (mediaAlignMatch) return mediaAlignMatch[1].toLowerCase() as AlignType;

  // 4. Inline style: text-align: left/center/right
  const styleMatch = html.match(/style="[^"]*text-align:\s*(left|center|right)/i);
  if (styleMatch) return styleMatch[1].toLowerCase() as AlignType;

  return undefined;
};

// Tailwind text-align class
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
// WP 본문에 [KO]...[EN]...[JP]... 마커가 있을 때 해당 언어만 추출
//
// 지원 패턴:
//   A) 인라인: <p>[KO]한국어[EN]English[JP]日本語</p>
//   B) 섹션:  [KO] → 여러 블록 → [EN] → 여러 블록 → [JP] → ...
//   C) 혼합:  이미지(공유) + 텍스트(마커 포함)
// ============================================================

const LANG_MARKERS = ['[KO]', '[EN]', '[JP]'] as const;
const hasLangMarkers = (text: string) => LANG_MARKERS.some(m => text.includes(m));

/** 인라인 마커 처리: HTML 내 [KO]...[EN]...[JP]... 에서 해당 언어 부분만 추출 */
const parseMultilingualHtml = (html: string, lang: string): string => {
  if (!hasLangMarkers(html)) return html;

  const langKey = `[${lang.toUpperCase()}]`;
  const allMarkers = LANG_MARKERS as readonly string[];

  // 해당 언어 마커의 시작 위치 찾기
  const startIdx = html.indexOf(langKey);
  if (startIdx === -1) {
    // Fallback: [KO]가 있으면 KO 내용 반환, 없으면 원본
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

  // 마커 앞의 공유 HTML(태그 등) 보존 + 해당 언어 내용
  const beforeMarkers = html.slice(0, html.indexOf(LANG_MARKERS[0]));
  return beforeMarkers + html.slice(contentStart, contentEnd);
};

/** 
 * 블록 배열에서 섹션 레벨 다국어 필터링
 * [KO], [EN], [JP]가 단독 블록으로 있으면 → 해당 섹션만 출
 * 이미지/갤러리/비디오 등 마커 없는 블록은 공유 콘텐츠로 유지
 */
const filterBlocksByLanguage = (blocks: ParsedBlock[], lang: string): ParsedBlock[] => {
  const textTypes = new Set(['paragraph', 'heading', 'list', 'quote', 'unknown']);

  // 섹션 레벨 마커가 있는지 확인: 블록 텍스트가 순수 [KO], [EN], [JP]인 경우
  const isStandaloneMarker = (b: ParsedBlock) => {
    const text = b.html.replace(/<[^>]+>/g, '').trim();
    return text === '[KO]' || text === '[EN]' || text === '[JP]';
  };
  const hasStandaloneMarkers = blocks.some(isStandaloneMarker);

  if (hasStandaloneMarkers) {
    // ── 패턴 B: 섹션 레벨 마커 ──
    const langKey = `[${lang.toUpperCase()}]`;
    let currentSection: string | null = null; // null = 공유 구간 (마커 전)
    const filtered: ParsedBlock[] = [];

    for (const block of blocks) {
      const text = block.html.replace(/<[^>]+>/g, '').trim();

      if (text === '[KO]' || text === '[EN]' || text === '[JP]') {
        currentSection = text;
        continue; // 마커 블록 자체는 렌더링하지 않음
      }

      if (currentSection === null) {
        // 마커 전: 공유 콘텐츠 (이미지 등)
        filtered.push(block);
      } else if (currentSection === langKey) {
        // 현재 언어 섹션
        filtered.push(block);
      } else if (!textTypes.has(block.type)) {
        // 다른 언어 섹션이지만 미디어 블록(이미지/갤러리/비디오)은 공유
        filtered.push(block);
      }
      // else: 다른 언어의 텍스트 블록 → 스킵
    }
    return filtered;
  }

  // ── 패턴 A: 인라인 마커 (또는 마커 없음) ──
  // 각 텍스트 블록에 인라인 [KO]...[EN]...[JP]... 가 있으면 해당 언어만 추출
  const anyBlockHasMarkers = blocks.some(b => textTypes.has(b.type) && hasLangMarkers(b.html));
  if (!anyBlockHasMarkers) return blocks; // 마커 전혀 없음 → 원본 그대로

  return blocks.map(b => {
    if (textTypes.has(b.type) && hasLangMarkers(b.html)) {
      const filtered = parseMultilingualHtml(b.html, lang);
      return { ...b, html: filtered };
    }
    return b;
  }).filter(b => {
    // 필터링 후 빈 텍스트 블록 제거
    if (textTypes.has(b.type)) {
      const text = b.html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      return text.length > 0;
    }
    return true;
  });
};

// ============================================================
// Shared inline link + nested list styles for dangerouslySetInnerHTML blocks
// - 링크: 절제된 갤러리 미학에 맞춘 subtle underline
// - 중첩 리스트: 2단계 들여쓰기
// ============================================================
const wpContentStyles = [
  // Links
  '[&_a]:underline [&_a]:decoration-foreground/20 [&_a]:underline-offset-[3px]',
  '[&_a]:transition-colors [&_a]:duration-300',
  '[&_a:hover]:decoration-foreground/50 [&_a:hover]:text-foreground',
  // Nested lists
  '[&_ul_ul]:mt-1 [&_ul_ul]:pl-4 [&_ol_ol]:mt-1 [&_ol_ol]:pl-4',
].join(' ');

// ============================================================
// Parse WordPress block comments
// ============================================================
const parseBlocks = (html: string): ParsedBlock[] => {
  if (!html || !html.trim()) return [];

  // Sanitize before parsing
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
      try { attrs = JSON.parse(attrsStr); } catch {}
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
  // img 태그도 독립적으로 캡처 (ACF WYSIWYG에서 <figure> 없이 <img> 직접 사용 가능)
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
      // Standalone <img> without <figure> wrapper (common in ACF WYSIWYG / TinyMCE)
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
      // Plain text or unrecognized HTML → wrap as paragraph
      const cleanText = trimmed.replace(/<[^>]+>/g, '').trim();
      if (cleanText) {
        // If no <p> tag, split by double newlines for multiple paragraphs
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
// 단, left/right 정렬된 단독 이미지는 슬라이더로 묶지 않음
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
      // left/right 정렬된 이미지는 슬라이더로 묶지 않고 단독 렌더링
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
          images.push({ src, caption: captionMatch ? decodeHtmlEntities(captionMatch[1].replace(/<[^>]+>/g, '').trim()) : '' });
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
  // &nbsp; 전용 추가 필터: sanitizeHtml을 통과한 후에도 남을 수 있는 엔티티
  const text = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  if (!text) return null;
  
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12">
      <div 
        className={`${lang === 'jp' ? 'font-[Shippori_Mincho]' : 'font-serif'} text-foreground/80 text-sm md:text-base leading-[1.8] opacity-80 ${textAlignClass(align)} ${wpContentStyles}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

const HeadingBlock = ({ html, align }: { html: string; align?: ParsedBlock['align'] }) => (
  <div className="max-w-3xl mx-auto px-6 md:px-12">
    <div 
      className={`font-serif text-foreground/90 [&_h1]:text-xl [&_h1]:md:text-2xl [&_h2]:text-lg [&_h2]:md:text-xl [&_h3]:text-base [&_h3]:md:text-lg ${textAlignClass(align)} ${wpContentStyles}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  </div>
);

// ============================================================
// Aligned Single Image: left/right 정렬된 단독 이미지
// WP에서 alignleft/alignright 설정 시 좁은 너비로 한쪽 배치
// ============================================================
const AlignedSingleImage = ({ block, lang }: { block: ParsedBlock; lang: string }) => {
  const images = extractImagesFromBlocks([block]);
  if (images.length === 0) return null;

  const { src, caption } = images[0];
  const parsedCaption = caption ? parseMultilingualCaption(caption, lang) : '';

  const positionClass = block.align === 'left'
    ? 'mr-auto'   // 왼쪽 정렬
    : 'ml-auto';  // 오른쪽 정렬

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12">
      <div className={`max-w-md min-[1025px]:max-w-lg ${positionClass}`}>
        <img
          src={src}
          alt={caption || 'Image'}
          className="w-full h-auto block"
          loading="lazy"
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
// Image Slider: center/wide/full 또는 정렬 없는 연속 이미지
// ============================================================
const ImageSliderBlock = ({ blocks, lang, compact }: { blocks: ParsedBlock[]; lang: string; compact?: boolean }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const images = extractImagesFromBlocks(blocks);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goToPrev(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goToNext(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, images.length]);

  if (images.length === 0) return null;

  const goToNext = () => setCurrentSlide((prev) => (prev + 1) % images.length);
  const goToPrev = () => setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);

  const currentCaption = images[currentSlide]?.caption || '';
  const parsedCaption = currentCaption ? parseMultilingualCaption(currentCaption, lang) : '';

  // Single image — no slider controls
  if (images.length === 1) {
    return (
      <div className={`${compact ? 'mb-8 md:mb-12' : 'mb-32 md:mb-48 min-[1025px]:mb-64'} -mx-6 md:-mx-12`}>
        <div className="max-h-[70svh] md:max-h-[85svh] min-[1025px]:max-h-[90svh] overflow-hidden w-full">
          <img 
            src={images[0].src} 
            alt={images[0].caption || 'Image'} 
            className="max-h-[70svh] md:max-h-[85svh] min-[1025px]:max-h-[90svh] w-full object-contain mx-auto block"
            loading="lazy"
          />
        </div>
        {parsedCaption && (
          <p className="text-center text-[10px] md:text-[11px] tracking-wide text-muted-foreground/50 font-sans mt-5">
            {parsedCaption}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`${compact ? 'mb-8 md:mb-12' : 'mb-32 md:mb-48 min-[1025px]:mb-64'} -mx-6 md:-mx-12`}>
      <div className="flex flex-col items-center gap-5 md:gap-6 w-full mx-auto">
        <div className="relative max-h-[70svh] md:max-h-[85svh] min-[1025px]:max-h-[90svh] overflow-hidden group w-full">
          <div className="hidden md:block absolute left-0 top-0 w-1/2 h-full z-20 cursor-pointer" onClick={goToPrev} />
          <div className="hidden md:block absolute right-0 top-0 w-1/2 h-full z-20 cursor-pointer" onClick={goToNext} />
          <div className="md:hidden absolute inset-0 z-20 cursor-pointer active:bg-black/5" onClick={goToNext} />
          
          <div className="hidden md:block absolute inset-0 z-10 pointer-events-none">
            <div className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-black/0 via-black/0 to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-black/0 via-black/0 to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
          </div>
          
          <AnimatePresence mode="wait">
            <motion.img
              key={currentSlide}
              src={images[currentSlide].src}
              alt={`Gallery ${currentSlide + 1}`}
              className="max-h-[70svh] md:max-h-[85svh] min-[1025px]:max-h-[90svh] w-full object-contain mx-auto block pointer-events-none"
              draggable={false}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (window.innerWidth < 768) {
                  if (Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 500) {
                    if (offset.x > 0) goToPrev();
                    else goToNext();
                  }
                }
              }}
            />
          </AnimatePresence>
        </div>

        <div className="h-6 flex items-center justify-center">
          {parsedCaption && (
            <motion.p
              key={`caption-${currentSlide}-${lang}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-[10px] md:text-[11px] tracking-wide text-muted-foreground/50 font-sans"
            >
              {parsedCaption}
            </motion.p>
          )}
        </div>

        <div className="flex items-center justify-center gap-8 md:gap-10">
          <button 
            type="button"
            className="relative z-10 cursor-pointer text-foreground/50 hover:text-foreground transition-colors active:scale-95 min-w-[44px] min-h-[44px] min-[1025px]:min-w-0 min-[1025px]:min-h-0 flex items-center justify-center"
            aria-label="Previous"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToPrev(); }}
          >
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="rotate-180 min-[1025px]:w-5 min-[1025px]:h-5 pointer-events-none">
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="square"/>
            </svg>
          </button>
          <span className="min-[1025px]:text-[14px] font-mono min-[1025px]:font-['Ojuju'] text-foreground/50 tracking-[0.1em] whitespace-nowrap text-[11px]">
            {String(currentSlide + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
          </span>
          <button 
            type="button"
            className="relative z-10 cursor-pointer text-foreground/50 hover:text-foreground transition-colors active:scale-95 min-w-[44px] min-h-[44px] min-[1025px]:min-w-0 min-[1025px]:min-h-0 flex items-center justify-center"
            aria-label="Next"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToNext(); }}
          >
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="min-[1025px]:w-5 min-[1025px]:h-5 pointer-events-none">
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="square"/>
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
// Video/Embed: 정렬 지원 + 반응형 iframe 래퍼
// ============================================================
const VideoEmbedRenderer = ({ src, isIframe = true, align }: { src: string; isIframe?: boolean; align?: ParsedBlock['align'] }) => {
  // 정렬에 따른 너비/위치 결정
  const alignWrapper = align === 'left'
    ? 'max-w-xl mr-auto'
    : align === 'right'
    ? 'max-w-xl ml-auto'
    : align === 'full'
    ? 'w-full'
    : 'max-w-4xl mx-auto';  // center, wide, default

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
  
  // Fallback: 비표준 embed도 반응형 래퍼로 감싸기
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
  /** true이면 이미지/갤러리/비디오/embed만 렌더링 (텍스트 블록 스킵) */
  mediaOnly?: boolean;
  /** mediaOnly와 함께 사용: true이면 이미지/갤러리만 (비디오/embed 제외) */
  imageOnly?: boolean;
  /** TEXT 상세페이지 등 컴팩트 레이아웃용 — 갤러리/이미지 마진 축소 */
  compact?: boolean;
}

// 미디어 블록 타입
const MEDIA_TYPES = new Set(['image', 'gallery', 'video', 'embed']);
const IMAGE_ONLY_TYPES = new Set(['image', 'gallery']);

// parseBlocks와 MEDIA_TYPES를 외부에서 사용할 수 있도록 export
export { parseBlocks, MEDIA_TYPES, groupBlocksForRendering };
export type { ParsedBlock, RenderGroup };

export const BlockRenderer = ({ html, lang, mediaOnly = false, imageOnly = false, compact = false }: BlockRendererProps) => {
  const rawBlocks = parseBlocks(html);
  if (rawBlocks.length === 0) return null;

  // 다국어 필터 적용: [KO][EN][JP] 마커에 따라 해당 언어 콘텐츠만 추출
  let blocks = filterBlocksByLanguage(rawBlocks, lang);

  // mediaOnly 모드: 텍스트 블록 제거, 미디어만 유지
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
            return <HeadingBlock key={blockKey} html={block.html} align={block.align} />;
          case 'image':
            // left/right 정렬된 단독 이미지 (슬라이더에서 분리됨)
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