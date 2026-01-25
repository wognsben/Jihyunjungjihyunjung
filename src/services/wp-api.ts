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

// Extract images from HTML content
const extractImagesFromContent = (html: string): string[] => {
  const regex = /<img[^>]+src="([^">]+)"/g;
  const images: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    images.push(match[1]);
  }
  return images;
};

// Transform WP Post to Application Work Interface
const transformWork = (post: WPPost, lang: string): Work => {
  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
  const contentImages = extractImagesFromContent(post.content.rendered);
  
  // Combine featured image + content images, removing duplicates
  const galleryImages = Array.from(new Set([featuredImage, ...contentImages].filter(Boolean)));

  // Try to find category for "Medium"
  let medium = 'Installation';
  const terms = post._embedded?.['wp:term'];
  if (terms) {
    for (const taxonomyTerms of terms) {
      if (taxonomyTerms.length > 0 && taxonomyTerms[0].taxonomy === 'work_category') {
        medium = taxonomyTerms.map(t => t.name).join(', ');
        break;
      }
    }
  }

  const title = decode(post.title.rendered);
  const description = post.content.rendered; 
  const descriptionText = description.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();

  const isSelected = false; 

  const work: Work = {
    id: String(post.id),
    
    title_ko: title,
    title_en: title,
    title_jp: title,

    year: new Date(post.date).getFullYear(),
    
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
    selected: isSelected,
    order: 0,
  };

  return work;
};

const transformText = (post: WPPost): TextItem => {
  const title = decode(post.title.rendered);
  const summary = decode(post.excerpt.rendered.replace(/<[^>]+>/g, '').trim());
  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
  
  // Determine category from taxonomy
  let category: Category = 'Article';
  const terms = post._embedded?.['wp:term'];
  if (terms) {
    for (const taxonomyTerms of terms) {
      if (taxonomyTerms.length > 0 && taxonomyTerms[0].taxonomy === 'text_category') {
        // Map WP category to TextItem Category ('Article' | 'Note' | 'Review')
        const catName = taxonomyTerms[0].name;
        if (['Article', 'Note', 'Review'].includes(catName)) {
          category = catName as Category;
        }
        break;
      }
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
    }
  };
};

export const fetchWorks = async (lang: string = 'ko'): Promise<Work[]> => {
  try {
    const response = await api.get('/work', {
      params: {
        lang,
        _embed: 1,
        per_page: 100,
      },
    });

    return response.data.map((post:WPPost, index: number) => ({
      ...transformWork(post, lang),
      order: index + 1
    }));
  } catch (error) {
    console.error(`Error fetching works for lang ${lang}:`, error);
    return [];
  }
};

export const fetchTexts = async (lang: string = 'ko'): Promise<TextItem[]> => {
  try {
    const response = await api.get('/text', {
      params: {
        lang,
        _embed: 1,
        per_page: 100,
      },
    });

    return response.data.map(transformText);
  } catch (error) {
    console.error(`Error fetching texts for lang ${lang}:`, error);
    return [];
  }
};
