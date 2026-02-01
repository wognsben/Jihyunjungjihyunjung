# 🌐 DeepL 번역 시스템 가이드

## 📋 개요

WordPress DeepL API를 활용한 **스마트 캐싱 번역 시스템**이 구축되었습니다.

### ✨ 주요 기능

- **KR**: WordPress 원본 한국어 데이터 표시
- **EN/JP**: 클릭 시 DeepL API로 자동 번역
- **캐싱**: 한 번 번역된 내용은 WordPress DB에 영구 저장
- **토큰 절약**: 재번역 시 캐시된 데이터 사용 (API 호출 없음)
- **일관성**: 동일한 번역 결과 보장

---

## 🛠️ WordPress 설정

### 1. `functions.php`에 코드 추가

테마 폴더의 `functions.php` 파일에 아래 코드를 추가하세요:

```php
<?php
// REST API 엔드포인트 추가 (번역 캐싱)
add_action('rest_api_init', function () {
    register_rest_route('deepl/v1', '/translate-post', [
        'methods' => 'POST',
        'callback' => 'deepl_translate_post_cached',
        'permission_callback' => '__return_true',
    ]);
});

function deepl_translate_post_cached($request) {
    $params = $request->get_json_params();
    $post_id = intval($params['post_id']);
    $target_lang = sanitize_text_field($params['target_lang']); // 'EN' or 'JA'
    $field = sanitize_text_field($params['field']); // 'title', 'content', 'excerpt' 등
    
    if (!$post_id || !$target_lang || !$field) {
        return new WP_Error('invalid_params', 'Missing parameters', ['status' => 400]);
    }
    
    // 캐시 키 생성
    $cache_key = "translated_{$field}_" . strtolower($target_lang);
    
    // 1. 캐시 확인 (이미 번역된 적 있으면 재사용)
    $cached = get_post_meta($post_id, $cache_key, true);
    if (!empty($cached)) {
        return [
            'success' => true,
            'translated_text' => $cached,
            'from_cache' => true,
        ];
    }
    
    // 2. 원본 텍스트 가져오기
    $post = get_post($post_id);
    if (!$post) {
        return new WP_Error('post_not_found', 'Post not found', ['status' => 404]);
    }
    
    switch ($field) {
        case 'title':
            $original_text = $post->post_title;
            break;
        case 'content':
            $original_text = wp_strip_all_tags($post->post_content);
            break;
        case 'excerpt':
            $original_text = wp_strip_all_tags($post->post_excerpt);
            break;
        default:
            $original_text = '';
    }
    
    if (empty($original_text)) {
        return ['success' => true, 'translated_text' => '', 'from_cache' => false];
    }
    
    // 3. DeepL API 키 (Auto Translate API 플러그인에서 저장된 키)
    $api_key = '9f22db46-7170-44a7-bc6c-9a00294aa60f:fx';
    
    // 4. DeepL API 호출
    $response = wp_remote_post('https://api-free.deepl.com/v2/translate', [
        'headers' => [
            'Authorization' => 'DeepL-Auth-Key ' . $api_key,
            'Content-Type' => 'application/json',
        ],
        'body' => json_encode([
            'text' => [$original_text],
            'target_lang' => $target_lang === 'EN' ? 'EN-US' : $target_lang,
            'source_lang' => 'KO',
        ]),
        'timeout' => 30,
    ]);
    
    if (is_wp_error($response)) {
        return new WP_Error('deepl_error', $response->get_error_message(), ['status' => 500]);
    }
    
    $body = json_decode(wp_remote_retrieve_body($response), true);
    $translated_text = $body['translations'][0]['text'] ?? $original_text;
    
    // 5. 번역 결과를 캐시로 저장 (다음부터는 API 호출 안함)
    update_post_meta($post_id, $cache_key, $translated_text);
    
    return [
        'success' => true,
        'translated_text' => $translated_text,
        'from_cache' => false,
    ];
}
```

### 2. 테스트 엔드포인트

브라우저에서 확인:
```
https://wognsben97.mycafe24.com/wp-json/deepl/v1/translate-post
```

Postman/cURL로 테스트:
```bash
curl -X POST https://wognsben97.mycafe24.com/wp-json/deepl/v1/translate-post \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": 123,
    "target_lang": "EN",
    "field": "title"
  }'
```

---

## 🎯 React 사용법

### Header에서 언어 변경
```tsx
<button
  onClick={() => {
    setLang(language.code);
    translateWorksToLanguage(language.code);
  }}
>
  {language.label}
</button>
```

### 번역 서비스 직접 호출
```tsx
import { translatePostField } from '@/services/deepl-translation';

// 단일 필드 번역
const translatedTitle = await translatePostField(123, 'title', 'en');

// 여러 필드 한번에 번역
const translations = await translatePost(123, ['title', 'content', 'excerpt'], 'en');
```

---

## 🔍 디버깅

### 브라우저 콘솔 확인

1. **번역 요청 시작**:
   ```
   [WorkContext] Translating to en...
   ```

2. **캐시 히트** (이미 번역됨):
   ```
   [Translation] 💾 Cache: title (en)
   ```

3. **DeepL API 호출** (새로운 번역):
   ```
   [Translation] 🌐 DeepL API: title (en)
   ```

4. **번역 완료**:
   ```
   [WorkContext] ✅ Translation to en complete
   ```

### 에러 확인

- **WordPress 응답 에러**: `functions.php` 코드 확인
- **API 키 에러**: DeepL API 키가 올바른지 확인
- **CORS 에러**: WordPress REST API가 활성화되어 있는지 확인

---

## 📊 캐시 확인

### WordPress DB에서 확인

```sql
SELECT post_id, meta_key, meta_value 
FROM wp_postmeta 
WHERE meta_key LIKE 'translated_%';
```

### 예상 결과:
| post_id | meta_key | meta_value |
|---------|----------|------------|
| 123 | translated_title_en | "Translated Title" |
| 123 | translated_title_ja | "翻訳されたタイトル" |
| 123 | translated_content_en | "Translated content..." |

---

## ⚡ 성능 최적화

### 현재 구현된 최적화:
✅ **WordPress 캐싱**: Post Meta에 영구 저장  
✅ **병렬 번역**: 모든 작품 동시 번역  
✅ **중복 방지**: 캐시 있으면 API 호출 안함  
✅ **에러 핸들링**: 번역 실패 시 원본 한국어 표시  

### 추가 최적화 가능:
- ⏱️ **로딩 인디케이터**: 번역 중 스피너 표시
- 🔄 **백그라운드 번역**: 페이지 로드 후 비동기로 번역
- 📦 **Batch API**: DeepL Batch API 사용 (대량 번역 시)

---

## 🎉 완료!

이제 **KR/EN/JP** 버튼을 클릭하여 번역 시스템을 테스트하세요!

첫 번째 클릭은 DeepL API를 호출하고, 두 번째부터는 캐시된 데이터를 사용합니다. 🚀
