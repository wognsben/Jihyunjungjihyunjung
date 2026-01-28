export interface RelatedArticle {
  id: string;
  title: string;
  author?: string;
  summary: string;
  thumbnail?: string;
  link?: string;
}

export interface Work {
  id: string;
  title_ko: string;
  title_en: string;
  title_jp: string;
  year?: number;
  yearCaption_ko?: string;
  yearCaption_en?: string;
  yearCaption_jp?: string;
  medium_ko?: string;
  medium_en?: string;
  medium_jp?: string;
  thumbnail: string;
  oneLineInfo_ko?: string;
  oneLineInfo_en?: string;
  oneLineInfo_jp?: string;
  description_ko?: string;
  description_en?: string;
  description_jp?: string;
  commission_ko?: string;
  commission_en?: string;
  commission_jp?: string;
  credits_ko?: string;
  credits_en?: string;
  credits_jp?: string;
  galleryImages: string[];
  youtubeUrl?: string; // YouTube video URL
  vimeoUrl?: string; // Vimeo video URL
  selected: boolean;
  order: number;
  relatedArticles?: RelatedArticle[];
}

/**
 * worksData는 WordPress API 연동 후 더 이상 사용되지 않습니다.
 * 모든 데이터는 WorkContext를 통해 WordPress에서 가져옵니다.
 * 이 배열은 fallback/타입 참조 목적으로만 유지됩니다.
 */
export const worksData: Work[] = [];

export const getSelectedWorks = (): Work[] => {
  const selected = worksData.filter(work => work.selected);
  if (selected.length >= 5) {
    return selected.slice(0, 5).sort((a, b) => a.order - b.order);
  }
  return worksData.slice(0, 5).sort((a, b) => a.order - b.order);
};

export const getAllWorks = (): Work[] => {
  return worksData.sort((a, b) => a.order - b.order);
};