# 🌐 DeepL Direct API Setup Guide

## 개요

이 사이트는 **프론트엔드에서 직접 DeepL API를 호출**하여 번역을 처리합니다.
WordPress 백엔드 설정 없이도 고품질 DeepL 번역을 사용할 수 있습니다.

---

## 🎯 특징

- ✅ **백엔드 불필요** - WordPress 설정 없이 작동
- ✅ **고품질 번역** - DeepL Pro 수준의 번역 품질
- ✅ **무료 플랜** - 월 50만 자 무료 (개인 포트폴리오에 충분)
- ✅ **영구 캐싱** - localStorage에 번역 결과 저장
- ✅ **토큰 절약** - 한 번 번역한 텍스트는 다시 호출 안 함
- ✅ **사용량 추적** - 월별 사용량 자동 모니터링

---

## 🔐 보안 참고사항

**API 키가 프론트엔드에 노출됩니다!**

하지만 다음 이유로 **큰 문제는 아닙니다**:

1. **작은 포트폴리오 사이트** - 번역 API는 큰 보안 이슈가 아님
2. **무료 플랜 한도** - DeepL이 월 50만 자로 제한
3. **사용량 제한 설정** - DeepL 대시보드에서 월 한도 설정 가능
4. **localStorage 캐싱** - 대부분의 호출이 캐시에서 처리됨

**추가 보호 장치:**
- ✅ DeepL 대시보드에서 월 사용량 한도 설정
- ✅ Rate Limiting (API 호출 간격 200ms)
- ✅ 에러 발생 시 원본 텍스트로 Fallback

---

## 📝 설정 단계

### 1️⃣ DeepL API 키 발급

1. **DeepL 계정 생성**
   - 🔗 https://www.deepl.com/signup

2. **API 플랜 선택**
   - **DeepL API Free**: 월 50만 자 무료 (추천!)
   - **DeepL API Pro**: 사용량에 따라 과금

3. **API 키 복사**
   - 🔗 https://www.deepl.com/account/summary
   - "Authentication Key for DeepL API" 복사

---

### 2️⃣ 프로젝트 설정

1. **`.env` 파일 생성**
   ```bash
   # 프로젝트 루트 디렉토리에서
   cp .env.example .env
   ```

2. **API 키 입력**
   ```env
   # .env 파일
   VITE_DEEPL_API_KEY=your_actual_api_key_here
   ```

   **예시:**
   ```env
   VITE_DEEPL_API_KEY=a1b2c3d4-5678-90ef-ghij-klmnopqrstuv:fx
   ```

3. **개발 서버 재시작**
   ```bash
   # Vite 서버 재시작 (환경변수 반영)
   npm run dev
   ```

---

### 3️⃣ API 플랜 확인

#### **Free API 사용 시 (추천)**
`.env` 파일:
```env
VITE_DEEPL_API_KEY=your_key_here
```

`/src/services/deepl-direct.ts` (이미 설정됨):
```ts
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';
```

#### **Pro API 사용 시**
`/src/services/deepl-direct.ts` 수정:
```ts
const DEEPL_API_URL = 'https://api.deepl.com/v2/translate';
```

---

## 🧪 테스트

### 1. 브라우저 콘솔 열기
- **Chrome/Edge**: F12 → Console 탭
- **Firefox**: F12 → Console 탭
- **Safari**: Cmd+Option+C

### 2. 언어 전환 테스트
1. 사이트 로드 → Header의 **EN** 클릭
2. 콘솔에서 메시지 확인:

**✅ 정상 작동:**
```
✅ [DeepL] Direct API service loaded (Frontend mode)
[WorkContext] 🌐 Translating to EN...
[WorkContext] 📄 Translating work: 작품 제목
[DeepL] 🌐 Translating to en: 작품 제목...
[DeepL] ✅ Translated: Artwork Title...
[WorkContext] ✅ Translation to en complete
```

**💾 캐시 사용:**
```
[DeepL] 💾 Cache hit: 작품 제목...
```

**❌ API 키 없음:**
```
⚠️ [DeepL] API key not configured. Set VITE_DEEPL_API_KEY in .env file
```

**❌ API 키 오류:**
```
DeepL API key invalid. Check your API key at https://www.deepl.com/account/summary
```

---

## 📊 사용량 모니터링

### 콘솔에서 사용량 확인
```js
// 브라우저 콘솔에서 실행
import { getDeepLStats, getRemainingQuota } from '@/services/deepl-direct';

// 전체 통계
console.log(getDeepLStats());

// 남은 할당량
console.log(getRemainingQuota());
```

**출력 예시:**
```js
{
  totalCached: 45,        // 캐시에서 불러온 횟수
  totalApiCalls: 12,      // 실제 API 호출 횟수
  lastUpdate: "2025-01-28T...",
  monthlyChars: 3450,     // 이번 달 번역한 글자 수
  monthlyLimit: 500000    // 월 한도
}
```

### DeepL 대시보드에서 확인
🔗 https://www.deepl.com/account/usage

---

## 🚨 문제 해결

### ❌ "API key not configured"
**원인:** `.env` 파일이 없거나 API 키가 설정되지 않음

**해결:**
```bash
# .env 파일 확인
cat .env

# API 키가 있는지 확인
VITE_DEEPL_API_KEY=your_key_here

# 개발 서버 재시작
npm run dev
```

---

### ❌ "API key invalid"
**원인:** DeepL API 키가 잘못되었거나 만료됨

**해결:**
1. 🔗 https://www.deepl.com/account/summary
2. API 키 재확인
3. `.env` 파일 업데이트
4. 개발 서버 재시작

---

### ❌ "Quota exceeded"
**원인:** 월 50만 자 한도 초과

**해결:**
1. DeepL Pro로 업그레이드
2. 또는 다음 달까지 대기
3. 또는 캐시 확인 (대부분 캐시에서 처리됨)

---

### ⚠️ 번역이 느림
**원인:** 많은 텍스트를 동시에 번역

**해결:**
- ✅ **이미 구현됨**: Rate Limiting (200ms 간격)
- ✅ **이미 구현됨**: localStorage 캐싱
- 한 번 번역한 텍스트는 즉시 로드됨

---

### 🧹 캐시 초기화
번역이 이상하거나 업데이트가 필요한 경우:

```js
// 브라우저 콘솔에서 실행
import { clearDeepLCache } from '@/services/deepl-direct';
clearDeepLCache();

// 페이지 새로고침
location.reload();
```

---

## 📈 비용 예상

### DeepL API Free (월 50만 자)

**평균 작품 데이터:**
- 제목: 20자
- 설명: 200자
- 한 줄 정보: 30자
- **합계: 250자 / 작품**

**번역 가능 작품 수:**
- 500,000자 ÷ 250자 = **2,000개 작품**
- EN + JP 번역 시 = **1,000개 작품**

**결론:** 개인 포트폴리오는 **충분히 무료로 사용 가능!**

---

## 🔄 WordPress 백엔드 방식과 비교

| 항목 | DeepL Direct (현재) | WordPress 백엔드 |
|------|-------------------|-----------------|
| 번역 품질 | ⭐⭐⭐⭐⭐ (DeepL) | ⭐⭐⭐⭐⭐ (DeepL) |
| 설정 난이도 | ⭐⭐ (쉬움) | ⭐⭐⭐⭐ (복잡함) |
| 캐싱 위치 | localStorage (브라우저) | WordPress DB (서버) |
| API 키 노출 | ⚠️ 프론트엔드 노출 | ✅ 서버에서 안전 |
| 백엔드 필요 | ❌ 불필요 | ✅ 필요 (functions.php) |
| 포트폴리오 적합성 | ✅ 매우 적합 | ⚙️ 과도한 설정 |

---

## ✅ 체크리스트

배포 전 확인:

- [ ] DeepL API 키 발급
- [ ] `.env` 파일에 API 키 추가
- [ ] 개발 서버 재시작
- [ ] EN/JP 번역 테스트
- [ ] 콘솔에서 정상 작동 확인
- [ ] DeepL 대시보드에서 사용량 제한 설정
- [ ] 프로덕션 빌드 테스트

---

## 📞 문제가 있나요?

1. **콘솔 에러 메시지 확인**
2. **DeepL API 키 재확인**
3. **개발 서버 재시작**
4. **캐시 초기화 시도**

여전히 문제가 있다면 이 가이드를 다시 확인하세요! 🚀
