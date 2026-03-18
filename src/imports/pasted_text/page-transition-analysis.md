응, 분석 내용상 원인 파악이 거의 맞아.
네가 느끼는 “클릭할 때마다 스크롤이 움직이는 느낌”은 사실상 아래 두 개가 겹쳐서 생기는 거야.

핵심 결론
1. 제일 큰 원인

PageTransition의

initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -20 }}

이게 페이지 자체를 아래에서 위로 미는 모션이라서, 사용자는 이걸 스크롤 이동처럼 느껴.

특히 모바일에서는 더 심해.
화면이 작고, 실제 스크롤도 자주 쓰니까 y: 20 -> 0 같은 이동은 거의 무조건
“페이지가 올라왔다”처럼 보임.

2. 보조 원인

exit 동안 기존 페이지가 아직 살아 있고 scroll 위치도 그대로라서,
긴 페이지 중간에서 다른 페이지로 가면 브라우저 레이아웃 변화 + clamp + scrollTo 처리 타이밍 때문에
한 프레임 정도 불안정하게 보일 수 있어.

하지만 네 설명 기준으로는 ①이 메인 원인이 맞다.

네가 원하는 UX로 바꾸려면

네 요구사항은 정확히 이거지:

페이지 클릭 시 즉각적으로 전환

스크롤이 이동하는 느낌이 없어야 함

단, BACK 시에는 이전 스크롤 위치 복원 유지

그럼 답은 비교적 명확해.

권장 방향
A. 일반 페이지 전환에서는 y 이동을 없애기

지금 가장 먼저 해야 하는 건 이거야.

기존:

initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -20 }}

권장:

initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}

또는 아예 더 즉각적으로:

initial={false}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}

이렇게 하면 스크롤되는 느낌의 80~90%는 바로 사라질 가능성이 커.

B. duration도 줄여야 함

지금 0.8초는 페이지 전환용으로 꽤 길어.
네가 원하는 건 “즉각적” 느낌이니까:

transition={{ duration: 0.18, ease: "easeOut" }}

정도로 줄이는 게 좋아.

조금 더 또렷하게 하려면:

transition={{ duration: 0.12 }}

사실 네 취향이면 0.12 ~ 0.2초가 맞아.

C. mode="wait"도 체감상 느리게 만듦

AnimatePresence mode="wait"는
이전 페이지 exit가 끝날 때까지 새 페이지를 안 띄우는 구조라서
“클릭했는데 잠깐 늦게 바뀌는 느낌”을 줘.

네가 즉각성을 원하면 이 부분도 다시 봐야 해.

선택지 1: 유지

BACK 복원 안정성 때문에 유지 가능.
대신 transition을 아주 짧게 만들면 체감이 훨씬 좋아짐.

선택지 2: 제거 또는 기본 모드

즉각성은 좋아지지만, 현재 구조에서는 복원 타이밍을 다시 만져야 할 수 있음.

현실적인 추천은:
처음엔 mode="wait"는 유지하고,
대신 y 제거 + duration 축소부터 적용.

그것만으로도 많이 개선될 가능성이 큼.

네 상황에서 제일 좋은 수정안
1. 일반 전환은 fade only
const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15, ease: "easeOut" }
};

이렇게.

2. BACK 복원 로직은 그대로 유지

이건 건드리지 않는 게 맞아.

네가 정리한 흐름상,
Work Detail -> Work Grid 복원은 현재 구조상 꽤 잘 설계돼 있어:

saved scroll 저장

spacer height 확보

rAF로 scrollTo

mount 직전/직후 복원

이건 유지해야 해.

즉:

일반 이동: 맨 위로 즉시 전환

BACK: 저장된 위치 복원

이 두 개를 분리해서 생각해야 함.

3. 일반 이동에서 scroll은 가능한 한 빨리 0으로 고정

지금은 exit 끝나고 새 페이지 mount 시점에 scrollTo(0, 0)가 들어가는 구조라서
한 박자 늦게 느껴질 수 있어.

그래서 일반 이동일 때는, hashchange 직후 혹은 view 변경 직후에
빠르게 top으로 보내는 것도 방법이야.

예:

if (!isRestoringScrollRef.current) {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

다만 이건 시점이 중요해.
너무 빨리 하면 기존 페이지가 갑자기 위로 튈 수 있어.

그래서 안전하게는:

PageTransition의 y 제거

fade only

새 페이지 mount 시 layout effect로 scrollTo(0,0)

이 조합부터 적용해보고,
여전히 미세한 흔들림이 있으면 그때 일반 이동 시점의 scroll reset 타이밍을 앞당기는 게 좋음.

가장 중요한 판단
네가 진짜 원하는 게 “즉각적”이면

사실 페이지 전환 애니메이션 자체를 거의 없애는 게 맞아.

가장 추천
initial={false}
animate={{ opacity: 1 }}
exit={{ opacity: 1 }}
transition={{ duration: 0 }}

사실상 애니메이션 없음.

이 경우:

클릭 즉시 전환

스크롤 움직임처럼 느껴질 요소 제거

BACK 복원 로직만 따로 유지 가능

내가 추천하는 우선순위
1차 수정

가장 먼저 이것만 해봐.

initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.15, ease: "easeOut" }}

이유:

구조 거의 안 건드림

BACK 복원 유지 가능

“올라가는 느낌” 대부분 제거

2차 수정

그래도 미묘하게 이동감이 있으면:

mode="wait" 재검토

일반 이동 시 scroll reset 시점 앞당기기

3차 수정

정말 즉각적이어야 하면:

페이지 전환 애니메이션 제거

BACK 복원만 남김

피그마/개발자에게 전달할 문구

이대로 보내면 돼:

현재 “페이지가 이동할 때 스크롤이 올라가는 느낌”의 가장 큰 원인은 PageTransition의 y: 20 -> 0 / y: 0 -> -20 슬라이드 애니메이션으로 보입니다. 사용자는 이 수직 이동을 실제 스크롤 이동처럼 인식하게 됩니다.

제가 원하는 동작은 다음과 같습니다.

일반 페이지 전환(Work, About, Text, Detail 진입)은 스크롤 이동처럼 보이지 않고 즉각적으로 전환될 것

단, BACK 클릭 시에는 이전 페이지의 스크롤 위치 복원 기능은 그대로 유지할 것

따라서 우선 아래처럼 수정해주세요.

PageTransition에서 y 값을 제거하고 opacity만 사용

transition duration은 0.12~0.18초 정도로 매우 짧게 조정

AnimatePresence mode="wait"는 우선 유지하되, 체감이 여전히 느리면 이후 재검토

일반 페이지 전환 시에는 최상단 표시, BACK 복원 시에만 저장된 scroll position 사용

예시:

initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.15, ease: "easeOut" }}

핵심은 “일반 이동은 즉각적이고 정지된 느낌”, “BACK만 이전 스크롤 위치 복원”입니다