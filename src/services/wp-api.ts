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
  content: string; // HTML
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
  let featuredImage = getFullSizeUrl(rawFeaturedImage);
  const contentImages = extractImagesFromContent(post.content.rendered);
  
  // Fallback: If no featured image, use first content image as thumbnail
  if (!featuredImage && contentImages.length > 0) {
    featuredImage = contentImages[0];
  }
  
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
    relatedArticles,
    selected: isSelected,
    order: 0,
  };

  return work;
};

const transformText = (post: WPPost): TextItem => {
  const title = decode(post.title.rendered);
  const summary = decode(post.excerpt.rendered.replace(/<[^>]+>/g, '').trim());
  const featuredImage = getFullSizeUrl(post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '');
  
  const contentHtml = post.content.rendered || '';
  const contentText = decode(contentHtml.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim());
  
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
      let workMedium = 'Installation';

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
    },
    relatedWorks
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
    
    return {
      title: decode(page.title.rendered),
      name: acf.name || '', // Fetch ACF 'name' field
      content: page.content.rendered,
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

  } catch (error) {
    console.error('Error fetching history items:', error);
    return [];
  }
};
