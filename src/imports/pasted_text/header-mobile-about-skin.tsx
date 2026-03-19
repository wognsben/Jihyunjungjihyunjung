핵심은:
모바일 About일 때만 헤더 스킨을 바꾸고, 나머지는 100% 기존 유지야.

1. 먼저 Header.tsx에 모바일 감지 추가

지금 Header.tsx 상단은:

import { useState, useEffect } from 'react';

여기에 이미 있는 훅만 써도 되지만, 너 프로젝트엔 use-mobile.ts가 있으니까
그걸 쓰는 게 제일 안전해.

즉 import 쪽에:

import { useIsMobile } from '@/hooks/use-mobile';

를 추가하는 방향이 좋아.

그리고 컴포넌트 안에서:

const isMobile = useIsMobile();
const isMobileAbout = currentView === 'about' && isMobile;

이 두 줄이 핵심이야.

2. 헤더 컬러 시스템을 isMobileAbout 기준으로 분기

지금은 전부 white 기준이지:

const baseColor = 'text-white'; 
const inactiveColor = 'text-white/60';
const hoverColor = 'hover:text-white';
const borderColor = 'bg-white';
const separatorColor = 'text-white/30';

이걸 이렇게 분기하면 돼:

const baseColor = isMobileAbout ? 'text-foreground' : 'text-white';
const inactiveColor = isMobileAbout ? 'text-foreground/60' : 'text-white/60';
const hoverColor = isMobileAbout ? 'hover:text-foreground' : 'hover:text-white';
const borderColor = isMobileAbout ? 'bg-foreground' : 'bg-white';
const separatorColor = isMobileAbout ? 'text-foreground/30' : 'text-white/30';

이렇게 해야 SplitTextLink까지 같이 안전하게 바뀌어.

3. <header> wrapper를 모바일 About일 때만 solid layer로 바꾸기

지금은:

<header 
  className={`
    fixed top-0 left-0 right-0 z-[9999999] mix-blend-difference pointer-events-none
    transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]
    ${isVisible ? 'translate-y-0' : '-translate-y-full'}
  `}
  style={{
    backgroundColor: 'transparent',
    borderBottom: 'none',
  }}
>

이 구조잖아.

이걸 개념적으로 이렇게 바꾸면 돼:

<header
  className={`
    fixed top-0 left-0 right-0 z-[9999999] pointer-events-none
    transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]
    ${isMobileAbout ? '' : 'mix-blend-difference'}
    ${isVisible ? 'translate-y-0' : '-translate-y-full'}
  `}
  style={{
    backgroundColor: isMobileAbout ? 'var(--background)' : 'transparent',
    borderBottom: 'none',
  }}
>

중요한 건 이거야:

mix-blend-difference는 모바일 About일 때만 제거

backgroundColor도 모바일 About일 때만 solid

나머지는 기존 유지

4. 헤더 내부 텍스트 색도 같이 분기

지금 내부 wrapper가:

<div className="px-6 md:px-12 py-4 md:py-6 text-white pointer-events-auto relative z-[9999999]">

이렇게 고정 white야.

이것도 바꿔야 해:

<div
  className={`px-6 md:px-12 py-4 md:py-6 pointer-events-auto relative z-[9999999] ${
    isMobileAbout ? 'text-foreground' : 'text-white'
  }`}
>

안 그러면 wrapper는 계속 white system으로 남아 있어서
안쪽이 또 안 보일 수 있어.

5. 언어 버튼도 isMobileAbout 기준으로 같이 분기

지금은:

className={`text-[10px] md:text-xs uppercase tracking-[0.1em] transition-all font-light cursor-pointer select-none p-2 -m-2 ${
  lang === language.code 
    ? 'text-white' 
    : 'text-white/50 hover:text-white'
}`}

이걸 바꿔야 해.

예를 들면:

className={`text-[10px] md:text-xs uppercase tracking-[0.1em] transition-all font-light cursor-pointer select-none p-2 -m-2 ${
  lang === language.code
    ? (isMobileAbout ? 'text-foreground' : 'text-white')
    : (isMobileAbout ? 'text-foreground/50 hover:text-foreground' : 'text-white/50 hover:text-white')
}`}

이 부분 빼먹으면 헤더 일부만 어색해져.

6. 모바일 About일 때만 하단 fade overlay 추가

이게 중요해.
근데 background로 넣지 말고 별도 레이어로 넣어야 해.

헤더 내부 마지막 쯤에 이걸 넣는 구조가 좋아:

{isMobileAbout && (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute left-0 right-0 bottom-[-12px] h-3"
    style={{
      background: 'linear-gradient(to bottom, var(--background) 0%, transparent 100%)',
    }}
  />
)}

포인트는:

absolute

bottom-[-12px]

h-3

pointer-events-none

즉 헤더 본체 아래로 아주 얇게 내려오게.

이게 있어야 “종이 조각 아래 가장자리만 살짝 녹는 느낌”이 나.

7. Context Indicator도 같이 조건 분기해야 함

아래 이 부분:

<div 
  className={`
    fixed top-0 left-0 z-40 px-6 md:px-12 py-4 md:py-6 mix-blend-difference pointer-events-none
    transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-100
    ${!isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
  `}
>

이것도 최소한 mix-blend-difference를 조건 분기해야 해.

개념상 이렇게:

<div
  className={`
    fixed top-0 left-0 z-40 px-6 md:px-12 py-4 md:py-6 pointer-events-none
    transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-100
    ${isMobileAbout ? '' : 'mix-blend-difference'}
    ${!isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
  `}
>

그리고 내부 점/텍스트도 white 고정이면 모바일 About에서 안 보일 수 있으니 같이 분기해야 해.

예:

<div className={`w-[3px] h-[3px] rounded-none ${isMobileAbout ? 'bg-foreground' : 'bg-white'}`} />
<span className={`${isMobileAbout ? 'text-foreground' : 'text-white'} ...`}>
8. About.tsx는 마지막에만 아주 조금 수정

이건 지금 당장 필수는 아니고, 헤더 적용 후 보고 결정해도 돼.

현재:

className="... pt-28 md:pt-32 ..."

모바일에서만 조금 더 여유 주고 싶으면:

className="... pt-32 md:pt-32 ..."

정도로만.

근데 헤더가 제대로 마스킹되면 이건 없어도 버틸 수 있어.
즉 1순위는 Header, 2순위가 About pt야.

9. 네가 개발자/피그마 메이크에 바로 줄 수 있는 핵심 지시

이렇게 말하면 돼:

Header.tsx에서 currentView === 'about' && isMobile 조건으로만 별도 헤더 스킨을 적용해주세요.
이 조건일 때만 mix-blend-difference를 제거하고, 헤더 배경을 var(--background) solid layer로 바꾸며, 내부 링크/언어 버튼/indicator 색상도 foreground 계열로 함께 전환해주세요.
또한 헤더 하단에는 background가 아닌 별도 absolute overlay 레이어로 12px gradient fade를 추가해주세요.
그 외 desktop/tablet 및 other views는 기존 헤더를 그대로 유지해야 합니다.

10. 가장 안전한 작업 순서

백업 복원

Header.tsx에 useIsMobile() + isMobileAbout 추가

header wrapper 분기

내부 color 변수 분기

언어 버튼 분기

context indicator 분기

fade overlay 추가

마지막에만 About.tsx pt 보정 검토

요약

이번 수정의 핵심은 이거 하나야:

Header.tsx 안에서 isMobileAbout 조건 하나로만 예외를 묶고, 그 안에서만 blend/background/text system을 한 세트로 바꾸는 것.