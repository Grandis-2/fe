---
type: feature
title: 메인 페이지 히어로와 상품 캐러셀
description: MainPage의 구성(헤더 아래로 끌어올린 배너, 어두운 히어로의 베스트 상품 무한 오토스크롤 캐러셀, 추천 상품 그리드), embla-carousel loop 구현에서 겪은 세 가지 제약, 상품 카드 조회와 로딩·에러·빈 상태 처리, 현재 비활성화된 SwirlBackground를 설명한다.
tags: [feature, main-page, carousel, embla, banner]
verified:
  - by: openwiki/0.5.0
    at: 2026-10-04T09:44:53.662Z
sources:
  - id: openwiki-source-2a5ae9df987bcaa9d57a6001
    resource: repo://src/entities/product/api/useProductCards.ts
  - id: openwiki-source-62e30b9db993329b89f7a348
    resource: repo://src/features/product-card-select/lib/useProductCardSelection.ts
  - id: openwiki-source-3807b0573913d4bd2afb881a
    resource: repo://src/pages/main/MainPage.css.ts
  - id: openwiki-source-9b47a6acae14d12e2ae83197
    resource: repo://src/pages/main/MainPage.tsx
  - id: openwiki-source-106882e9cc35fe9cd43bb118
    resource: repo://src/shared/ui/SwirlBackground/SwirlBackground.css.ts
  - id: openwiki-source-1cd6e8b1b508a390e34f873a
    resource: repo://src/shared/ui/SwirlBackground/SwirlBackground.tsx
  - id: openwiki-source-a4710b2958bc4515bbcbb9b3
    resource: repo://src/widgets/banner/ui/Banner.tsx
generated: { by: 'claude-code', at: '2026-10-04T09:44:53.662Z' }
---

## 개요

`src/pages/main/MainPage.tsx`(`/`)는 위에서부터 세 구간으로 조립된다.

1. **배너**(`widgets/banner`) — 헤더 아래가 아니라 헤더 뒤로 끌어올린 어두운 배너.
2. **히어로** — 어두운 배경 위 "베스트 상품을 만나보세요" 제목과 베스트 상품 무한 오토스크롤 캐러셀.
3. **추천 상품** — `Container` 안의 카드 그리드.

배너와 히어로는 `data-header-theme="dark"`를 달아, 헤더가 그 위에 있는 동안 흰 글자로 바뀌게 한다.
캐러셀 영역은 흰 카드가 대부분을 덮어 `"light"`로 표시한다([라우팅](../architecture/routing.md)의
`useHeaderTheme` 참고). 메인 페이지에서만 헤더가 sticky라, `bannerOverlap`이 `headerHeight`만큼 음수
`marginTop`을 줘서 배너를 헤더 뒤로 끌어올린다.

## 배너

`widgets/banner`의 `Banner`는 슬라이드 3장(사전예약 2건, 구매후기)을 상수로 갖는다(배너 API가 아직 없다).
자동 넘김 타이머가 따로 없고, 진행 바 CSS 애니메이션이 끝나는 순간(`onAnimationEnd`)에 다음 슬라이드로
넘어간다. 탭을 누르면 `key`가 바뀌어 애니메이션이 처음부터 다시 돌고, 텍스트도 `key`로 다시 마운트해
슬라이드마다 페이드인한다.

## 상품 조회와 상태 문구

두 목록 모두 `entities/product`의 `useProductCards(query)`(`catalog` 정책, 키
`['products', 'cards', query]`)로 받는다 — `'best'`, `'recommend'`. 각 구간은 캐러셀/그리드 자리에
상태 문구를 대신 채운다.

| 상태            | 베스트                            | 추천                            |
| --------------- | --------------------------------- | ------------------------------- |
| 로딩            | 불러오는 중이에요.                | 불러오는 중이에요.              |
| 에러(재시도 후) | 베스트 상품을 불러오지 못했어요.  | 추천 상품을 불러오지 못했어요.  |
| 0건             | 아직 등록된 베스트 상품이 없어요. | 아직 등록된 추천 상품이 없어요. |

문구는 `InlineAlert`로 보이고, 에러일 때만 `status="error"`, 나머지는 `info`다. `?mock=500`으로 에러
상태를 볼 수 있다([MSW 목 서버](../architecture/mock-api.md)).

카드의 색상·옵션 선택 상태는 `features/product-card-select`의 `useProductCardSelection()`이 상품 id별
맵으로 들고, `getCardProps(product)`를 `<ProductCard>`에 펼친다. 두 목록이 같은 선택 상태를 공유한다.

## embla 무한 오토스크롤: 세 가지 제약

캐러셀은 `useEmblaCarousel({ loop: true, dragFree: true, align: 'start' }, [AutoScroll({ speed: 1,
stopOnInteraction: false })])`로 만든다.

1. **슬라이드 컨테이너에 `width`를 주지 않는다** — Embla의 `canLoop()`은 컨테이너 박스 폭이 슬라이드 합계
   폭보다 충분히 작아야(≈ 뷰포트) 통과한다. `width: 'max-content'`를 주면 판정이 항상 실패해 `loop`가 조용히
   꺼지고 오토스크롤도 멈춘다. `width: auto`로 부모 폭만큼만 잡히게 둔다.
2. **flex `gap`은 마지막↔첫 슬라이드 사이에 없다** — 그 이음매에서 간격이 튀므로 마지막 슬라이드에 `gap`과
   같은 `marginRight`(24px)를 준다.
3. **`AutoScroll`에는 `dragFree: true`** — 없으면 스냅포인트마다 멈칫하며 들러붙는다.

여기에 더해, 상품 수가 적으면 loop가 이음매에서 "loop fallback"으로 점프해 튀어 보여서, 베스트 상품
배열을 **4번 반복**(`BEST_CAROUSEL_BUFFER`)해 슬라이드를 채운다. 뷰포트는 폭 80%이고 좌우 5%를 마스크로
흐리게 처리한다. 모바일에서는 카드 최소 폭이 풀리므로 슬라이드 폭을 230px로 직접 준다.

## 추천 상품 그리드

`Container` 안에서 제목은 `typography.title.xlSemibold`와 `styles.recommendedTitle`을 클래스 수준에서 합치고,
그리드는 데스크톱에서 `repeat(auto-fit, minmax(230px, 1fr))`, 모바일에서 2열이다.

## SwirlBackground (현재 비활성)

`shared/ui/SwirlBackground`는 Codrops "Swirl" 데모를 옮긴 파티클 캔버스 배경이다. 컨테이너에 DOM API로
캔버스 두 장을 만들어 그리고, 리사이즈 때 컨테이너의 `clientWidth`/`clientHeight`를 읽어 맞추므로 부모 크기가
곧 애니메이션 영역이다(`position: absolute; inset: 0; z-index: -1`). 히어로가 `position: relative; z-index: 0`으로
스택킹 컨텍스트를 여는 이유도 이것이다. 다만 현재 `MainPage`에서는 `<SwirlBackground />`가 주석 처리돼 있고,
히어로는 어두운 배경 + 오른쪽 아래 은은한 radial gradient만 쓴다.

## 관련

- [상품 카탈로그와 탐색](product-catalog.md) — `ProductCard`와 카드 데이터 변환
- [데이터 레이어: API 클라이언트와 서버 상태](../architecture/data-layer.md) — `catalog` 정책과 재시도
- [라우팅과 레이아웃 구성](../architecture/routing.md) — 헤더 sticky·글자색 반전
