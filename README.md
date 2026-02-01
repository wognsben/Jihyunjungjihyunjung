# 🎨 Silent Luxury Portfolio

React + GSAP + Headless WordPress 기반의 프리미엄 포트폴리오 사이트

---

## ✨ 주요 특징

- 🎬 **시네마틱 오프닝** - 3.7초 프리미엄 인트로 애니메이션
- 🖼️ **고급 갤러리** - GSAP 기반 인터랙티브 슬라이더
- 🌐 **다국어 지원** - KR/EN/JP (DeepL API)
- 📱 **WordPress API** - Headless CMS 연동
- 🎯 **Silent Luxury** - 절제된 흑백 디자인

---

## 🚀 빠른 시작

### 1. 설치

```bash
npm install
# 또는
pnpm install
```

### 2. DeepL API 설정

```bash
# .env 파일 생성
cp .env.example .env
```

`.env` 파일 편집:
```env
VITE_DEEPL_API_KEY=your_deepl_api_key_here
```

**DeepL API 키 발급:**
- 🔗 https://www.deepl.com/signup
- Free 플랜: 월 50만 자 무료

**자세한 설정:** [DEEPL_SETUP.md](./DEEPL_SETUP.md)

### 3. 개발 서버 실행

```bash
npm run dev
```

---

## 📚 문서

- 🌐 **[DEEPL_SETUP.md](./DEEPL_SETUP.md)** - DeepL API 설정 가이드
- 📝 **[HEADLESS_WORDPRESS_GUIDE.md](./HEADLESS_WORDPRESS_GUIDE.md)** - WordPress 연동
- 🖼️ **[WORDPRESS_IMAGE_GUIDE.md](./WORDPRESS_IMAGE_GUIDE.md)** - 이미지 최적화

---

## 🎯 기술 스택

### Frontend
- **React 18** - UI 프레임워크
- **Vite** - 빌드 도구
- **GSAP** - 애니메이션 라이브러리
- **Tailwind CSS v4** - 스타일링
- **Motion (Framer Motion)** - 페이지 트랜지션

### Backend
- **WordPress REST API** - Headless CMS
- **DeepL API** - 고품질 번역 (프론트엔드 직접 호출)

### 번역 시스템
- **DeepL Direct** - 프론트엔드에서 직접 API 호출
- **localStorage 캐싱** - 번역 결과 영구 저장
- **사용량 추적** - 월별 API 사용량 모니터링

---

## 🌐 다국어 시스템

### 언어 전환
Header에서 **KR** / **EN** / **JP** 클릭

### 번역 방식
1. **KR (한국어)** - WordPress 원본 데이터
2. **EN (영어)** - DeepL API 번역 + localStorage 캐싱
3. **JP (일본어)** - DeepL API 번역 + localStorage 캐싱

### 캐싱 시스템
- **첫 번역**: DeepL API 호출 (~1초)
- **이후 로드**: localStorage 캐시 (즉시)
- **영구 저장**: 브라우저 캐시 삭제 전까지 유지

---

## 📊 사용량 모니터링

### 콘솔에서 확인
브라우저 개발자 도구 (F12) → Console:

```js
import { getDeepLStats, getRemainingQuota } from '@/services/deepl-direct';

// 전체 통계
console.log(getDeepLStats());

// 남은 할당량
console.log(getRemainingQuota());
```

### DeepL 대시보드
🔗 https://www.deepl.com/account/usage

---

## 🔐 보안 참고사항

**API 키가 프론트엔드에 노출됩니다.**

하지만 다음 이유로 큰 문제는 아닙니다:
- ✅ 작은 포트폴리오 사이트
- ✅ DeepL Free 플랜 월 50만 자 제한
- ✅ localStorage 캐싱으로 API 호출 최소화
- ✅ DeepL 대시보드에서 사용량 제한 설정 가능

---

## 🏗️ 프로젝트 구조

```
/
├── src/
│   ├── app/
│   │   ├── App.tsx                    # 메인 앱
│   │   └── components/                # React 컴포넌트
│   │       ├── Header.tsx             # 언어 전환
│   │       ├── WorkGrid.tsx           # 작품 그리드
│   │       ├── Text.tsx               # 텍스트 목록
│   │       └── ...
│   ├── contexts/
│   │   ├── LanguageContext.tsx        # 언어 상태 관리
│   │   └── WorkContext.tsx            # WordPress + 번역
│   ├── services/
│   │   ├── deepl-direct.ts            # ⭐ DeepL API (프론트엔드)
│   │   ├── wp-api.ts                  # WordPress API
│   │   └── translation.ts             # (deprecated)
│   ├── hooks/
│   │   └── useTranslatedTexts.ts      # 텍스트 번역 Hook
│   └── data/
│       ├── works.ts                   # Work 타입 정의
│       └── texts.ts                   # Text 타입 정의
├── .env.example                       # 환경변수 예시
├── .gitignore                         # Git 제외 파일
├── DEEPL_SETUP.md                     # ⭐ DeepL 설정 가이드
└── README.md                          # 이 파일
```

---

## 🚨 문제 해결

### ❌ "API key not configured"
```bash
# .env 파일 확인
cat .env

# API 키 추가
VITE_DEEPL_API_KEY=your_key_here

# 개발 서버 재시작
npm run dev
```

### ❌ 번역이 안 됨
1. 브라우저 콘솔 (F12) 열기
2. 에러 메시지 확인
3. [DEEPL_SETUP.md](./DEEPL_SETUP.md) 참고

### ❌ 월 한도 초과
- DeepL Pro로 업그레이드
- 또는 다음 달까지 대기
- **대부분 캐시에서 처리되어 거의 발생하지 않음**

---

## 📦 빌드

```bash
npm run build
```

빌드 파일: `dist/` 디렉토리

---

## 🌟 WordPress 설정

WordPress REST API 엔드포인트:
```
https://wognsben97.mycafe24.com/wp-json/wp/v2/works
https://wognsben97.mycafe24.com/wp-json/wp/v2/texts
```

자세한 설정: [HEADLESS_WORDPRESS_GUIDE.md](./HEADLESS_WORDPRESS_GUIDE.md)

---

## 📄 라이선스

MIT License

---

## 🙏 크레딧

- **DeepL API** - 고품질 번역
- **WordPress** - Headless CMS
- **GSAP** - 프리미엄 애니메이션
- **Tailwind CSS** - 유틸리티 스타일링

---

**🚀 Happy Coding!**
