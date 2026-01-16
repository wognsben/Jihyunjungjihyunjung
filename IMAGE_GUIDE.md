# 이미지 관리 가이드

## 🎯 배포 시 이미지 안정성 보장 방법

### 현재 사용 중인 방식
- **Unsplash 간소화 URL** 사용
- Format: `https://images.unsplash.com/photo-{id}?w=1200&q=80`
- ✅ Netlify, Vercel, GitHub Pages 등 모든 플랫폼에서 작동
- ✅ CORS 이슈 없음
- ✅ 빠른 로딩 속도

---

## 📁 실제 프로젝트에 이미지 추가하는 방법

### 방법 1: Public 폴더 사용 (권장)

1. **이미지 파일 저장**
   ```
   /public/
     /images/
       /works/
         project-01.jpg
         project-02.jpg
         project-03.jpg
   ```

2. **코드에서 참조**
   ```typescript
   thumbnail: "/images/works/project-01.jpg"
   ```

3. **장점**
   - ✅ 배포 시 100% 안정적
   - ✅ 빠른 로딩 (CDN 캐싱)
   - ✅ 오프라인에서도 작동

---

### 방법 2: Cloudinary 사용 (추천)

무료 CDN으로 이미지 호스팅:

1. **Cloudinary 가입** (무료)
   - https://cloudinary.com

2. **이미지 업로드**
   - 대시보드에서 이미지 업로드

3. **URL 복사**
   ```
   https://res.cloudinary.com/{your-cloud-name}/image/upload/v1234567890/project-01.jpg
   ```

4. **장점**
   - ✅ 자동 최적화
   - ✅ 반응형 이미지 (모바일/데스크톱)
   - ✅ 무료 25GB 저장공간

---

### 방법 3: Unsplash 직접 다운로드

1. **이미지 다운로드**
   - 현재 사용 중인 Unsplash 이미지 다운로드
   - 예: https://unsplash.com/photos/{photo-id}

2. **압축 및 최적화**
   ```bash
   # 온라인 도구 사용
   - https://tinypng.com (PNG/JPG 압축)
   - https://squoosh.app (고급 최적화)
   ```

3. **Public 폴더에 저장**

---

## 🔧 현재 프로젝트에서 이미지 교체하기

### 단계별 가이드

1. **works.ts 파일 열기**
   ```typescript
   // /src/data/works.ts
   ```

2. **thumbnail URL 변경**
   ```typescript
   {
     id: "1",
     title_ko: "모던 전시 공간",
     title_en: "Modern Exhibition Space",
     title_jp: "モダン展示スペース",
     // 변경 전:
     thumbnail: "https://images.unsplash.com/photo-xxx...",
     // 변경 후:
     thumbnail: "/images/works/project-01.jpg",
     // 또는:
     thumbnail: "https://res.cloudinary.com/.../project-01.jpg"
   }
   ```

3. **갤러리 이미지도 변경**
   ```typescript
   galleryImages: [
     "/images/works/project-01-gallery-1.jpg",
     "/images/works/project-01-gallery-2.jpg",
     "/images/works/project-01-gallery-3.jpg"
   ]
   ```

---

## 📊 이미지 최적화 팁

### 권장 사양
- **포맷**: JPG (사진), PNG (투명 배경), WebP (최신 브라우저)
- **크기**: 
  - 썸네일: 1200x800px (가로형) 또는 800x1000px (세로형)
  - 갤러리: 1920x1280px (고해상도)
- **용량**: 
  - 썸네일: 150KB 이하
  - 갤러리: 300KB 이하
- **품질**: JPG 80-85%

### 반응형 이미지
```typescript
// 다양한 화면 크기를 위한 이미지 세트
thumbnail: "/images/works/project-01.jpg",
thumbnailMobile: "/images/works/project-01-mobile.jpg",
thumbnailTablet: "/images/works/project-01-tablet.jpg"
```

---

## 🚀 Netlify/Vercel 배포 전 체크리스트

- [ ] 모든 이미지 URL이 `/public` 경로 또는 CDN URL인지 확인
- [ ] 외부 URL의 경우 HTTPS인지 확인
- [ ] 이미지 파일명에 한글/특수문자 없는지 확인
- [ ] 모든 이미지가 실제로 로드되는지 로컬에서 테스트
- [ ] 이미지 용량이 적절한지 확인 (200KB 이하 권장)

---

## 💡 빠른 교체 스크립트

현재 Unsplash 이미지를 한 번에 다운로드하려면:

```bash
# Node.js 스크립트 예시
# download-images.js 생성 후 실행

const fs = require('fs');
const https = require('https');

const images = [
  { url: 'https://images.unsplash.com/photo-1723974591057-ccadada1f283?w=1200&q=80', name: 'project-01.jpg' },
  { url: 'https://images.unsplash.com/photo-1723242017405-5018aa65ddad?w=1200&q=80', name: 'project-02.jpg' },
  // ... 나머지 이미지
];

images.forEach(img => {
  https.get(img.url, (res) => {
    const path = `public/images/works/${img.name}`;
    const writeStream = fs.createWriteStream(path);
    res.pipe(writeStream);
    writeStream.on('finish', () => {
      console.log(`Downloaded: ${img.name}`);
      writeStream.close();
    });
  });
});
```

실행:
```bash
node download-images.js
```

---

## 🎨 Jihyeong Jung 실제 작품 사진 사용 시

1. 고해상도 원본 파일 준비
2. 온라인 도구로 최적화
3. `/public/images/works/` 폴더에 저장
4. `works.ts`에서 경로 업데이트
5. 배포 전 로컬 테스트

**중요**: 실제 작품 사진의 저작권은 작가에게 있으므로 안전합니다!
