About.tsx, AppContent.tsx, theme.css는 건드리지 말고 먼저 Header.tsx만 수정 범위로 잡아.

이유는 이미 분석상 문제의 중심이 Header고, 나머지는 건드릴수록 범위가 커져.

2단계

Header.tsx 안에서 먼저 모바일 About 전용 조건값 하나만 만들기.

필요한 조건은 딱 두 개야.

currentView === 'about'

모바일 < 768

즉 개념상 이런 상태를 만들면 돼:

isAboutPage

isMobile

isMobileAbout

핵심은 반드시 isMobileAbout 하나로만 예외 처리하는 거야.

3단계

그 다음 Header의 스타일 시스템을 둘로 나눠.

기본 상태

기존 그대로 유지

mix-blend-difference

transparent

text-white

기존 underline / separator

예외 상태: 모바일 About만

mix-blend-difference 제거

background는 solid

텍스트는 text-foreground

separator / underline도 foreground 계열

하단 fade overlay 추가

즉 “기존 헤더를 바꾸는 것”이 아니라
모바일 About일 때만 헤더 스킨을 교체하는 방식이야.

4단계

특히 Header.tsx에서 아래 3곳을 같이 봐야 해.

A. <header> wrapper

지금은 항상 transparent + blend야.
이걸 모바일 About일 때만 예외 처리.

B. 내부 색상 변수

지금은 전부 white 계열이라서,
모바일 About일 때는 여기서 같이 바꿔야 해.

예:

baseColor

inactiveColor

hoverColor

borderColor

separatorColor

C. Context Indicator

아래쪽 fixed indicator도 별도 레이어라서
모바일 About일 때는 이것도 같은 논리로 처리하거나 숨김/유지 여부를 같이 정해야 해.

이걸 빼먹으면 메인 헤더만 맞고 보조 라벨이 또 이상해질 수 있어.

5단계

그 다음에만 About.tsx에서 모바일 상단 여백 소폭 증가를 적용해.

이건 메인 수정이 아니라 마지막 미세보정이야.

현재 pt-28인 모바일 콘텐츠 시작점을
필요하면 pt-32로 올리는 정도만.

6단계

검수는 꼭 4개 breakpoint/view 조합으로 해.

모바일 About

모바일 Work

태블릿 About

데스크탑 About

특히 확인할 건 이거야.

모바일 About

헤더 뒤 겹침 사라졌는지

헤더가 종이 레이어처럼 보이는지

모바일 Work/Text

기존 헤더 감성 유지되는지

태블릿/데스크탑 About

이전과 완전히 동일한지

헤더 안 사라지는지

가장 중요한 원칙

이번 수정은 Header.tsx 한 파일 안에서만 해결해야 해.

왜냐하면 지금 구조상:

Header는 전역 공통

문제는 헤더의 예외 처리

About는 배경 콘텐츠일 뿐

이라서, 다른 파일까지 건드리면 다시 범위가 번질 가능성이 커.

추천 작업 순서

백업 복원

Header.tsx에 isMobileAbout 조건만 추가

header wrapper / color system / context indicator 분기

모바일 About 확인

마지막에만 About.tsx의 pt 미세 조정