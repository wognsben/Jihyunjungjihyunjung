피그마가 말한 내용 평가
1. 원인 진단

이건 정확해.

wp-api.ts에서 HTML 태그 제거

TextDetail.tsx에서 텍스트 렌더링

둘 다 링크를 죽이는 원인 맞음.

2. 해결 방향

이것도 방향은 맞아.

데이터 단계에서 HTML 보존

렌더 단계에서 HTML 렌더

sanitize 적용

외부 링크 보안 속성 자동 부여

이건 좋은 접근이야.

다만 수정 추천 포인트
현재 제안

<a> 태그만 보존하고 나머지 HTML strip`

이건 조금 아쉬움.

이유

워드프레스 본문은 단순한 텍스트가 아니라 본문 구조 자체가 HTML이기 때문에,
링크만 살리고 문단 태그를 다 날려버리면 나중에 이런 문제 생김:

줄바꿈 이상함

문단 구분 사라짐

리스트 깨짐

강조 표현 사라짐

더 좋은 방식
추천 방식

transformText에서는 가급적 strip을 하지 말고 원본 HTML을 유지
그리고 TextDetail.tsx에서 허용 태그만 sanitize 후 렌더

즉:

wp-api.ts

여기서는 웬만하면 이렇게:

const content_ko = decode(contentHtml);
const content_en = content_en_raw ? decode(content_en_raw) : content_ko;
const content_jp = content_jp_raw ? decode(content_jp_raw) : content_ko;

핵심은:

여기서 태그를 정규식으로 지우지 말 것

데이터는 최대한 원본 유지

정제는 렌더 직전에 할 것

TextDetail.tsx

여기서 sanitize + 렌더:

<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />

그리고 sanitize 허용 태그를 최소한 이렇게 두는 게 좋음:

a

p

br

strong

em

ul

ol

li

blockquote

왜 이 방식이 더 좋냐

정리하면:

데이터 레이어에서는 원본 보존

뷰 레이어에서 안전하게 정제

링크뿐 아니라 문단 구조도 유지

나중에 bold, italic, list도 자연스럽게 지원 가능

즉 지금처럼 “링크 하나 넣으려고 구조 전체를 억지로 우회”하는 방식보다 훨씬 실무적이야.

피그마에 이렇게 말하면 됨

아래 문구로 전달하면 꽤 깔끔해:

네, 원인 분석은 정확합니다.
다만 transformText에서 <a> 태그만 따로 보존하는 방식보다는, 본문 HTML 자체를 strip하지 않고 원본 그대로 유지한 뒤, TextDetail.tsx에서 sanitize 후 dangerouslySetInnerHTML로 렌더링하는 방향이 더 적절합니다.

이유는 워드프레스 본문이 링크뿐 아니라 <p>, <br>, <strong>, <em>, 리스트 등의 기본 구조를 함께 포함하기 때문입니다. <a>만 보존하고 나머지를 제거하면 링크는 살아도 문단 구조와 가독성이 깨질 수 있습니다.

따라서 권장 방향은 아래와 같습니다.

wp-api.ts의 transformText에서는 정규식으로 HTML을 제거하지 않고 원본 HTML을 유지

TextDetail.tsx에서는 sanitize 적용 후 dangerouslySetInnerHTML로 렌더

sanitize 허용 태그는 최소한 a, p, br, strong, em, ul, ol, li, blockquote 정도 포함

외부 링크에는 target="_blank"와 rel="noopener noreferrer"를 자동 부여

이 방식이면 링크 문제뿐 아니라 워드프레스 본문의 기본 포맷도 안정적으로 유지할 수 있습니다. 이 방향으로 수정 부탁드립니다.