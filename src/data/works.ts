export interface Work {
  id: string;
  title_ko: string;
  title_en: string;
  title_jp: string;
  year?: number;
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
  selected: boolean;
  order: number;
}

/**
 * High resolution image URLs from user's repository
 * UPDATED: Top 3 items using high-res scaled JPGs, 4th & 5th duplicated
 */
export const worksData: Work[] = [
  {
    id: "1",
    title_ko: "논픽션",
    title_en: "Nonfiction",
    title_jp: "ノンフィクション",
    year: 2024,
    medium_ko: "설치 미술",
    medium_en: "Installation Art",
    medium_jp: "インスタレーション",
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/78415c49/nonfiction-scaled.jpg",
    oneLineInfo_ko: "갤러리 설치 작업",
    oneLineInfo_en: "Gallery Installation",
    oneLineInfo_jp: "ギャラリーインスタレーション",
    description_ko: "상세 설명이 들어가는 공간입니다.",
    description_en: "Description placeholder.",
    description_jp: "詳細説明が入る場所です。",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/78415c49/nonfiction-scaled.jpg"
    ],
    selected: true,
    order: 1
  },
  {
    id: "2",
    title_ko: "목업 프로젝트",
    title_en: "025S Mockup",
    title_jp: "モックアップ",
    year: 2023,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/78415c49/025S_mockup-scaled.jpg",
    oneLineInfo_ko: "디자인 목업",
    oneLineInfo_en: "Design Mockup",
    oneLineInfo_jp: "デザインモックアップ",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/78415c49/025S_mockup-scaled.jpg"
    ],
    selected: true,
    order: 2
  },
  {
    id: "3",
    title_ko: "시간의 좌표",
    title_en: "Coordinates of Time",
    title_jp: "時間の座標",
    year: 2023,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/78415c49/025S-%EC%8B%9C%EA%B0%84%EC%9D%98%EC%A2%8C%ED%91%9C-%EB%B3%B5%EC%82%AC.jpg",
    oneLineInfo_ko: "사진 작업",
    oneLineInfo_en: "Photography Work",
    oneLineInfo_jp: "写真作業",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/78415c49/025S-%EC%8B%9C%EA%B0%84%EC%9D%98%EC%A2%8C%ED%91%9C-%EB%B3%B5%EC%82%AC.jpg"
    ],
    selected: true,
    order: 3
  },
  {
    id: "4",
    title_ko: "시간의 좌표 II",
    title_en: "Coordinates of Time II",
    title_jp: "時間の座標 II",
    year: 2023,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/78415c49/025S-%EC%8B%9C%EA%B0%84%EC%9D%98%EC%A2%8C%ED%91%9C-%EB%B3%B5%EC%82%AC.jpg",
    oneLineInfo_ko: "사진 작업",
    oneLineInfo_en: "Photography Work",
    oneLineInfo_jp: "写真作業",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/78415c49/025S-%EC%8B%9C%EA%B0%84%EC%9D%98%EC%A2%8C%ED%91%9C-%EB%B3%B5%EC%82%AC.jpg"
    ],
    selected: true,
    order: 4
  },
  {
    id: "5",
    title_ko: "시간의 좌표 III",
    title_en: "Coordinates of Time III",
    title_jp: "時間の座標 III",
    year: 2022,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/78415c49/025S-%EC%8B%9C%EA%B0%84%EC%9D%98%EC%A2%8C%ED%91%9C-%EB%B3%B5%EC%82%AC.jpg",
    oneLineInfo_ko: "사진 작업",
    oneLineInfo_en: "Photography Work",
    oneLineInfo_jp: "写真作業",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/78415c49/025S-%EC%8B%9C%EA%B0%84%EC%9D%98%EC%A2%8C%ED%91%9C-%EB%B3%B5%EC%82%AC.jpg"
    ],
    selected: true,
    order: 5
  },
  {
    id: "6",
    title_ko: "비주얼 프로젝트",
    title_en: "Visual Project",
    title_jp: "ビジュアルプロジェクト",
    year: 2021,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/6.jpg",
    oneLineInfo_ko: "디지털 아트",
    oneLineInfo_en: "Digital Art",
    oneLineInfo_jp: "デジタルアート",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/6.jpg"
    ],
    selected: false,
    order: 6
  },
  {
    id: "7",
    title_ko: "퍼포먼스 공간",
    title_en: "Performance Space",
    title_jp: "パフォーマンススペース",
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/7.jpg",
    oneLineInfo_ko: "무대 디자인",
    oneLineInfo_en: "Stage Design",
    oneLineInfo_jp: "舞台デザイン",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/7.jpg"
    ],
    selected: false,
    order: 7
  },
  {
    id: "8",
    title_ko: "건축 인테리어",
    title_en: "Architectural Interior",
    title_jp: "建築インテリア",
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/8.jpg",
    oneLineInfo_ko: "공간 디자인",
    oneLineInfo_en: "Space Design",
    oneLineInfo_jp: "空間デザイン",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/8.jpg"
    ],
    selected: false,
    order: 8
  },
  {
    id: "9",
    title_ko: "공간의 기록",
    title_en: "Space Archive",
    title_jp: "空間の記録",
    year: 2021,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/9.jpg",
    oneLineInfo_ko: "사진 아카이브",
    oneLineInfo_en: "Photo Archive",
    oneLineInfo_jp: "写真アーカイブ",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/9.jpg"
    ],
    selected: false,
    order: 9
  },
  {
    id: "10",
    title_ko: "빛과 그림자",
    title_en: "Light and Shadow",
    title_jp: "光と影",
    year: 2020,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/10.jpg",
    oneLineInfo_ko: "조명 설치",
    oneLineInfo_en: "Light Installation",
    oneLineInfo_jp: "照明インスタレーション",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/10.jpg"
    ],
    selected: false,
    order: 10
  },
  {
    id: "11",
    title_ko: "도시의 파편",
    title_en: "Urban Fragments",
    title_jp: "都市の破片",
    year: 2020,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/11.jpg",
    oneLineInfo_ko: "도시 재생 프로젝트",
    oneLineInfo_en: "Urban Regeneration Project",
    oneLineInfo_jp: "都市再生プロジェクト",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/11.jpg"
    ],
    selected: false,
    order: 11
  },
  {
    id: "12",
    title_ko: "자연의 형상",
    title_en: "Forms of Nature",
    title_jp: "自然の形",
    year: 2019,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/12.jpg",
    oneLineInfo_ko: "환경 조각",
    oneLineInfo_en: "Environmental Sculpture",
    oneLineInfo_jp: "環境彫刻",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/12.jpg"
    ],
    selected: false,
    order: 12
  },
  {
    id: "13",
    title_ko: "침묵의 소리",
    title_en: "Sound of Silence",
    title_jp: "沈黙の音",
    year: 2019,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/13.jpg",
    oneLineInfo_ko: "사운드 아트",
    oneLineInfo_en: "Sound Art",
    oneLineInfo_jp: "サウンドアート",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/13.jpg"
    ],
    selected: false,
    order: 13
  },
  {
    id: "14",
    title_ko: "디지털 풍경",
    title_en: "Digital Landscape",
    title_jp: "デジタル風景",
    year: 2018,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/14.jpg",
    oneLineInfo_ko: "미디어 파사드",
    oneLineInfo_en: "Media Facade",
    oneLineInfo_jp: "メディアファサード",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/14.jpg"
    ],
    selected: false,
    order: 14
  },
  {
    id: "15",
    title_ko: "기하학적 구조",
    title_en: "Geometric Structure",
    title_jp: "幾何学的構造",
    year: 2018,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/15.jpg",
    oneLineInfo_ko: "구조물 디자인",
    oneLineInfo_en: "Structure Design",
    oneLineInfo_jp: "構造物デザイン",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/15.jpg"
    ],
    selected: false,
    order: 15
  },
  {
    id: "16",
    title_ko: "시간의 흔적",
    title_en: "Traces of Time",
    title_jp: "時間の痕跡",
    year: 2017,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/16.jpg",
    oneLineInfo_ko: "설치 미술",
    oneLineInfo_en: "Installation Art",
    oneLineInfo_jp: "インスタレーションアート",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/16.jpg"
    ],
    selected: false,
    order: 16
  },
  {
    id: "17",
    title_ko: "무제의 공간",
    title_en: "Untitled Space",
    title_jp: "無題の空間",
    year: 2017,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/17.jpg",
    oneLineInfo_ko: "전시 기획",
    oneLineInfo_en: "Exhibition Planning",
    oneLineInfo_jp: "展示企画",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/17.jpg"
    ],
    selected: false,
    order: 17
  },
  {
    id: "18",
    title_ko: "경계의 모호함",
    title_en: "Ambiguity of Boundary",
    title_jp: "境界の曖昧さ",
    year: 2016,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/18.jpg",
    oneLineInfo_ko: "혼합 매체",
    oneLineInfo_en: "Mixed Media",
    oneLineInfo_jp: "ミクストメディア",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/18.jpg"
    ],
    selected: false,
    order: 18
  },
  {
    id: "19",
    title_ko: "반사",
    title_en: "Reflection",
    title_jp: "反射",
    year: 2016,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/19.jpg",
    oneLineInfo_ko: "거울 설치",
    oneLineInfo_en: "Mirror Installation",
    oneLineInfo_jp: "鏡インスタレーション",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/19.jpg"
    ],
    selected: false,
    order: 19
  },
  {
    id: "20",
    title_ko: "흐름",
    title_en: "Flow",
    title_jp: "流れ",
    year: 2015,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/20.jpg",
    oneLineInfo_ko: "키네틱 아트",
    oneLineInfo_en: "Kinetic Art",
    oneLineInfo_jp: "キネティックアート",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/20.jpg"
    ],
    selected: false,
    order: 20
  },
  {
    id: "21",
    title_ko: "조화",
    title_en: "Harmony",
    title_jp: "調和",
    year: 2015,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/21.jpg",
    oneLineInfo_ko: "공공 조형물",
    oneLineInfo_en: "Public Sculpture",
    oneLineInfo_jp: "公共造形物",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/21.jpg"
    ],
    selected: false,
    order: 21
  },
  {
    id: "22",
    title_ko: "질감 연구",
    title_en: "Texture Study",
    title_jp: "質感研究",
    year: 2014,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/22.jpg",
    oneLineInfo_ko: "재료 실험",
    oneLineInfo_en: "Material Experiment",
    oneLineInfo_jp: "材料実験",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/22.jpg"
    ],
    selected: false,
    order: 22
  },
  {
    id: "23",
    title_ko: "심연",
    title_en: "Abyss",
    title_jp: "深淵",
    year: 2014,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/23.jpg",
    oneLineInfo_ko: "영상 설치",
    oneLineInfo_en: "Video Installation",
    oneLineInfo_jp: "映像インスタレーション",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/23.jpg"
    ],
    selected: false,
    order: 23
  },
  {
    id: "24",
    title_ko: "여백",
    title_en: "Void",
    title_jp: "余白",
    year: 2013,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/24.jpg",
    oneLineInfo_ko: "미니멀리즘",
    oneLineInfo_en: "Minimalism",
    oneLineInfo_jp: "ミニマリズム",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/24.jpg"
    ],
    selected: false,
    order: 24
  },
  {
    id: "25",
    title_ko: "시작점",
    title_en: "Origin",
    title_jp: "始点",
    year: 2013,
    thumbnail: "https://raw.githubusercontent.com/wognsben/gallery/main/25.jpg",
    oneLineInfo_ko: "초기작",
    oneLineInfo_en: "Early Work",
    oneLineInfo_jp: "初期作",
    galleryImages: [
      "https://raw.githubusercontent.com/wognsben/gallery/main/25.jpg"
    ],
    selected: false,
    order: 25
  }
];

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
