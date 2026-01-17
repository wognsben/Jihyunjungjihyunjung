import { useRef, useEffect, useState, useMemo } from 'react';
import { Footer } from '@/app/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import gsap from 'gsap';

// ----------------------------------------------------------------------
// Types & Data
// ----------------------------------------------------------------------

interface SectionData {
  title: {
    en: string;
    ko: string;
    jp: string;
  };
  items: Array<{
    year: string;
    description: {
      en: string;
      ko: string;
      jp: string;
    };
    sub?: string;
  }>;
}

const cvData: SectionData[] = [
  {
    title: {
        en: 'EDUCATION',
        ko: '학력',
        jp: '学歴'
    },
    items: [
      { 
        year: '2014', 
        description: { 
          en: 'M.F.A. in Plastic Arts, Korea National University of Arts', 
          ko: '한국예술종합학교 미술원 조형예술 전문사 졸업', 
          jp: '韓国芸術総合学校 美術院 造形芸術 専門士 卒業' 
        } 
      },
      { 
        year: '2010', 
        description: { 
          en: 'B.F.A. in Plastic Arts, Korea National University of Arts', 
          ko: '한국예술종합학교 미술원 조형예술 예술사 졸업', 
          jp: '韓国芸術総合学校 美術院 造形芸術 芸術士 卒業' 
        } 
      },
    ]
  },
  {
    title: {
        en: 'SOLO EXHIBITIONS',
        ko: '개인전',
        jp: '個展'
    },
    items: [
      { 
        year: '2023', 
        description: { 
          en: 'Hangdog, Art Sonje Center, Seoul', 
          ko: '행도그, 아트선재센터, 서울', 
          jp: 'ハングドッグ、アートソンジェセンター、ソウル' 
        } 
      },
      { 
        year: '2022', 
        description: { 
          en: 'Gouge, Incheon Art Platform, Incheon', 
          ko: '가우지, 인천아트플랫폼, 인천', 
          jp: 'ガウジ、仁川アートプラットフォーム、仁川' 
        } 
      },
      { 
        year: '2019', 
        description: { 
          en: 'Multipurpose Henry, Atelier Hermès, Seoul', 
          ko: '다목적 헨리, 아뜰리에 에르메스, 서울', 
          jp: '多目的ヘンリー、アトリエ・エルメス、ソウル' 
        } 
      },
      { 
        year: '2016', 
        description: { 
          en: 'Gomyeomseom, Doosan Gallery, Seoul', 
          ko: '곰염섬, 두산갤러리, 서울', 
          jp: 'ゴムヨムソム、斗山ギャラリー、ソウル' 
        } 
      },
      { 
        year: '2015', 
        description: { 
          en: 'Cases of Finding a Whale in Mountain, Doosan Gallery, New York', 
          ko: 'Cases of Finding a Whale in Mountain, 두산갤러리, 뉴욕', 
          jp: 'Cases of Finding a Whale in Mountain、斗山ギャラリー、ニューヨーク' 
        } 
      },
      { 
        year: '2014', 
        description: { 
          en: '1 to 380, Sindoh Art Space, Seoul', 
          ko: '1 to 380, 신도 문화공간, 서울', 
          jp: '1 to 380、シンド文化空間、ソウル' 
        } 
      },
      { 
        year: '2013', 
        description: { 
          en: 'Bird Eat Bird, Insa Art Space, Seoul', 
          ko: 'Bird Eat Bird, 인사미술공간, 서울', 
          jp: 'Bird Eat Bird、仁寺美術空間、ソウル' 
        } 
      },
      { 
        year: '2011', 
        description: { 
          en: 'Missed Place, Project Space Sarubia, Seoul', 
          ko: '빗나간 자리, 프로젝트 스페이스 사루비아 다방, 서울', 
          jp: '外れた場所、プロジェクトスペース・サルビア喫茶、ソウル' 
        } 
      },
      { 
        year: '2010', 
        description: { 
          en: 'Unsaid, Gallery Scape, Seoul', 
          ko: '못다 한 말, 갤러리 스케이프, 서울', 
          jp: '言い残した言葉、ギャラリー・スケープ、ソウル' 
        } 
      },
    ]
  },
  {
    title: {
        en: 'GROUP EXHIBITIONS',
        ko: '단체전',
        jp: 'グループ展'
    },
    items: [
      { 
        year: '2024', 
        description: { 
          en: 'Artspectrum: Dream Screen, Leeum Museum of Art, Seoul', 
          ko: '아트스펙트럼:드림 스크린, 리움미술관, 서울', 
          jp: 'アートスペクトラム：ドリームスクリーン、リウム美術館、ソウル' 
        } 
      },
      { 
        year: '2022', 
        description: { 
          en: 'Sculpture Impulse, SeMA, Buk-Seoul Museum of Art, Seoul', 
          ko: '조각충동, 서울시립 북서울미술관, 서울', 
          jp: '彫刻衝動、ソウル市立北ソウル美術館、ソウル' 
        } 
      },
      { 
        year: '2022', 
        description: { 
          en: 'Gak, Hite Collection, Seoul', 
          ko: '각, 하이트 컬렉션, 서울', 
          jp: 'Gak、ハイトコレクション、ソウル' 
        } 
      },
      { 
        year: '2021', 
        description: { 
          en: 'Stop Worrying and Love the Bomb, SeMA, Nam-Seoul Museum of Art, Seoul', 
          ko: '걱정을 멈추고 폭탄을 사랑하기, 서울시립 남서울미술관, 서울', 
          jp: '心配を止めて爆弾を愛すること、ソウル市立南ソウル美術館、ソウル' 
        } 
      },
      { 
        year: '2021', 
        description: { 
          en: 'IEUM, Korea Foundation, Seoul', 
          ko: '이음, 한국국제교류재단, 서울', 
          jp: 'IEUM、韓国国際交流財団、ソウル' 
        } 
      },
      { 
        year: '2021', 
        description: { 
          en: 'The World of Materials Traversing, Arko Art Center, Seoul', 
          ko: '횡단하는 물질의 세계, 아르코 미술관, 서울', 
          jp: '横断する物質の世界、アルコ美術館、ソウル' 
        } 
      },
      { 
        year: '2020', 
        description: { 
          en: 'Art Plant Asia 2020: Rabbit Direction Object, Deoksugung, Seoul', 
          ko: '아트 플랜트 아시아 2020: 토끼 방향 오브젝트, 덕수궁, 서울', 
          jp: 'アートプラントアジア2020：ウサギ方向オブジェクト、徳寿宮、ソウル' 
        } 
      },
      { 
        year: '2020', 
        description: { 
          en: 'Cast and Crack, Jeongdong 1928 Art Center, Seoul', 
          ko: '캐스트 앤 크랙, 정동1928아트센터, 서울', 
          jp: 'キャスト・アンド・クラック、貞洞1928アートセンター、ソウル' 
        } 
      },
      { 
        year: '2019', 
        description: { 
          en: 'Dislocated Growth Points, Culture Tank, Seoul', 
          ko: '어긋나는 생장점, 문화비축기지, 서울', 
          jp: 'ずれた生長点、文化備蓄基地、ソウル' 
        } 
      },
      { 
        year: '2019', 
        description: { 
          en: 'Array, Gallery Baton, Seoul', 
          ko: 'Array, 갤러리 바톤, 서울', 
          jp: 'Array、ギャラリーバトン、ソウル' 
        } 
      },
      { 
        year: '2019', 
        description: { 
          en: 'Abstract of Our Time: Series II, Chapter II, Seoul', 
          ko: '우리시대의 추상: 시리즈 II, 챕터투, 서울', 
          jp: '我々の時代の抽象：シリーズII、チャプターツー、ソウル' 
        } 
      },
      { 
        year: '2019', 
        description: { 
          en: 'Decade Studio, Doosan Gallery, New York', 
          ko: 'Decade Studio, 두산갤러리, 뉴욕', 
          jp: 'Decade Studio、斗山ギャラリー、ニューヨーク' 
        } 
      },
      { 
        year: '2018', 
        description: { 
          en: 'Once a Day, Art Sonje Center, Seoul', 
          ko: '하루 한 번, 아트선재센터, 서울', 
          jp: '一日一回、アートソンジェセンター、ソウル' 
        } 
      },
      { 
        year: '2018', 
        description: { 
          en: 'apmap Amorepacific Outdoor Public Art Project, Osulloc Tea Museum, Jeju', 
          ko: 'apmap 아모레퍼시픽 야외 공공미술 프로젝트, 오설록 티뮤지엄, 제주', 
          jp: 'apmap アモーレパシフィック野外公共美術プロジェクト、オソルロクティーミュージアム、済州' 
        } 
      },
      { 
        year: '2017', 
        description: { 
          en: 'DawnBreaks, The Showroom, London', 
          ko: 'DawnBreaks, 더 쇼룸, 런던, 영국', 
          jp: 'DawnBreaks、ザ・ショールーム、ロンドン、英国' 
        } 
      },
      { 
        year: '2017', 
        description: { 
          en: 'Gangjeong Daegu Contemporary Art Festival, The ARC Square, Daegu', 
          ko: '강정 대구현대미술제, 강정보 디아크 광장, 대구', 
          jp: '江亭大邱現代美術祭、江亭堡ディ・アーク広場、大邱' 
        } 
      },
      { 
        year: '2017', 
        description: { 
          en: 'DawnBreaks: Seoul, Art Sonje Center, Seoul', 
          ko: '도운브레익스:서울, 아트선재센터, 서울', 
          jp: 'ドーンブレイクス：ソウル、アートソンジェセンター、ソウル' 
        } 
      },
      { 
        year: '2016', 
        description: { 
          en: 'DawnBreaks 2016, The 11th Gwangju Biennale, Gwangju', 
          ko: '도운브레익스2016, 제11회 광주비엔날레, 광주', 
          jp: 'ドーンブレイクス2016、第11回光州ビエンナーレ、光州' 
        } 
      },
      { 
        year: '2015', 
        description: { 
          en: 'Unknown Packages, Queens Museum, New York', 
          ko: 'Unknown Packages, 퀸즈뮤지엄, 뉴욕', 
          jp: 'Unknown Packages、クイーンズ美術館、ニューヨーク' 
        } 
      },
      { 
        year: '2014', 
        description: { 
          en: 'Low Technology, Seoul Museum of Art, Seoul', 
          ko: '로우테크놀로지, 서울시립미술관, 서울', 
          jp: 'ローテクノロジー、ソウル市立美術館、ソウル' 
        } 
      },
      { 
        year: '2014', 
        description: { 
          en: 'Spectrum-Spectrum, Plateau Museum of Art, Seoul', 
          ko: '스펙트럼-스펙트럼, 플라토미술관, 서울', 
          jp: 'スペクトラム-スペクトラム、プラトー美術館、ソウル' 
        } 
      },
      { 
        year: '2014', 
        description: { 
          en: 'How to Hold Your Breath, Doosan Gallery, Seoul', 
          ko: '숨을 참는 법, 두산갤러리, 서울', 
          jp: '息を止める方法、斗山ギャラリー、ソウル' 
        } 
      },
      { 
        year: '2014', 
        description: { 
          en: 'B painting, Gallery 175, Seoul', 
          ko: 'B painting, 갤러리 175, 서울', 
          jp: 'B painting、ギャラリー175、ソウル' 
        } 
      },
      { 
        year: '2014', 
        description: { 
          en: 'Fresher Air on the Floor, Amado Art Space, Seoul', 
          ko: '바닥에는 더 신선한 공기가 있어, 아마도예술공간, 서울', 
          jp: '床にはもっと新鮮な空気がある、アマド芸術空間、ソウル' 
        } 
      },
      { 
        year: '2013', 
        description: { 
          en: 'The Next Generation, Doosan Gallery, Seoul', 
          ko: 'The Next Generation, 두산갤러리, 서울', 
          jp: 'The Next Generation、斗山ギャラリー、ソウル' 
        } 
      },
      { 
        year: '2013', 
        description: { 
          en: 'Re-Writing, Doosan Gallery, Seoul & New York', 
          ko: '다시-쓰기, 두산갤러리, 서울, 뉴욕', 
          jp: '書き直し、斗山ギャラリー、ソウル、ニューヨーク' 
        } 
      },
      { 
        year: '2012', 
        description: { 
          en: 'Unfinished Journey, Cais Gallery, Seoul', 
          ko: 'Unfinished Journey, 카이스갤러리, 서울', 
          jp: 'Unfinished Journey、カイスギャラリー、ソウル' 
        } 
      },
      { 
        year: '2012', 
        description: { 
          en: 'The Anthology, Platform Place 629, Seoul', 
          ko: '디 앤솔로지, Platform Place 629, 서울', 
          jp: 'アンソロジー、Platform Place 629、ソウル' 
        } 
      },
      { 
        year: '2012', 
        description: { 
          en: 'Width of Night, Keumsan Gallery, Heyri', 
          ko: '밤의 너비, 금산 갤러리, 헤이리', 
          jp: '夜の幅、金山ギャラリー、ヘイリ' 
        } 
      },
      { 
        year: '2010', 
        description: { 
          en: 'Person Next to You, Gallery 175, Seoul', 
          ko: '옆 사람, 갤러리 175, 서울', 
          jp: '隣の人、ギャラリー175、ソウル' 
        } 
      },
      { 
        year: '2010', 
        description: { 
          en: 'Art Amsterdam: It’s Your Present, RAI, Amsterdam', 
          ko: 'Art Amsterdam : It’s Your Present, RAI, 암스테르담', 
          jp: 'Art Amsterdam : It’s Your Present、RAI、アムステルダム' 
        } 
      },
      { 
        year: '2010', 
        description: { 
          en: 'Seogyo 60: Archive of Imagination, Gallery Sangsang Madang, Seoul', 
          ko: '서교 육십 : 상상의 아카이브, 갤러리 상상마당, 서울', 
          jp: '西橋60：想像のアーカイブ、ギャラリーサンサンマダン、ソウル' 
        } 
      },
      { 
        year: '2009', 
        description: { 
          en: 'Rites of Passage, Suwon Art Center, Suwon', 
          ko: '통과의례, 수원시 미술 전시관, 수원', 
          jp: '通過儀礼、水原市美術展示館、水原' 
        } 
      },
      { 
        year: '2008', 
        description: { 
          en: '(Sub) Title, Gallery 175, Seoul', 
          ko: '(Sub) Title, 갤러리 175, 서울', 
          jp: '(Sub) Title、ギャラリー175、ソウル' 
        } 
      }
    ]
  },
  {
    title: {
        en: 'AWARDS & RESIDENCIES',
        ko: '수상 및 레지던스',
        jp: '受賞およびレジデンス'
    },
    items: [
      { 
        year: '2023', 
        description: { 
          en: 'Kim Se-choong Young Sculpture Award, Korea', 
          ko: '김세중 청년 조각상, 한국', 
          jp: '金世中（キム・セジュン）青年彫刻賞、韓国' 
        } 
      },
      { 
        year: '2022', 
        description: { 
          en: 'Incheon Art Platform Residency, Incheon, Korea', 
          ko: '인천아트플랫폼 입주작가, 인천, 한국', 
          jp: '仁川アートプラットフォーム入居作家、仁川、韓国' 
        } 
      },
      { 
        year: '2021', 
        description: { 
          en: 'Nanji Art Studio 15th Residency, Seoul, Korea', 
          ko: '난지미술창작스튜디오 15기 입주작가, 서울, 한국', 
          jp: '蘭芝美術創作スタジオ15期入居作家、ソウル、韓国' 
        } 
      },
      { 
        year: '2021', 
        description: { 
          en: 'Ministry of Culture Public Art Project <Chair of My Neighbor> Minister Award', 
          ko: '문체부 공공미술 프로젝트 <내 이웃의 의자> 장관상 수상', 
          jp: '文化体育観光部公共美術プロジェクト<私の隣人の椅子>長官賞受賞' 
        } 
      },
      { 
        year: '2020', 
        description: { 
          en: 'Can Foundation Residency, Seoul, Korea', 
          ko: '캔파운데이션 레지던시, 서울, 한국', 
          jp: 'キャン・ファウンデーション・レジデンシー、ソウル、韓国' 
        } 
      },
      { 
        year: '2017', 
        description: { 
          en: 'ACC Creation Center Lab Visiting Creator, Gwangju, Korea', 
          ko: '국립아시아문화전당 창제작센터 랩 방문창작자, 광주, 한국', 
          jp: '国立アジア文化殿堂 創作センター ラボ 訪問創作者、光州、韓国' 
        } 
      },
      { 
        year: '2015', 
        description: { 
          en: 'Seoul Art Space Geumcheon 7th Residency, Seoul, Korea', 
          ko: '서울시 창작공간 금천예술공장 7기 입주작가, 서울, 한국', 
          jp: 'ソウル市創作空間 衿川芸術工場 7期入居作家、ソウル、韓国' 
        } 
      },
      { 
        year: '2015', 
        description: { 
          en: 'Doosan New York Residency Program, New York, USA', 
          ko: '두산 뉴욕 레지던시 프로그램, 뉴욕, 미국', 
          jp: '斗山ニューヨーク・レジデンシー・プログラム、ニューヨーク、米国' 
        } 
      },
      { 
        year: '2013', 
        description: { 
          en: '3rd Sindoh Artist Support Program, Sindoh Foundation, Seoul', 
          ko: '제3회 신도리코 작가 지원 프로그램, 재단법인 가헌 신도재단, 서울', 
          jp: '第3回シンドリコ作家支援プログラム、財団法人カホンシンド財団、ソウル' 
        } 
      },
      { 
        year: '2013', 
        description: { 
          en: 'ARKO Young Art Frontier (AYAF), Arts Council Korea, Seoul', 
          ko: '한국문화예술위원회 AYAF(ARKO Young ART Frontier) 선정, 서울', 
          jp: '韓国文化芸術委員会 AYAF(ARKO Young ART Frontier) 選定、ソウル' 
        } 
      },
      { 
        year: '2012', 
        description: { 
          en: 'Mercedes-Benz Korea Artist Selection, Seoul', 
          ko: '메르세데츠 벤츠 코리아 아티스트 선정, 서울', 
          jp: 'メルセデス・ベンツ・コリア アーティスト選定、ソウル' 
        } 
      },
    ]
  },
  {
    title: {
        en: 'PROJECTS',
        ko: '프로젝트',
        jp: 'プロジェクト'
    },
    items: [
      { 
        year: '2022', 
        description: { 
          en: '<SOMA Citizen Participation Public Art Project: Art Bench>, Olympic Park, Seoul', 
          ko: '<SOMA 시민참여 공공미술 프로젝트 : 아트 벤치>, 올림픽공원, 서울', 
          jp: '<SOMA 市民参加公共美術プロジェクト：アートベンチ>、オリンピック公園、ソウル' 
        } 
      },
      { 
        year: '2021', 
        description: { 
          en: '<Public Art Project: Your Platform, Your Park>, Incheon Art Platform, Incheon', 
          ko: '<공공미술 프로젝트 : 유어 플랙폼 , 유어파크>, 인천아트플랫폼, 인천', 
          jp: '<公共美術プロジェクト：ユア・プラットフォーム、ユア・パーク>、仁川アートプラットフォーム、仁川' 
        } 
      },
      { 
        year: '2021', 
        description: { 
          en: '<Chair of My Neighbor> Public Art Project, Kkotseom, Yanggu', 
          ko: '<내 이웃의 의자> 공공미술 프로젝트, 양구 꽃섬, 강원도', 
          jp: '<私の隣人の椅子> 公共美術プロジェクト、楊口 花島、江原道' 
        } 
      },
      { 
        year: '2020', 
        description: { 
          en: '<Room Adventure> VR Workshop, KACES, Online', 
          ko: '<방구석 대모험> VR 워크샵, 한국문화예술교육진흥원, 온라인', 
          jp: '<部屋の隅の大冒険> VRワークショップ、韓国文化芸術教育振興院、オンライン' 
        } 
      },
      { 
        year: '2019', 
        description: { 
          en: '<Oval Headquarters> Seoul Public Art - Citizen Idea Implementation Project, Yongma Waterfall Park, Seoul', 
          ko: '<타원본부> 서울시 공공미술 -시민아이디어 구현 프로젝트, 용마폭포공원, 서울', 
          jp: '<楕円本部> ソウル市公共美術 - 市民アイデア具現プロジェクト、龍馬滝公園、ソウル' 
        } 
      },
    ]
  },
  {
    title: {
        en: 'PUBLICATIONS',
        ko: '출판',
        jp: '出版'
    },
    items: [
      { 
        year: '2023', 
        description: { 
          en: 'Gouge, Incheon Art Platform', 
          ko: '가우지, 인천아트플랫폼', 
          jp: 'ガウジ、仁川アートプラットフォーム' 
        } 
      },
      { 
        year: '2019', 
        description: { 
          en: 'Once a Day, Art Sonje Center', 
          ko: '하루 한 번, 아트선재센터', 
          jp: '一日一回、アートソンジェセンター' 
        } 
      },
      { 
        year: '2016', 
        description: { 
          en: 'Gomyeomseom, Doosan Gallery, Seoul', 
          ko: '곰염섬, 두산갤러리, 서울', 
          jp: 'ゴムヨムソム、斗山ギャラリー、ソウル' 
        } 
      },
      { 
        year: '2013', 
        description: { 
          en: 'Thames, Arts Council Korea, Seoul', 
          ko: 'Thames, 한국문화예술위원회, 서울', 
          jp: 'Thames、韓国文化芸術委員会、ソウル' 
        } 
      },
      { 
        year: '2013', 
        description: { 
          en: 'Bird Eat Bird, Arts Council Korea, Seoul', 
          ko: 'Bird Eat Bird, 한국문화예술위원회, 서울', 
          jp: 'Bird Eat Bird、韓国文化芸術委員会、ソウル' 
        } 
      },
    ]
  }
];

const bioData = {
  name: {
    en: "Jihyun Jung",
    ko: "정 지 현",
    jp: "チョン・ジヒョン"
  },
  info: {
    en: "b. 1986, Suwon, KR",
    ko: "1986년 수원 생",
    jp: "1986年 水原 生"
  },
  contact: [
    { label: 'WEBSITE', value: 'www.jihyunjung.com', link: 'http://www.jihyunjung.com' },
    { label: 'EMAIL', value: 'astradiog@gmail.com', link: 'mailto:astradiog@gmail.com' },
    { label: 'INSTAGRAM', value: '@jihyun_ball', link: 'https://instagram.com/jihyun_ball' },
  ]
};

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------

// Text Reveal Wrapper
const RevealText = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (el.current) {
      gsap.fromTo(
        el.current,
        { y: '100%', opacity: 0, rotateX: 10 },
        { 
          y: '0%', 
          opacity: 1, 
          rotateX: 0,
          duration: 1.2, 
          ease: 'power3.out', 
          delay: delay 
        }
      );
    }
  }, [delay]);

  return (
    <div className="overflow-hidden leading-tight">
      <div ref={el} className="origin-top-left will-change-transform">
        {children}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// About Component
// ----------------------------------------------------------------------

export const About = () => {
  const { lang } = useLanguage();
  
  // Refs for Virtual Scroll & Interactions
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  // Scroll State
  const state = useRef({
    current: 0,
    target: 0,
    ease: 0.08, // Slightly faster ease for tighter control
    last: 0,
    delta: 0,
    touch: { start: 0, prev: 0 },
    isTouching: false,
    maxScroll: 0,
    rafId: 0,
    winH: 0
  });

  // Setup Virtual Scroll Engine & Animations
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const s = state.current;
    
    // Initialize Dimensions
    const onResize = () => {
      s.winH = window.innerHeight;
      if (contentRef.current) {
        // Calculate max scroll with extra padding at bottom
        s.maxScroll = Math.max(0, contentRef.current.scrollHeight - s.winH + 100);
      }
    };
    window.addEventListener('resize', onResize);
    onResize();

    // Wheel Handler
    const onWheel = (e: WheelEvent) => {
      let delta = e.deltaY;
      delta *= 0.6; // Speed factor
      s.target += delta;
      s.target = Math.max(0, Math.min(s.target, s.maxScroll));
    };

    // Touch Handlers
    const onTouchStart = (e: TouchEvent) => {
      s.isTouching = true;
      s.touch.start = e.touches[0].clientY;
      s.touch.prev = s.target;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!s.isTouching) return;
      const y = e.touches[0].clientY;
      const distance = (s.touch.start - y) * 2.5; 
      s.target = s.touch.prev + distance;
      s.target = Math.max(0, Math.min(s.target, s.maxScroll));
    };

    const onTouchEnd = () => {
      s.isTouching = false;
    };

    // Add Listeners
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    const render = (t: number) => {
      // Lerp
      s.current += (s.target - s.current) * s.ease;
      s.delta = s.target - s.current;
      
      // Move Content
      if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(0, ${-s.current}px, 0)`;
      }

      // Animate List Items (Curve + Skew + Opacity)
      itemsRef.current.forEach((item) => {
        if (!item) return;
        
        const bounds = item.getBoundingClientRect();
        
        // Optimization: Only animate visible items
        if (bounds.top < s.winH + 100 && bounds.bottom > -100) {
          const progress = bounds.top / s.winH;
          
          // Curve Effect
          const curveX = Math.sin(progress * Math.PI) * (s.delta * 0.5);
          
          // Skew Effect based on velocity
          const skewX = s.delta * 0.1;

          // Apply Transform
          item.style.transform = `translate3d(${curveX}px, 0, 0) skewX(${-skewX}deg)`;
          
          // Dynamic Opacity based on speed (blur effect simulation)
          const opacity = 1 - Math.min(Math.abs(s.delta) * 0.005, 0.4);
          item.style.opacity = opacity.toString();
        }
      });

      s.last = s.current;
      s.rafId = requestAnimationFrame(render);
    };

    s.rafId = requestAnimationFrame(render);

    // Cleanup
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      cancelAnimationFrame(s.rafId);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full bg-background text-foreground overflow-hidden font-sans selection:bg-foreground selection:text-background"
    >
      <div className="w-full h-full px-6 md:px-12 relative flex">
        
        {/* ------------------------------------------------------- */}
        {/* LEFT COLUMN (FIXED)                                     */}
        {/* ------------------------------------------------------- */}
        <div className="hidden md:flex flex-col w-[20%] h-full pt-28 md:pt-32 relative z-20 pointer-events-none">
           {/* Top: Profile */}
           <div className="flex flex-col gap-6 max-w-full pointer-events-auto">
             <RevealText delay={0.2}>
                <h1 className="text-lg font-serif font-medium tracking-wide text-foreground">{bioData.name[lang]}</h1>
             </RevealText>
             
             <div className="flex flex-col gap-1">
                 <RevealText delay={0.3}>
                     <p className="text-xs leading-relaxed text-muted-foreground font-light">
                     {bioData.info[lang]}
                     </p>
                 </RevealText>
             </div>
           </div>

           {/* Bottom: Contact - Positioned Absolutely at Bottom */}
           <div className="absolute bottom-12 left-0 flex flex-col gap-4 pointer-events-auto">
              {bioData.contact.map((item, idx) => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <RevealText delay={0.5 + (idx * 0.1)}>
                    <span className="text-[8px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1 block">
                        {item.label}
                    </span>
                    <a 
                        href={item.link} 
                        target={item.label !== 'EMAIL' ? "_blank" : undefined}
                        rel={item.label !== 'EMAIL' ? "noopener noreferrer" : undefined}
                        className="text-xs font-light hover:text-foreground/50 transition-colors relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-foreground after:transition-all after:duration-300 hover:after:w-full"
                    >
                        {item.value}
                    </a>
                  </RevealText>
                </div>
              ))}
           </div>
        </div>

        {/* ------------------------------------------------------- */}
        {/* RIGHT COLUMN (VIRTUAL SCROLL)                           */}
        {/* ------------------------------------------------------- */}
        <div 
          className="flex-1 h-full relative"
          style={{ perspective: '1000px' }} 
        >
          <div 
            ref={contentRef}
            className="absolute top-0 right-0 w-full md:w-[80%] pt-28 md:pt-32 pb-32 flex flex-col gap-20 will-change-transform"
          >
            {/* Mobile Header */}
            <div className="md:hidden flex flex-col gap-6 mb-12">
               <h1 className="text-2xl font-light uppercase tracking-widest">{bioData.name[lang]}</h1>
               <p className="text-sm text-muted-foreground leading-relaxed">{bioData.info[lang]}</p>
            </div>

            {cvData.map((section, sIdx) => (
              <section key={section.title.en} className="flex flex-col gap-6">
                {/* Section Title */}
                <RevealText delay={0.4 + (sIdx * 0.1)}>
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-[9px] font-mono text-muted-foreground/70 uppercase tracking-[0.2em]">
                        {section.title[lang]}
                        </h2>
                    </div>
                </RevealText>

                <div className="flex flex-col gap-4">
                  {section.items.map((item, iIdx) => (
                    <div key={iIdx} className="flex flex-col md:flex-row gap-2 md:gap-6 group items-baseline">
                      {/* Year */}
                      <div className="w-full md:w-16 shrink-0">
                         <RevealText delay={0.5 + (iIdx * 0.05)}>
                            <span className="font-mono text-[10px] text-muted-foreground/50 block">
                            {item.year}
                            </span>
                         </RevealText>
                      </div>
                      
                      {/* Description */}
                      <div className="flex-1 relative">
                        {/* Interactive Item Wrapper */}
                        <div 
                          ref={(el) => {
                            if (el) itemsRef.current.push(el);
                          }}
                          className="will-change-transform origin-left backface-hidden"
                        >
                           <RevealText delay={0.5 + (iIdx * 0.05)}>
                                <span className="font-serif text-sm font-light leading-relaxed block group-hover:text-muted-foreground transition-colors duration-300 cursor-default">
                                    {item.description[lang]}
                                </span>
                           </RevealText>
                        </div>
                        
                        {item.sub && (
                          <RevealText delay={0.6 + (iIdx * 0.05)}>
                            <div className="text-[10px] text-muted-foreground/40 italic mt-1 tracking-wide">
                                {item.sub}
                            </div>
                          </RevealText>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <div className="pt-24 opacity-30 hover:opacity-100 transition-opacity duration-500">
               <Footer />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
