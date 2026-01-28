import axios from 'axios';
import he from 'he';
import { Work } from '@/data/works';
import { TextItem, Category } from '@/data/texts';
import { WPPost } from '@/types/wordpress';

const API_BASE_URL = 'https://wognsben97.mycafe24.com/wp-json/wp/v2';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Helper to decode HTML entities in titles (e.g. "Dn&#038;D" -> "DnD")
const decode = (str: string) => he.decode(str || '');

// Helper to get full size URL by removing WP resolution suffix (e.g. -150x150)
const getFullSizeUrl = (url: string): string => {
  if (!url) return '';
  // Matches -150x150.jpg, -300x200.png, -1024x768.webp etc. at the end of filename
  return url.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, '$1');
};

// Extract images from HTML content
const extractImagesFromContent = (html: string): string[] => {
  const regex = /<img[^>]+src="([^">]+)"/g;
  const images: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    images.push(getFullSizeUrl(match[1])); // Always try to get full size
  }
  return images;
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
  const featuredImage = getFullSizeUrl(rawFeaturedImage);
  const contentImages = extractImagesFromContent(post.content.rendered);
  
  // Combine featured image + content images, removing duplicates
  const galleryImages = Array.from(new Set([featuredImage, ...contentImages].filter(Boolean)));

  // Try to find category for "Medium" and "Year"
  let medium = 'Installation';
  let yearFromCategory: number | undefined;
  
  const terms = post._embedded?.['wp:term'];
  if (terms) {
    for (const taxonomyTerms of terms) {
      if (taxonomyTerms.length > 0 && taxonomyTerms[0].taxonomy === 'work_category') {
        const mediumTerms: string[] = [];
        const yearTerms: string[] = [];

        taxonomyTerms.forEach(t => {
          const name = t.name;
          // Check if it looks like a year (e.g. "2023", "2024")
          // Also handles ranges like "2023-2024" by taking the first 4 digits
          if (/^\d{4}/.test(name)) {
             yearTerms.push(name);
          } else {
             mediumTerms.push(name);
          }
        });

        // If we found year-like categories, use the first one
        if (yearTerms.length > 0) {
          // Parse the first 4 digits as the year number
          const match = yearTerms[0].match(/^(\d{4})/);
          if (match) {
            yearFromCategory = parseInt(match[1], 10);
          }
        }
        
        // Join the rest as medium
        if (mediumTerms.length > 0) {
          medium = mediumTerms.join(', ');
        }
        break;
      }
    }
  }

  const title = decode(post.title.rendered);
  const description = post.content.rendered; 
  const descriptionText = description.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();

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
    // ACF Relationship field returns array of IDs when "Post ID" return format is selected
    // OR array of post objects when "Post Object" return format is selected
    relatedArticles = post.acf.related_texts.map((item: any) => {
      // Check if it's a number (ID) or object (full post)
      if (typeof item === 'number') {
        // It's just an ID - check if we have embedded data
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
        // If no embedded data found, return minimal info with ID
        // The frontend can match this with texts data
        return {
          id: String(item),
          title: '', // Will be filled from texts context
          author: 'Ji Hyun Jung',
          summary: '',
          thumbnail: '',
          link: '',
        };
      } else {
        // It's a full post object
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
    }).filter(article => article && article.id); // Remove any invalid entries
  }

  const isSelected = false; 

  const work: Work = {
    id: String(post.id),
    
    title_ko: title,
    title_en: title,
    title_jp: title,

    year: yearFromCategory || new Date(post.date).getFullYear(),
    
    medium_ko: medium,
    medium_en: medium,
    medium_jp: medium,

    thumbnail: featuredImage,
    
    oneLineInfo_ko: decode(post.excerpt.rendered.replace(/<[^>]+>/g, '').trim()),
    oneLineInfo_en: decode(post.excerpt.rendered.replace(/<[^>]+>/g, '').trim()),
    oneLineInfo_jp: decode(post.excerpt.rendered.replace(/<[^>]+>/g, '').trim()),

    description_ko: descriptionText,
    description_en: descriptionText,
    description_jp: descriptionText,

    galleryImages: galleryImages.length > 0 ? galleryImages : [featuredImage],
    youtubeUrl,
    vimeoUrl,
    relatedArticles, // Add related texts from ACF
    selected: isSelected,
    order: 0,
  };

  return work;
};

const transformText = (post: WPPost): TextItem => {
  const title = decode(post.title.rendered);
  const summary = decode(post.excerpt.rendered.replace(/<[^>]+>/g, '').trim());
  const featuredImage = getFullSizeUrl(post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '');
  
  // Extract full content and clean HTML
  const contentHtml = post.content.rendered || '';
  const contentText = decode(contentHtml.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim());
  
  // Determine category from taxonomy
  let category: Category = 'Article';
  const terms = post._embedded?.['wp:term'];
  
  if (terms) {
    // Flatten all terms from all taxonomies to find 'text_category'
    // terms is an array of arrays (one per taxonomy)
    for (const taxonomyTerms of terms) {
      // Check if this group of terms belongs to 'text_category'
      if (taxonomyTerms.length > 0 && taxonomyTerms[0].taxonomy === 'text_category') {
        // Iterate through all terms assigned to this post in this taxonomy
        for (const term of taxonomyTerms) {
          const name = (term.name || '').toLowerCase();
          const slug = (term.slug || '').toLowerCase();

          // Check for 'Review' (English or Korean '리뷰')
          if (name.includes('review') || name.includes('리뷰') || slug.includes('review')) {
            category = 'Review';
            break; 
          }
          // Check for 'Note' (English or Korean '노트')
          else if (name.includes('note') || name.includes('노트') || slug.includes('note')) {
            category = 'Note';
            break;
          }
          // Check for 'Article' (English or Korean '아티클', '에세이')
          else if (name.includes('article') || name.includes('아티클') || slug.includes('article')) {
            category = 'Article';
            break;
          }
        }
      }
      // If we found a non-default category, we can stop searching
      if (category !== 'Article') break;
    }
  }

  return {
    id: String(post.id),
    year: String(new Date(post.date).getFullYear()),
    category,
    author: {
      en: 'Ji Hyun Jung', // Default or parse from content/ACF
      ko: '정지현',
      jp: 'Ji Hyun Jung'
    },
    title: {
      en: title,
      ko: title,
      jp: title
    },
    link: post.link,
    image: featuredImage,
    summary: {
      en: summary,
      ko: summary,
      jp: summary
    },
    content: {
      en: contentText,
      ko: contentText,
      jp: contentText
    }
  };
};

export const fetchWorks = async (lang: string = 'ko'): Promise<Work[]> => {
  try {
    // Always fetch Korean data only (no lang parameter needed after Polylang removal)
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
    // Always fetch Korean data only (no lang parameter needed after Polylang removal)
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