---
type: architecture
title: 디자인 토큰과 vanilla-extract 스타일 시스템
description: shared/config/theme 아래의 color/typography/spacing/breakpoint/container/motion/shadow 토큰, 배럴이 공개하는 범위, sprinkles 반응형 유틸과 lineClamp 헬퍼, 폰트와 전역 리셋이 실제로 어떻게 쓰이는지 설명한다.
tags:
  [architecture, design-tokens, vanilla-extract, sprinkles, styling, frontend]
verified:
  - by: openwiki/0.5.0
    at: 2026-10-04T09:44:53.662Z
sources:
  - id: openwiki-source-c5a2ecd4ab5ca01116080973
    resource: repo://src/app/styles/index.css
  - id: openwiki-source-78ab8fda5442c3abe8a80e51
    resource: repo://src/entities/preorder/ui/PreorderCard/PreorderCard.css.ts
  - id: openwiki-source-2888db5bf0b7fa8a35fe6164
    resource: repo://src/shared/config/theme/fonts.ts
  - id: openwiki-source-180dbe3e59ccf9bf4f9ea9ad
    resource: repo://src/shared/config/theme/index.ts
  - id: openwiki-source-a2d17cc7a9c2e5a69a1bfd38
    resource: repo://src/shared/config/theme/mixins.ts
  - id: openwiki-source-52bc90a7f51011b21df8a8e3
    resource: repo://src/shared/config/theme/sprinkles.css.ts
  - id: openwiki-source-0be4609a25decb74f07c8bb9
    resource: repo://src/shared/config/theme/tokens/breakpoint.ts
  - id: openwiki-source-cb18dcc3ecd805fce57e1b7d
    resource: repo://src/shared/config/theme/tokens/color/semantic.css.ts
  - id: openwiki-source-c511d4b4028e1d99563eace8
    resource: repo://src/shared/config/theme/tokens/container.ts
  - id: openwiki-source-c07b163d03be3a03c29718d8
    resource: repo://src/shared/config/theme/tokens/motion.ts
  - id: openwiki-source-184ddf041ee6943dadd21943
    resource: repo://src/shared/config/theme/tokens/shadow.ts
  - id: openwiki-source-a98df67ed90ead24e1d9402f
    resource: repo://src/shared/config/theme/tokens/spacing.ts
  - id: openwiki-source-60f66069b720e1c7eb394b69
    resource: repo://src/shared/config/theme/tokens/typography/base.ts
  - id: openwiki-source-c51830545b34d8e8a50cd75d
    resource: repo://src/shared/config/theme/tokens/typography/semantic.css.ts
  - id: openwiki-source-2b1a8d642451234580958c3b
    resource: repo://src/shared/ui/Modal/Modal.css.ts
  - id: openwiki-source-01d351a2f2e61cd54ceef5b0
    resource: repo://src/shared/ui/Toast/Toast.css.ts
  - id: openwiki-source-3d54e710eed3c4dbee708dcf
    resource: repo://src/widgets/banner/ui/Banner.css.ts
generated: { by: 'claude-code', at: '2026-10-04T09:44:53.662Z' }
---

## 개요

모든 스타일은 Vanilla Extract(`*.css.ts`)로 작성하고, 색·글꼴·간격 같은 값은
`src/shared/config/theme/`의 토큰에서 가져온다. 컴포넌트 `.css.ts`가 hex나 px를 직접 적는
경우는 토큰에 없는 값(시안에 묶인 그라데이션 중간 색 등)뿐이고, 그런 곳엔 이유를 주석으로 남긴다.

## 배럴이 공개하는 것

`src/shared/config/theme/index.ts`가 공개 API다. 컴포넌트는 이 배럴(`@shared/config/theme`)에서
가져온다.

| 이름                               | 출처                                | 비고                                    |
| ---------------------------------- | ----------------------------------- | --------------------------------------- |
| `color`                            | `tokens/color/semantic.css.ts`      | CSS 변수로 노출되는 전역 테마           |
| `spacing`                          | `tokens/spacing.ts`                 | px 스케일                               |
| `breakpoint`                       | `tokens/breakpoint.ts`              | `@media` 조건 문자열                    |
| `TAB_BAR_HEIGHT`, `TAB_BAR_OFFSET` | `tokens/container.ts`               | 모바일 하단 탭바 크기                   |
| `shadow`                           | `tokens/shadow.ts`                  | 그림자 3종                              |
| `typography`                       | `tokens/typography/semantic.css.ts` | 완성된 글꼴 스타일 클래스(네임스페이스) |
| `motion`                           | `tokens/motion.ts`                  | `duration`/`easing`(네임스페이스)       |
| `sprinkles`, `Sprinkles`           | `sprinkles.css.ts`                  | 반응형 유틸                             |
| `lineClamp`                        | `mixins.ts`                         | 말줄임 스타일 조각                      |

배럴을 import하면 `fonts.ts`도 함께 실행돼 Pretendard(서브셋)와 Audiowide 웹폰트 CSS가 로드된다.

배럴이 내보내지 않는 원시 토큰 — `tokens/typography/base`의 `fontSize`/`fontWeight` 등과
`tokens/container`의 `maxWidth` — 만 경로를 직접 적어 import한다. 실제로 코드베이스의 직접
import는 이 두 파일뿐이고, 대부분은 프리셋에 없는 글자 크기를 덮어쓰려고 `fontSize`를 가져오는
경우다.

## 색상

`tokens/color/semantic.css.ts` 한 파일이 `createGlobalTheme(':root', ...)`로 `color` 객체를
만든다. 값은 hex를 직접 담고, 이름은 용도 기준이다.

- `primary` / `secondary` — 브랜드 남색·보라 계열. 각각 `base`, `focus`, `subtle`, `subtler`,
  `subtlerHover`, `surface` 단계.
- `border` — `default`, `hover`, `subtle`, `focus`.
- `text` — `primary`, `secondary`, `tertiary`, `disabled`, `inverse`.
- `status` — `success`, `info`, `warning`, `danger`.
- `background` — `base`, `page`, `surface`, `subSurface`, `disabled`와 상태별 옅은 배경
  (`subtleSuccess` 등).
- `backgroundDark` — `base`, `surface` 두 값. 다크 테마용이 아니라 **어두운 면이 필요한 곳**에 쓰인다:
  토스트와 헤더 검색 패널 배경, 모달·카테고리 메뉴 뒤 반투명 딤(`color-mix`), 메인 페이지와 배너의
  어두운 배경. 앱 전체 다크 모드는 없다.

같은 파일에서 `globalStyle('body', { color: color.text.primary })`로 기본 글자색을 전역 지정하고,
다른 색이 필요한 곳만 개별 스타일에서 덮어쓴다.

## 타이포그래피

`tokens/typography/base.ts`는 원시 스케일만 담는다 — `fontFamily`(Pretendard, Audiowide),
`fontWeight`(400~700), `fontSize`(12·14·16·18·20·24·32px), `lineHeight`(1.3·1.4·1.5),
`letterSpacing`(0, -0.02em, -0.04em).

`tokens/typography/semantic.css.ts`는 이걸 조합해 바로 쓸 수 있는 스타일 클래스를 만든다:
`title.*`(xxlSemibold~smMedium), `display.time`, `navigation.tab`, `button.*`, `body.*`
(defaultRegular, sub, caption 등), `logo.wordmark`(Audiowide 로고 글꼴). 색은 들어 있지 않다.

조합 방식은 두 가지가 공존한다.

- **`.css.ts`에서 합성** — `style([typography.body.sub, { color: color.text.tertiary }])`. 가장 흔한
  방식이다. 프리셋에 없는 크기는 여기서 `fontSize[...]`로 덮어쓴다.
- **`.tsx`에서 클래스명 합치기** — `ProductCard`처럼 `[typography.body.sub, styles.modelNumber].join(' ')`.

## spacing / container / breakpoint / motion / shadow

- **`spacing`** — `0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 22, 24, 30, 32, 40, 50, 60, 70, 80, 90, 100`(px).
  padding/gap/margin은 정확히 맞는 스텝이 있으면 이걸 쓴다.
- **`container`** — `maxWidth`(`none`, `content` 1200px, `full` 100%)와 모바일 하단 플로팅 탭바용
  `TAB_BAR_HEIGHT`(60px), `TAB_BAR_OFFSET`(12px + iOS safe-area). 탭바 크기가 `shared/ui`의
  `BottomSheet`에서도 필요해 위젯이 아니라 여기 있다.
- **`breakpoint`** — `mobile` `(max-width: 743px)`, `desktop` `(min-width: 744px)`. 모바일 우선 설계의 기준.
- **`motion`** — `duration.fast` 150ms, `duration.normal` 220ms, `easing.default` `ease`,
  `easing.out` `cubic-bezier(0.23, 1, 0.32, 1)`. 모달 페이드·토스트 등장처럼 들어오는 움직임에
  `normal` + `out`을 쓴다.
- **`shadow`** — `sm`(살짝 뜬 요소), `md`(떠 있는 패널·팝오버·플로팅 바), `up`(아래에서 올라오는 시트).
  색은 `text.primary`(#1A1A1D)를 반투명하게 쓴다.

## sprinkles: 반응형이 실제로 필요할 때만

`sprinkles.css.ts`는 `mobile`/`desktop` 두 조건(둘 다 명시적 `@media`, 기본값 `mobile`)으로
`display`, `flexDirection`, `alignItems`, `justifyContent`, `flexWrap`, `gap`, `padding*`,
`margin*`(+`auto`), `maxWidth`, `fontSize`, `color`를 반응형 유틸로 노출한다. `color`는
`color.text.*`만 담은 `textColor` 맵이라, 타이포그래피 프리셋 + `sprinkles({ color })`만으로 색 있는
텍스트를 만들 수 있다. 관리자 화면을 제외한 pages/widgets의 레이아웃용이다.

브레이크포인트에 따라 안 바뀌는 값은 sprinkles가 아니라 plain `style()`에 둔다. 반응형 값도 대부분은
`.css.ts`의 `'@media': { [breakpoint.desktop]: {...} }`로 쓰고, `sprinkles()` 호출은 소수 파일에만 있다.

## lineClamp

`mixins.ts`의 `lineClamp(lines)`는 `-webkit-line-clamp` 기반 말줄임 스타일 객체를 돌려주는 유일한
헬퍼다. 고정값이 아니라 인자를 받는 스타일 조각이라 `tokens/`가 아닌 별도 파일에 있다.
`PreorderCard` 제목(2줄), `ProductCard` 이름(모바일 2줄), `ReviewCard` 본문(1줄)이 쓴다.

## 전역 CSS

`src/app/styles/index.css`는 Vite 템플릿의 기본 스타일을 주석으로 막아 두고, 실제로는
`* { margin: 0; padding: 0; box-sizing: border-box; }` 리셋과 `a`의 밑줄·색 초기화만 적용한다.

## 관련

- [shared/ui 컴포넌트 라이브러리](shared-ui.md) — 이 토큰으로 만든 프리미티브 컴포넌트
- [빌드 및 개발 도구 구성](tooling.md) — Vanilla Extract Vite 플러그인과 Storybook
- [상품 카탈로그와 탐색](../features/product-catalog.md) — 토큰을 조합하는 실제 컴포넌트 예
