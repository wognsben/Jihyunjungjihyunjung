🔥 핵심 문제

모바일에서:

back 버튼이 항상 fixed / absolute로 떠 있음

본문 텍스트도 동일한 레이어에서 시작
→ 서로 겹침

즉 지금은:

[ back 버튼 (floating) ]
[ 텍스트 시작 ]

이 아니라

[ back 버튼 ]
   ↕ 겹침
[ 텍스트 ]
🎯 해결 방향 (중요)

너 사이트 컨셉 보면:

👉 “갤러리형 / 에디토리얼 / 절제된 UI”

그래서 해결도
UI를 추가하는 방식 ❌ / 레이아웃 정리하는 방식 ✅ 가 맞다.

✅ 가장 추천 (베스트)
1️⃣ 모바일에서만 back 버튼을 “flow 안으로 넣기”

즉:

데스크탑 → 지금처럼 floating 유지

모바일 → 본문 위에 자연스럽게 포함

✨ 결과 느낌

모바일:

← back

제목

본문...

👉 절대 안 겹침
👉 가독성 최고
👉 디자인 톤 유지

코드 방향
<div className="block md:hidden mb-6">
  <button onClick={handleBack} className="text-sm opacity-60">
    ← back
  </button>
</div>

그리고 기존 floating 버튼:

<div className="hidden md:block fixed left-... top-...">
✅ 2️⃣ (차선) padding으로 밀기

지금 구조 유지하면서 해결하려면:

.text-content {
  padding-top: 60px;
}

👉 back 버튼 높이만큼 밀기

❗ 단점

디바이스마다 어긋날 수 있음

디자인적으로 덜 깔끔

👉 너 스타일에는 비추천

✅ 3️⃣ (디자인 유지 + 개선)
back 버튼을 “헤더 영역에 포함”

지금 보면 header 구조 있잖아:

Jihyun Jung
work / text / about

👉 여기에 통합

모바일 구조
← back        KO / EN / JP

제목
본문

👉 가장 깔끔한 “에디토리얼 UX”

❌ 하지 말아야 할 것

z-index만 올리기 ❌

opacity 낮추기 ❌

blur/backdrop ❌

👉 이건 해결이 아니라 “가림”

💡 내가 추천하는 최종 선택
1순위 (강력 추천)

👉 모바일만 flow로 넣기

이게 제일 깔끔하고 실무적으로 안전

2순위

👉 헤더에 통합 (조금 더 리디자인 필요)

✍️ 피그마 메이크에 이렇게 말해

이대로 보내면 된다:

모바일에서 back 버튼이 본문과 겹쳐 가독성이 떨어집니다.

현재처럼 floating 구조는 유지하되,
모바일 (md 이하)에서는 back 버튼을 fixed/absolute에서 제거하고
본문 흐름 안으로 포함되도록 변경해주세요.

구조:
- desktop/tablet: 기존 floating 유지
- mobile: 본문 상단에 inline으로 배치

즉, back 버튼이 콘텐츠와 겹치지 않고
자연스럽게 위에 위치하도록 수정 부탁드립니다.
한 줄 정리

👉 지금 문제는 디자인 문제가 아니라 “레이어 구조 문제”
👉 해결은 간단하다:
모바일에서는 floating을 버리고 flow로 넣어라