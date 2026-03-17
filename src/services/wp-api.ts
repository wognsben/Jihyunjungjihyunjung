import axios from 'axios';
import he from 'he';
import { Work } from '@/data/works';
import { TextItem, Category } from '@/data/texts';
import { WPPost } from '@/types/wordpress';

const API_BASE_URL = 'https://wognsben97.mycafe24.com/wp-json/wp/v2';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interfaces
export interface AboutData {
  title: string;
  name?: string; // Add name field from ACF
  content: string; // HTML (Korean - default)
  content_en?: string; // Assembled from ACF EN fields
  content_jp?: string; // Assembled from ACF JP fields
  image: string;
  profile_info?: string;
  profile_info2?: string; // Add profile_info2 field
  contact: {
    email: string;
    instagram: string;
    website: string;
  };
}

export interface HistoryItem {
  id: string;
  title: string;
  year: string;
  content: string;
  linkedWork: {
    id: string;
    title: string;
    thumbnail: string;
    slug: string;
  } | null;
}

// Helper to decode HTML entities in titles (e.g. "Dn&#038;D" -> "DnD")
const decode = (str: string) => he.decode(str || '');

// Map of broken URLs to Unsplash replacements (Fixing "Failed to fetch" errors)
const BROKEN_IMAGE_REPLACEMENTS: Record<string, string> = {
  // Existing replacements
  'kaeru_09.jpg': 'https://images.unsplash.com/photo-1768783848291-8dd873a22369?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGNvbnRlbXBvcmFyeSUyMGFydCUyMGluc3RhbGxhdGlvbiUyMG1pbmltYWx8ZW58MXx8fHwxNzY5NzYwOTE2fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'Right-1.jpg': 'https://images.unsplash.com/photo-1569264090102-cb8c5c31d083?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGFuZCUyMHdoaXRlJTIwYWJzdHJhY3QlMjB0ZXh0dXJlJTIwYXJ0fGVufDF8fHx8MTc2OTc2MDkyM3ww&ixlib=rb-4.1.0&q=80&w=1080',
  '1Y2A7405.jpg': 'https://images.unsplash.com/photo-1762928289094-197055a5d5c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBnYWxsZXJ5JTIwc3BhY2UlMjB3aGl0ZXxlbnwxfHx8fDE3Njk3NjA5MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'Square-2.jpg': 'https://images.unsplash.com/photo-1764197943854-13f02f484fe1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG1ldGFsJTIwc2N1bHB0dXJlJTIwZGV0YWlsfGVufDF8fHx8MTc2OTc2MDkzMHww&ixlib=rb-4.1.0&q=80&w=1080',
  
  // Hangdog Series (Sculptures)
  'Hangdog-1.jpg': 'https://images.unsplash.com/photo-1662661600800-0b7220bab431?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG9yZ2FuaWMlMjBzY3VscHR1cmUlMjBjbGF5JTIwbWluaW1hbHxlbnwxfHx8fDE3Njk3NjIwNjN8MA&ixlib=rb-4.1.0&q=80&w=1080', // Organic clay
  'Hangdog-2.jpg': 'https://images.unsplash.com/photo-1759150467057-f09fc8ee0f10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHN0b25lJTIwc2N1bHB0dXJlJTIwbWluaW1hbGlzdHxlbnwxfHx8fDE3Njk3NjIwNjd8MA&ixlib=rb-4.1.0&q=80&w=1080', // Stone abstract
  'Hangdog-3.jpg': 'https://images.unsplash.com/photo-1763578997952-31105b309a9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG1ldGFsJTIwZm9ybSUyMHNjdWxwdHVyZXxlbnwxfHx8fDE3Njk3NjIwODF8MA&ixlib=rb-4.1.0&q=80&w=1080', // Metal form
  'Hangdog-4.jpg': 'https://images.unsplash.com/photo-1662661600800-0b7220bab431?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG9yZ2FuaWMlMjBzY3VscHR1cmUlMjBjbGF5JTIwbWluaW1hbHxlbnwxfHx8fDE3Njk3NjIwNjN8MA&ixlib=rb-4.1.0&q=80&w=1080', // Reuse clay
  'Hangdog-5.jpg': 'https://images.unsplash.com/photo-1759150467057-f09fc8ee0f10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHN0b25lJTIwc2N1bHB0dXJlJTIwbWluaW1hbGlzdHxlbnwxfHx8fDE3Njk3NjIwNjd8MA&ixlib=rb-4.1.0&q=80&w=1080', // Reuse stone
  'Hangdog-6.jpg': 'https://images.unsplash.com/photo-1763578997952-31105b309a9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG1ldGFsJTIwZm9ybSUyMHNjdWxwdHVyZXxlbnwxfHx8fDE3Njk3NjIwODF8MA&ixlib=rb-4.1.0&q=80&w=1080', // Reuse metal
  'Hangdog-8.jpg': 'https://images.unsplash.com/photo-1769325318810-2d2c73188119?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZXJhbWljJTIwYXJ0JTIwZGV0YWlsJTIwbWFjcm98ZW58MXx8fHwxNzY5NzYyMDg3fDA&ixlib=rb-4.1.0&q=80&w=1080', // Ceramic detail

  // Other Works
  'Swept-9.jpg': 'https://images.unsplash.com/photo-1614062387997-8dd3b011bdf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHdoaXRlJTIwdGV4dHVyZSUyMGFydCUyMGRldGFpbHxlbnwxfHx8fDE3Njk3NjIwNzR8MA&ixlib=rb-4.1.0&q=80&w=1080', // White texture
  'Flower-Handed-3.jpg': 'https://images.unsplash.com/photo-1758432299946-327963c5bea2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb250ZW1wb3JhcnklMjBhcnQlMjBpbnN0YWxsYXRpb24lMjBkZXRhaWwlMjBmYWJyaWN8ZW58MXx8fHwxNzY5NzYyMDcwfDA&ixlib=rb-4.1.0&q=80&w=1080', // Fabric detail
  'Caught-Sleeve-7.jpg': 'https://images.unsplash.com/photo-1758432299946-327963c5bea2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb250ZW1wb3JhcnklMjBhcnQlMjBpbnN0YWxsYXRpb24lMjBkZXRhaWwlMjBmYWJyaWN8ZW58MXx8fHwxNzY5NzYyMDcwfDA&ixlib=rb-4.1.0&q=80&w=1080', // Reuse fabric detail
  '1Y2A7358_01.jpg': 'https://images.unsplash.com/photo-1767706508416-414285b8bead?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwZ2FsbGVyeSUyMGV4aGliaXRpb24lMjBzcGFjZXxlbnwxfHx8fDE3Njk3NjIwNzd8MA&ixlib=rb-4.1.0&q=80&w=1080', // Gallery space
};

// Helper to get full size URL by removing WP resolution suffix (e.g. -150x150)
const getFullSizeUrl = (url: string): string => {
  if (!url) return '';
  
  // Check for broken URLs and replace them
  for (const [key, replacement] of Object.entries(BROKEN_IMAGE_REPLACEMENTS)) {
    if (url.includes(key)) {
      return replacement;
    }
  }

  // Clean up WP resolution suffix
  return url.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, '$1');
};

// Extract images from HTML content
const extractImagesFromContent = (html: string): string[] => {
  const regex = /<img[^>]+src="([^\">]+)"/g;
  const images: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    images.push(getFullSizeUrl(match[1])); // Always try to get full size
  }
  return images;
};

// Extract images and captions together (maintains proper matching)
const extractImagesAndCaptions = (html: string): { url: string; caption: string }[] => {
  const results: { url: string; caption: string }[] = [];
  const processedUrls = new Set<string>();
  
  // 1. Block Editor: <figure><img><figcaption>Caption</figcaption></figure>
  const figureRegex = /<figure[^>]*>\s*(?:<a[^>]*>)?\s*<img[^>]+src="([^"]+)"[^>]*>\s*(?:<\/a>)?\s*(?:<figcaption[^>]*>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/gi;
  let match;
  
  while ((match = figureRegex.exec(html)) !== null) {
    const rawUrl = match[1];
    const url = getFullSizeUrl(rawUrl);
    const caption = match[2] ? match[2].replace(/<[^>]+>/g, '').trim() : '';
    
    results.push({ url, caption });
    processedUrls.add(rawUrl);
    processedUrls.add(url);
  }
  
  // 2. Classic Editor: [caption]<img src="..."> Caption text[/caption]
  const captionShortcodeRegex = /\[caption[^\]]*\][\s\S]*?<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?([\s\S]*?)\[\/caption\]/gi;
  
  while ((match = captionShortcodeRegex.exec(html)) !== null) {
    const rawUrl = match[1];
    const url = getFullSizeUrl(rawUrl);
    
    if (!processedUrls.has(rawUrl) && !processedUrls.has(url)) {
      const caption = match[2].replace(/<[^>]+>/g, '').trim();
      results.push({ url, caption });
      processedUrls.add(rawUrl);
      processedUrls.add(url);
    }
  }
  
  // 3. Standalone <img> tags (no caption wrapper)
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const rawUrl = match[1];
    const url = getFullSizeUrl(rawUrl);
    
    if (!processedUrls.has(rawUrl) && !processedUrls.has(url)) {
      results.push({ url, caption: '' });
      processedUrls.add(rawUrl);
      processedUrls.add(url);
    }
  }
  
  return results;
};

// Parse multilingual caption format: [KO]한글[EN]English[JP]日本語
export const parseMultilingualCaption = (caption: string, lang: string): string => {
  if (!caption) return '';
  
  // If no language tags, return as-is
  if (!caption.includes('[KO]') && !caption.includes('[EN]') && !caption.includes('[JP]')) {
    return caption;
  }
  
  // Extract content for specific language
  const patterns: Record<string, RegExp> = {
    ko: /\[KO\](.*?)(?:\[EN\]|\[JP\]|$)/s,
    en: /\[EN\](.*?)(?:\[KO\]|\[JP\]|$)/s,
    jp: /\[JP\](.*?)(?:\[KO\]|\[EN\]|$)/s,
  };
  
  const pattern = patterns[lang.toLowerCase()];
  if (!pattern) return caption;
  
  const match = caption.match(pattern);
  return match ? match[1].trim() : '';
};

// Remove caption shortcodes from content (for clean description text)
const removecaptionShortcodes = (html: string): string => {
  let cleaned = html;
  // Remove [caption]...[/caption] shortcodes
  cleaned = cleaned.replace(/\[caption[^\]]*\].*?\[\/caption\]/gs, '');
  // Remove <figure>...</figure> blocks (WordPress Block Editor gallery items with figcaptions)
  cleaned = cleaned.replace(/<figure[^>]*>.*?<\/figure>/gs, '');
  // Remove standalone <figcaption>...</figcaption> tags and their content
  cleaned = cleaned.replace(/<figcaption[^>]*>.*?<\/figcaption>/gs, '');
  return cleaned;
};

// Remove leftover multilingual caption patterns and standalone caption text from plain text descriptions
const removeMultilingualCaptionPatterns = (text: string): string => {
  if (!text) return '';
  let cleaned = text;
  // Remove lines that contain [KO]...[EN]...[JP]... multilingual patterns
  cleaned = cleaned.replace(/^.*\[KO\].*\[EN\].*\[JP\].*$/gm, '');
  // Remove lines that are ONLY [KO] or [EN] or [JP] tags with content between them
  cleaned = cleaned.replace(/^\s*\[(?:KO|EN|JP)\]\s*.*$/gm, (match) => {
    // Only remove if it looks like a caption line (contains at least 2 language tags)
    const tagCount = (match.match(/\[(?:KO|EN|JP)\]/g) || []).length;
    return tagCount >= 2 ? '' : match;
  });
  // Clean up excessive blank lines left behind
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
};

// Extract image captions from WordPress content
// Looks for figcaption, wp-caption-text, or data-caption attributes
const extractImageCaptions = (html: string): string[] => {
  const captions: string[] = [];
  
  // First, try to extract from HTML5 figure/figcaption (WordPress Gallery Block)
  const figureRegex = /<figure[^>]*>.*?<img[^>]+>.*?(?:<figcaption[^>]*>(.*?)<\/figcaption>)?.*?<\/figure>/gs;
  let figureMatch;
  
  while ((figureMatch = figureRegex.exec(html)) !== null) {
    const caption = figureMatch[1] ? decode(figureMatch[1].replace(/<[^>]+>/g, '').trim()) : '';
    captions.push(caption);
  }
  
  // If no figures found, try WordPress caption shortcode: [caption]...[/caption]
  if (captions.length === 0) {
    const captionShortcodeRegex = /\[caption[^\]]*\](.*?)\[\/caption\]/gs;
    let captionMatch;
    
    while ((captionMatch = captionShortcodeRegex.exec(html)) !== null) {
      const captionContent = captionMatch[1];
      // Extract text after the img tag (the caption text)
      const textMatch = captionContent.match(/<\/a>(.+?)$|<img[^>]+>(.+?)$/s);
      if (textMatch) {
        const caption = (textMatch[1] || textMatch[2] || '').replace(/<[^>]+>/g, '').trim();
        captions.push(decode(caption));
      } else {
        captions.push(''); // No caption for this image
      }
    }
  }
  
  return captions;
};

// Extract YouTube URL from content (iframe or link)
const extractYouTubeUrl = (html: string): string | undefined => {
  // Match YouTube iframe embed
  const iframeRegex = /<iframe[^>]+src="([^"]*youtube\.com\/embed\/[^"]+)"/i;
  const iframeMatch = html.match(iframeRegex);
  if (iframeMatch) return iframeMatch[1];

  // Match YouTube direct links
  const linkRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const linkMatch = html.match(linkRegex);
  if (linkMatch) return `https://www.youtube.com/embed/${linkMatch[1]}`;

  return undefined;
};

// Extract Vimeo URL from content (iframe or link)
const extractVimeoUrl = (html: string): string | undefined => {
  // Match Vimeo iframe embed
  const iframeRegex = /<iframe[^>]+src="([^"]*vimeo\.com\/video\/[^"]+)"/i;
  const iframeMatch = html.match(iframeRegex);
  if (iframeMatch) return iframeMatch[1];

  // Match Vimeo direct links
  const linkRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/i;
  const linkMatch = html.match(linkRegex);
  if (linkMatch) return `https://player.vimeo.com/video/${linkMatch[1]}`;

  return undefined;
};

// Transform WP Post to Application Work Interface
const transformWork = (post: WPPost, lang: string): Work => {
  const rawFeaturedImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
  let featuredImage = getFullSizeUrl(rawFeaturedImage);
  
  // ACF fields for multilingual support
  const acf = post.acf || {};
  
  // 🖼️ ACF Gallery Field - Primary source for images and captions
  let galleryImages: string[] = [];
  let imageCredits: string[] = [];
  
  // Check for ACF gallery field (field name: gallery_images or similar)
  const acfGallery = acf.gallery_images || acf.gallery || acf['갤러리_이미지'];
  
  // 🔍 DEBUG: Log gallery data
  console.log('🖼️ [transformWork Debug] Post ID:', post.id, 'Title:', decode(post.title.rendered));
  console.log('🖼️ [transformWork Debug] ACF Gallery Field:', acfGallery);
  console.log('🖼️ [transformWork Debug] Gallery is array?', Array.isArray(acfGallery));
  if (acfGallery && Array.isArray(acfGallery)) {
    console.log('🖼️ [transformWork Debug] Gallery length:', acfGallery.length);
    console.log('🖼️ [transformWork Debug] First image object:', acfGallery[0]);
  }
  
  if (acfGallery && Array.isArray(acfGallery) && acfGallery.length > 0) {
    // ACF Gallery exists - use it as primary source
    acfGallery.forEach((imageObj: any, index: number) => {
      if (imageObj) {
        // Handle both Image Object and Image Array return formats
        const imageUrl = typeof imageObj === 'string' 
          ? imageObj 
          : (imageObj.url || imageObj.sizes?.large || imageObj.sizes?.full || '');
        
        const caption = typeof imageObj === 'object' ? (imageObj.caption || '') : '';
        
        console.log(`🖼️ [transformWork Debug] Image ${index}:`, { imageUrl, caption });
        
        if (imageUrl) {
          galleryImages.push(getFullSizeUrl(imageUrl));
          imageCredits.push(caption ? decode(caption) : '');
        }
      }
    });
    
    console.log('🖼️ [transformWork Debug] Final galleryImages:', galleryImages.length);
    console.log('🖼️ [transformWork Debug] Final imageCredits:', imageCredits);
  } else {
    console.log('🖼️ [transformWork Debug] No ACF gallery - using fallback content extraction');
    // Fallback: Extract images and captions together from content
    const imagesAndCaptions = extractImagesAndCaptions(post.content.rendered);
    
    // Separate into arrays
    galleryImages = imagesAndCaptions.map(item => item.url);
    const rawCaptions = imagesAndCaptions.map(item => item.caption);
    
    // Store raw captions (multilingual parsing happens at render time)
    imageCredits = rawCaptions;
    
    // Fallback: If no featured image, use first content image as thumbnail
    if (!featuredImage && galleryImages.length > 0) {
      featuredImage = galleryImages[0];
    }
    
    console.log('🖼️ [transformWork Debug] Extracted from content:', galleryImages.length, 'images');
    console.log('🖼️ [transformWork Debug] Raw captions:', rawCaptions);
    console.log('🖼️ [transformWork Debug] Parsed captions (lang=' + lang + '):', imageCredits);
  }

  // Try to find "Year" from work_category taxonomy
  let yearFromCategory: number | undefined;
  
  const terms = post._embedded?.['wp:term'];
  if (terms) {
    for (const taxonomyTerms of terms) {
      if (taxonomyTerms.length > 0 && taxonomyTerms[0].taxonomy === 'work_category') {
        taxonomyTerms.forEach(t => {
          const name = t.name;
          if (/^\d{4}/.test(name)) {
            const match = name.match(/^(\d{4})/);
            if (match) {
              yearFromCategory = parseInt(match[1], 10);
            }
          }
        });
        break;
      }
    }
  }

  // KO: WordPress default fields (title, content, excerpt)
  const title_ko = decode(post.title.rendered);
  const description_raw = post.content.rendered;
  // Remove [caption] shortcodes from description to keep it clean
  const description_cleaned = removecaptionShortcodes(description_raw);
  const description_ko = removeMultilingualCaptionPatterns(
    stripHtmlToText(description_cleaned)
  );
  const oneLineInfo_ko = decode(post.excerpt.rendered.replace(/<[^>]+>/g, '').trim());

  // EN: ACF fields, fallback to KO
  const title_en = acf['제목_en'] ? decode(acf['제목_en']) : title_ko;
  const description_en_raw = acf['작품_설명_en'] || description_cleaned;
  const description_en = removeMultilingualCaptionPatterns(
    stripHtmlToText(removecaptionShortcodes(description_en_raw))
  );
  // ACF 원본 HTML 보존 (본문+영상 순서 그대로, BlockRenderer용)
  const content_en = acf['작품_설명_en'] ? acf['작품_설명_en'] : undefined;
  const oneLineInfo_en = acf.one_line_info_en ? decode(acf.one_line_info_en) : oneLineInfo_ko;

  // JP: ACF fields, fallback to KO
  const title_jp = acf['제목_jp'] ? decode(acf['제목_jp']) : title_ko;
  const description_jp_raw = acf['작품_설명_jp'] || description_cleaned;
  const description_jp = removeMultilingualCaptionPatterns(
    stripHtmlToText(removecaptionShortcodes(description_jp_raw))
  );
  // ACF 원본 HTML 보존
  const content_jp = acf['작품_설명_jp'] ? acf['작품_설명_jp'] : undefined;
  const oneLineInfo_jp = acf.one_line_info_jp ? decode(acf.one_line_info_jp) : oneLineInfo_ko;

  // Year Caption: ACF multilingual
  const yearCaption_ko = acf.year_caption_ko || acf.year_caption || '';
  const yearCaption_en = acf.year_caption_en || yearCaption_ko;
  const yearCaption_jp = acf.year_caption_jp || yearCaption_ko;

  // Commission: ACF multilingual
  const commission_ko = acf.commission_ko || acf.commission || '';
  const commission_en = acf.commission_en || commission_ko;
  const commission_jp = acf.commission_jp || commission_ko;

  // Credits: ACF multilingual
  const credits_ko = acf.credits_ko || acf.credits || '';
  const credits_en = acf.credits_en || credits_ko;
  const credits_jp = acf.credits_jp || credits_ko;

  // Additional text: ACF multilingual (artist notes, supplementary text)
  const additional_ko = acf.work_additional_ko || '';
  const additional_en = acf.work_additional_en || additional_ko;
  const additional_jp = acf.work_additional_jp || additional_ko;

  // Medium: ACF field (작품_medium), same across all languages
  const medium = acf['작품_medium'] || '';
  const medium_ko = medium;
  const medium_en = medium;
  const medium_jp = medium;

  // Category: ACF select field (카테고리) — "Works", "Projects", "Exhibitions"
  const rawCategory = acf['카테고리'] || '';
  const workCategory = typeof rawCategory === 'string' 
    ? rawCategory 
    : Array.isArray(rawCategory) 
      ? rawCategory.join(', ') 
      : (rawCategory?.label || String(rawCategory));

  // EN/JP specific image overrides (ACF fields: EN_image, JP_image)
  // Most works share the same images across languages,
  // but a few have language-specific images set in these fields.
  const enImageRaw = acf.EN_image || acf.en_image || acf['EN_image'];
  const jpImageRaw = acf.JP_image || acf.jp_image || acf['JP_image'];
  
  const thumbnail_en = enImageRaw
    ? getFullSizeUrl(typeof enImageRaw === 'string' ? enImageRaw : (enImageRaw.url || enImageRaw.sizes?.large || enImageRaw.sizes?.full || ''))
    : undefined;
  
  const thumbnail_jp = jpImageRaw
    ? getFullSizeUrl(typeof jpImageRaw === 'string' ? jpImageRaw : (jpImageRaw.url || jpImageRaw.sizes?.large || jpImageRaw.sizes?.full || ''))
    : undefined;

  // Extract YouTube URL from ACF, meta, or content
  let youtubeUrl: string | undefined;
  if (post.acf?.youtube_url) {
    youtubeUrl = post.acf.youtube_url;
  } else if (post.meta?.youtube_url) {
    youtubeUrl = post.meta.youtube_url;
  } else {
    youtubeUrl = extractYouTubeUrl(post.content.rendered);
  }

  // Extract Vimeo URL from ACF, meta, or content
  let vimeoUrl: string | undefined;
  if (post.acf?.vimeo_url) {
    vimeoUrl = post.acf.vimeo_url;
  } else if (post.meta?.vimeo_url) {
    vimeoUrl = post.meta.vimeo_url;
  } else {
    vimeoUrl = extractVimeoUrl(post.content.rendered);
  }

  // Transform ACF related_texts to RelatedArticle[]
  let relatedArticles: Work['relatedArticles'] = undefined;
  if (post.acf?.related_texts && Array.isArray(post.acf.related_texts) && post.acf.related_texts.length > 0) {
    relatedArticles = post.acf.related_texts.map((item: any) => {
      if (typeof item === 'number') {
        const embeddedPosts = post._embedded?.['acf:post'];
        if (embeddedPosts && Array.isArray(embeddedPosts)) {
          const textPost = embeddedPosts.find((p: any) => p.id === item);
          if (textPost) {
            return {
              id: String(textPost.id),
              title: textPost.title?.rendered ? decode(textPost.title.rendered) : 'Untitled',
              author: 'Ji Hyun Jung',
              summary: textPost.excerpt?.rendered ? decode(textPost.excerpt.rendered.replace(/<[^>]+>/g, '').trim()) : '',
              thumbnail: textPost._embedded?.['wp:featuredmedia']?.[0]?.source_url 
                ? getFullSizeUrl(textPost._embedded['wp:featuredmedia'][0].source_url) 
                : '',
              link: textPost.link || '',
            };
          }
        }
        return {
          id: String(item),
          title: '', 
          author: 'Ji Hyun Jung',
          summary: '',
          thumbnail: '',
          link: '',
        };
      } else {
        const textTitle = item.title?.rendered 
          ? decode(item.title.rendered) 
          : (item.post_title || item.title || 'Untitled');
        
        const textSummary = item.excerpt?.rendered 
          ? decode(item.excerpt.rendered.replace(/<[^>]+>/g, '').trim())
          : (item.post_excerpt || '');
        
        const textThumbnail = item._embedded?.['wp:featuredmedia']?.[0]?.source_url
          ? getFullSizeUrl(item._embedded['wp:featuredmedia'][0].source_url)
          : '';
        
        const textId = item.ID || item.id || '';
        const textLink = item.guid?.rendered || item.link || item.url || '';
        
        return {
          id: String(textId),
          title: textTitle,
          author: 'Ji Hyun Jung',
          summary: textSummary,
          thumbnail: textThumbnail,
          link: textLink,
        };
      }
    }).filter(article => article && article.id);
  }

  const isSelected = false; 

  const work: Work = {
    id: String(post.id),
    
    title_ko,
    title_en,
    title_jp,

    year: yearFromCategory || new Date(post.date).getFullYear(),
    
    yearCaption_ko: yearCaption_ko || undefined,
    yearCaption_en: yearCaption_en || undefined,
    yearCaption_jp: yearCaption_jp || undefined,

    medium_ko,
    medium_en,
    medium_jp,

    thumbnail: featuredImage,
    thumbnail_en: thumbnail_en || undefined,
    thumbnail_jp: thumbnail_jp || undefined,
    
    oneLineInfo_ko,
    oneLineInfo_en,
    oneLineInfo_jp,

    description_ko,
    description_en,
    description_jp,

    commission_ko: commission_ko || undefined,
    commission_en: commission_en || undefined,
    commission_jp: commission_jp || undefined,

    credits_ko: credits_ko || undefined,
    credits_en: credits_en || undefined,
    credits_jp: credits_jp || undefined,

    additional_ko: additional_ko || undefined,
    additional_en: additional_en || undefined,
    additional_jp: additional_jp || undefined,

    galleryImages: galleryImages.length > 0 ? galleryImages : [featuredImage],
    imageCredits: imageCredits.length > 0 ? imageCredits : undefined,
    category: workCategory || undefined,
    youtubeUrl,
    vimeoUrl,
    content_rendered: post.content.rendered || undefined,
    content_en: content_en || undefined,
    content_jp: content_jp || undefined,
    relatedArticles,
    selected: isSelected,
    order: 0,
  };

  return work;
};

const transformText = (post: WPPost): TextItem => {
  const title_ko = decode(post.title.rendered);
  const summary_ko = decode(post.excerpt.rendered.replace(/<[^>]+>/g, '').trim());
  const featuredImage = getFullSizeUrl(post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '');
  
  const contentHtml = post.content.rendered || '';
  const content_ko = decode(contentHtml.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim());

  // ACF multilingual fields
  const acf = post.acf || {};
  
  // 🔍 DEBUG: Log ACF data to console
  console.log('🔍 [transformText Debug] Post ID:', post.id);
  console.log('🔍 [transformText Debug] ACF Keys:', Object.keys(acf));
  console.log('🔍 [transformText Debug] ACF EN fields:', {
    'text_제목en': acf['text_제목en'],
    'text_제목_en': acf['text_제목_en'],
    'TEXT_작품_설명en': acf['TEXT_작품_설명en'],
    'TEXT_작품_설명_en': acf['TEXT_작품_설명_en'],
    'content_en': acf.content_en,
    'summary_en': acf.summary_en
  });
  console.log('🔍 [transformText Debug] ACF JP fields:', {
    'text_제목jp': acf['text_제목jp'],
    'text_제목_jp': acf['text_제목_jp'],
    'TEXT_작품_설명jp': acf['TEXT_작품_설명jp'],
    'TEXT_작품_설명_jp': acf['TEXT_작품_설명_jp'],
    'content_jp': acf.content_jp,
    'summary_jp': acf.summary_jp
  });
  
  // EN: ACF fields - Try new naming pattern first (TEXT_작품_설명en without underscore before language)
  const title_en = acf['text_제목en'] ? decode(acf['text_제목en'])
    : acf['text_제목_en'] ? decode(acf['text_제목_en']) 
    : acf.title_en ? decode(acf.title_en) 
    : title_ko;
  // Try new pattern first: TEXT_작품_설명en (no underscore before 'en')
  const content_en_raw = acf['TEXT_작품_설명en'] || acf['TEXT_작품_설명_en'] || acf['text_작품_설명_en'] || acf.content_en || '';
  const summary_en = acf.summary_en ? decode(acf.summary_en) : summary_ko;
  const content_en = content_en_raw 
    ? decode(content_en_raw.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim()) 
    : content_ko;

  // JP: ACF fields - Try new naming pattern first (TEXT_작품_설명jp without underscore before language)
  const title_jp = acf['text_제목jp'] ? decode(acf['text_제목jp'])
    : acf['text_제목_jp'] ? decode(acf['text_제목_jp']) 
    : acf.title_jp ? decode(acf.title_jp) 
    : title_ko;
  // Try new pattern first: TEXT_작품_설명jp (no underscore before 'jp')
  const content_jp_raw = acf['TEXT_작품_설명jp'] || acf['text_작품_설명_jp'] || acf['TEXT_작품_설명_jp'] || acf.content_jp || '';
  const summary_jp = acf.summary_jp ? decode(acf.summary_jp) : summary_ko;
  const content_jp = content_jp_raw 
    ? decode(content_jp_raw.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim()) 
    : content_ko;
  
  // 🔍 DEBUG: Log final values
  console.log('🔍 [transformText Debug] Final values:', {
    title_en,
    title_jp,
    content_en: content_en.substring(0, 100) + '...',
    content_jp: content_jp.substring(0, 100) + '...'
  });
  
  // Transform ACF related_works
  let relatedWorks: TextItem['relatedWorks'] = undefined;
  // Check both related_works and related_projects just in case
  const sourceRelated = post.acf?.related_works || post.acf?.related_projects;

  if (sourceRelated && Array.isArray(sourceRelated) && sourceRelated.length > 0) {
    relatedWorks = sourceRelated.map((item: any) => {
      let workObj: any = null;
      
      if (typeof item === 'number') {
        // Robust search: Look for the ID in ANY embedded collection
        if (post._embedded) {
            for (const key in post._embedded) {
                if (Array.isArray(post._embedded[key])) {
                    const found = post._embedded[key].find((p: any) => p.id === item);
                    if (found) {
                        workObj = found;
                        break;
                    }
                }
            }
        }
      } else {
        workObj = item;
      }

      if (!workObj) return null;

      // Extract details
      const workId = String(workObj.ID || workObj.id);
      const workTitle = workObj.title?.rendered ? decode(workObj.title.rendered) : (workObj.post_title || '');
      
      // Thumbnail
      const workThumbnail = workObj._embedded?.['wp:featuredmedia']?.[0]?.source_url 
          ? getFullSizeUrl(workObj._embedded['wp:featuredmedia'][0].source_url)
          : (workObj.featured_media_src_url || ''); 

      // Year & Medium (Try to find in terms)
      let workYear = String(new Date(workObj.date).getFullYear());
      let workMedium = '';

      // Try standard term embedding
      const terms = workObj._embedded?.['wp:term'];
      // Or sometimes terms are direct properties in limited objects
      const directTerms = workObj.work_category; // If ACF returns simplified object with terms as IDs or list

      if (terms) {
         for (const taxonomyTerms of terms) {
            if (taxonomyTerms.length > 0 && taxonomyTerms[0].taxonomy === 'work_category') {
               const mediumTerms: string[] = [];
               const yearTerms: string[] = [];
               taxonomyTerms.forEach((t: any) => {
                   if (/^\d{4}/.test(t.name)) yearTerms.push(t.name);
                   else mediumTerms.push(t.name);
               });
               
               if (yearTerms.length > 0) {
                   const match = yearTerms[0].match(/^(\d{4})/);
                   if (match) workYear = match[1];
               }
               if (mediumTerms.length > 0) workMedium = mediumTerms.join(', ');
               break;
            }
         }
      }

      return {
        id: workId,
        title: workTitle,
        thumbnail: workThumbnail,
        year: workYear,
        medium: workMedium
      };
    }).filter((w: any) => w !== null) as TextItem['relatedWorks'];
  }

  let category: Category = 'Article';
  const terms = post._embedded?.['wp:term'];
  
  if (terms) {
    for (const taxonomyTerms of terms) {
      if (taxonomyTerms.length > 0 && taxonomyTerms[0].taxonomy === 'text_category') {
        for (const term of taxonomyTerms) {
          const name = (term.name || '').toLowerCase();
          const slug = (term.slug || '').toLowerCase();

          if (name.includes('review') || name.includes('리뷰') || slug.includes('review')) {
            category = 'Review';
            break; 
          }
          else if (name.includes('note') || name.includes('노트') || slug.includes('note')) {
            category = 'Note';
            break;
          }
          else if (name.includes('article') || name.includes('아티클') || slug.includes('article')) {
            category = 'Article';
            break;
          }
        }
      }
      if (category !== 'Article') break;
    }
  }

  return {
    id: String(post.id),
    year: String(new Date(post.date).getFullYear()),
    category,
    author: {
      en: 'Ji Hyun Jung',
      ko: '정지현',
      jp: 'Ji Hyun Jung'
    },
    title: {
      en: title_en,
      ko: title_ko,
      jp: title_jp
    },
    link: post.link,
    image: featuredImage,
    summary: {
      en: summary_en,
      ko: summary_ko,
      jp: summary_jp
    },
    content: {
      en: content_en,
      ko: content_ko,
      jp: content_jp
    },
    relatedWorks,
    hasEn: !!(acf['text_제목en'] || acf['text_제목_en'] || acf.title_en),
    hasJp: !!(acf['text_제목jp'] || acf['text_제목_jp'] || acf.title_jp),
  };
};

const transformHistoryItem = (post: WPPost): HistoryItem => {
  const title = decode(post.title.rendered);
  // Try to extract year from title (e.g. "2023 Exhibition Name")
  const yearMatch = title.match(/^(\d{4})/);
  const year = yearMatch ? yearMatch[1] : new Date(post.date).getFullYear().toString();
  
  const content = post.content.rendered;

  // Handle Linked Work (ACF)
  let linkedWork: HistoryItem['linkedWork'] = null;
  const linkedWorkField = post.acf?.linked_work;

  if (linkedWorkField) {
     if (typeof linkedWorkField === 'object' && linkedWorkField !== null) {
        linkedWork = {
           id: String(linkedWorkField.ID || linkedWorkField.id),
           title: linkedWorkField.post_title || linkedWorkField.title?.rendered || '',
           thumbnail: '',
           slug: linkedWorkField.post_name || linkedWorkField.slug || ''
        };
     } 
     else if (typeof linkedWorkField === 'number' || typeof linkedWorkField === 'string') {
        linkedWork = {
           id: String(linkedWorkField),
           title: 'View Work', 
           thumbnail: '',
           slug: ''
        };
     }
  }

  return {
    id: String(post.id),
    title,
    year,
    content,
    linkedWork
  };
};

export const fetchWorks = async (lang: string = 'ko'): Promise<Work[]> => {
  try {
    const response = await api.get('/work', {
      params: {
        _embed: 1,
        per_page: 100,
      },
    });

    return response.data.map((post:WPPost, index: number) => ({
      ...transformWork(post, lang),
      order: index + 1
    }));
  } catch (error) {
    console.error(`Error fetching works:`, error);
    return [];
  }
};

export const fetchTexts = async (lang: string = 'ko'): Promise<TextItem[]> => {
  try {
    const response = await api.get('/text', {
      params: {
        _embed: 1,
        per_page: 100,
      },
    });

    return response.data.map(transformText);
  } catch (error) {
    console.error(`Error fetching texts:`, error);
    return [];
  }
};

export const fetchTextById = async (id: string): Promise<TextItem | null> => {
  try {
    const response = await api.get(`/text/${id}`, {
      params: {
        _embed: 1,
      },
    });
    return transformText(response.data);
  } catch (error) {
    console.error(`Error fetching text by id ${id}:`, error);
    return null;
  }
};

export const fetchAboutPage = async (): Promise<AboutData | null> => {
  try {
    const response = await api.get('/pages', {
      params: {
        slug: 'about',
        _embed: 1,
      },
    });

    if (response.data.length === 0) return null;

    const page = response.data[0];
    const featuredImage = page._embedded?.['wp:featuredmedia']?.[0]?.source_url 
      ? getFullSizeUrl(page._embedded['wp:featuredmedia'][0].source_url)
      : '';

    const acf = page.acf || {};
    const contactGroup = acf.contact_info || {};
    
    // EN content: Try single WYSIWYG field first (about_en), fallback to section-based approach
    let content_en: string | undefined;
    if (acf['about_en']) {
      content_en = acf['about_en'];
    } else {
      // Legacy: Assemble EN content from individual ACF section fields
      const enSections = [
        { header: 'Education', content: acf['about_en_약력'] },
        { header: 'Solo Exhibitions', content: acf['about_en_개인전'] },
        { header: 'Group Exhibitions', content: acf['about_en_단체전'] },
        { header: 'Awards & Residencies', content: acf['about_en_수상경력_및_레지던스'] },
        { header: 'Projects', content: acf['about_en_프로젝트'] },
        { header: 'Publications', content: acf['about_en_출판'] },
      ];
      const hasEnContent = enSections.some(s => s.content);
      content_en = hasEnContent
        ? enSections
            .filter(s => s.content)
            .map(s => `<h2>${s.header}</h2>\n<p>${s.content}</p>`)
            .join('\n')
        : undefined;
    }

    // JP content: Try single WYSIWYG field first (About_jp), fallback to section-based approach
    let content_jp: string | undefined;
    if (acf['About_jp']) {
      content_jp = acf['About_jp'];
    } else {
      // Legacy: Assemble JP content from individual ACF section fields
      const jpSections = [
        { header: '학력', content: acf['about_jp_약력'] },
        { header: '개전', content: acf['about_jp_개인전'] },
        { header: '그룹전', content: acf['about_jp_단체전'] },
        { header: '수상이력・레지던스', content: acf['about_jp_수상경력_및_레지던스'] },
        { header: '프로젝트', content: acf['about_jp_프로젝트'] },
        { header: '출판', content: acf['about_jp_출력'] },
      ];
      const hasJpContent = jpSections.some(s => s.content);
      content_jp = hasJpContent
        ? jpSections
            .filter(s => s.content)
            .map(s => `<h2>${s.header}</h2>\n<p>${s.content}</p>`)
            .join('\n')
        : undefined;
    }

    return {
      title: decode(page.title.rendered),
      name: acf.name || '', // Fetch ACF 'name' field
      content: page.content.rendered,
      content_en,
      content_jp,
      image: featuredImage,
      // Check profile_info, fallback to profile_text group if nested
      profile_info: acf.profile_info || acf.profile_text?.profile_info || '',
      profile_info2: acf.profile_info2 || '', // Explicitly fetch profile_info2
      contact: {
        email: acf.email || contactGroup.email || '',
        instagram: acf.instagram || contactGroup.instagram || '',
        website: acf.website || contactGroup.website || '',
      }
    };
  } catch (error) {
    console.error('Error fetching About page:', error);
    return null;
  }
};

export const fetchHistoryItems = async (): Promise<HistoryItem[]> => {
  try {
    // Try both plural and singular slug just in case, but start with history_item
    // Note: If you registered CPT as 'history_item', endpoint is /history_item
    const response = await api.get('/history_item', {
      params: {
        per_page: 100,
        _embed: 1,
      },
    });

    const items = response.data.map(transformHistoryItem);
    
    // Sort items by year descending
    // If multiple items have same year, keep original order (or sort by ID/Date)
    return items.sort((a: HistoryItem, b: HistoryItem) => {
       const yearA = parseInt(a.year) || 0;
       const yearB = parseInt(b.year) || 0;
       if (yearA !== yearB) return yearB - yearA;
       return 0;
    });

  } catch (error: any) {
    // Suppress 404 errors as they likely mean the CPT is not set up yet
    if (error.response && error.response.status === 404) {
        // Silently return empty array - History CPT is optional
        return [];
    }
    console.error('Error fetching history items:', error);
    return [];
  }
};

// Helper to convert WordPress HTML to paragraph-separated text
// Preserves inline formatting (strong, b, em, i, u, a) for dangerouslySetInnerHTML rendering
// Block-level boundaries become \n\n separators for paragraph splitting
const stripHtmlToText = (html: string): string => {
  let text = html;
  // Block-level closing tags → double newline (paragraph boundary)
  text = text.replace(/<\/(?:p|div|blockquote|h[1-6]|li|figcaption|section|article)>/gi, '\n\n');
  // <br> tags → single newline  
  text = text.replace(/<br\s*\/?>/gi, '\n');
  // Remove block-level opening tags (but keep inline tags intact)
  text = text.replace(/<(?:p|div|blockquote|h[1-6]|li|figcaption|section|article|ul|ol|figure|img|iframe|video|source)(?:\s[^>]*)?\/?>/gi, '');
  // Remove remaining closing tags for block elements we haven't handled
  text = text.replace(/<\/(?:ul|ol|figure|iframe|video|source)>/gi, '');
  // Keep inline formatting tags: <strong>, <b>, <em>, <i>, <u>, <mark>, <a>, <span>, <sup>, <sub>
  // Strip any other unrecognized tags
  text = text.replace(/<(?!\/?(?:strong|b|em|i|u|mark|a|span|sup|sub)\b)[^>]+>/gi, '');
  // Collapse 3+ newlines into double newline
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
};