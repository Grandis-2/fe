---
type: architecture
title: Feature-Sliced Design 디렉터리 구조
description: src/ 하위 FSD 레이어별 현재 슬라이스와 세그먼트 구성, 레이어 별칭(@app~@shared)과 슬라이스 내부 상대경로 규칙, 페이지 평면 구조와 admin-* 이전 구조, eslint가 강제하는 레이어 의존 방향과 DTO import 제한을 설명한다.
tags: [architecture, fsd, directory-structure, eslint, frontend]
verified:
  - by: openwiki/0.5.0
    at: 2026-10-04T09:44:53.662Z
sources:
  - id: openwiki-source-276795f6d5ad19adb078c64e
    resource: repo://eslint.config.js
  - id: openwiki-source-a52b9019d30f194703418d40
    resource: repo://src/app/router/index.tsx
  - id: openwiki-source-d776cca5236e216ba85991fa
    resource: repo://src/entities/product/index.ts
  - id: openwiki-source-7825d23bf521e75974c7ccfa
    resource: repo://src/entities/product/ui/ProductCard/index.ts
  - id: openwiki-source-95bfccfd0c712f6e72040e0d
    resource: repo://src/main.tsx
  - id: openwiki-source-7d18c8aa6451f1aaf4d23dd3
    resource: repo://src/pages/admin-products/index.ts
  - id: openwiki-source-0675b164c342842e703afafc
    resource: repo://src/shared/api/client.ts
  - id: openwiki-source-3ced966c42818e53e028cadd
    resource: repo://src/shared/config/routes.ts
  - id: openwiki-source-e1b64eb4637c8d767ed766a5
    resource: repo://src/shared/model/modalStore.ts
  - id: openwiki-source-c3381dae54734e5ca45fca54
    resource: repo://src/shared/model/toastStore.ts
  - id: openwiki-source-9745756b2be49dfe2491129c
    resource: repo://src/shared/ui/Box/Box.tsx
  - id: openwiki-source-1e4537c3eaa8f33a608e1699
    resource: repo://src/shared/ui/Container/Container.tsx
  - id: openwiki-source-d131a7da28ef0d717bef8452
    resource: repo://src/shared/ui/index.ts
  - id: openwiki-source-81cf84df6b5988f0684554d1
    resource: repo://tsconfig.app.json
  - id: openwiki-source-5e1b077422a94ae165e88e4e
    resource: repo://vite.config.ts
generated: { by: 'claude-code', at: '2026-10-04T09:44:53.662Z' }
---

## 개요

`src/`는 Feature-Sliced Design(FSD) 레이어로 구성된다.

```
app → pages → widgets → features → entities → shared
```

상위 레이어만 하위 레이어를 import할 수 있다. `src/main.tsx`는 레이어 밖의 부트스트랩 파일로,
MSW 목 워커를 먼저 기다린 뒤(`startMockWorker`) 세션 복구(`initAuth`)를 시작하고
`QueryClientProvider` + `RouterProvider`를 `StrictMode`로 렌더한다.

## import 경로 규칙

- **슬라이스 밖**은 레이어 별칭을 쓴다 — `@app/*`, `@pages/*`, `@widgets/*`, `@features/*`,
  `@entities/*`, `@shared/*`. 별칭은 `tsconfig.app.json`의 `paths`와 `vite.config.ts`의
  `resolve.alias`에 같이 정의돼 있어 둘을 함께 고쳐야 한다. `src` 전체를 가리키는 `@/` 별칭은 없다.
- **슬라이스 안**은 상대경로를 쓴다(`./Modal.css`, `../model/types`). 슬라이스 안에서 자기 배럴을
  import하면 `index.ts` → 컴포넌트 → `index.ts` 순환이 생기기 때문이다.
- ESLint `import-x/order`는 `react` → 외부 패키지 → 레이어 별칭(`internal` 그룹) → 상대경로 →
  타입 import 순서와 그룹 사이 빈 줄을 강제한다.

## 의존 방향은 eslint로 강제된다

`eslint.config.js`의 `import-x/no-restricted-paths`(error)가 레이어별 `zones`를 정의한다.
`shared`는 다른 어떤 레이어도, `entities`는 `features/widgets/pages/app`을, `features`는
`widgets/pages/app`을, `widgets`는 `pages/app`을, `pages`는 `app`을 import할 수 없다.

같은 규칙에 **DTO 경계**도 들어 있다. `src/shared/api/types/**`(서버 DTO)는 `app`/`pages`/
`widgets`/`features`와 `entities/*/ui`에서 import할 수 없고, 위반하면 "DTO는 entities/*/api에서
모델로 변환하고, 엔티티 배럴의 모델 타입을 쓴다"는 메시지가 뜬다. 즉 DTO를 볼 수 있는 곳은
`shared` 자신과 `entities/*/api`, `entities/*/model`뿐이다. 자세한 흐름은
[데이터 레이어](data-layer.md) 참고.

같은 레이어끼리(엔티티 ↔ 엔티티, 위젯 ↔ 위젯)의 import는 이 규칙으로 막히지 않는다.

## 레이어별 현재 상태

### app

- `router/index.tsx` — `createBrowserRouter` 라우트 트리([라우팅과 레이아웃 구성](routing.md)).
- `layouts/` — `RootLayout`, `MainLayout`, `AdminLayout`, 로그인 게이트 `RequireLogin`.
- `queryClient.ts` — `shared/api/queryPolicy`의 기본값으로 만든 TanStack Query 클라이언트.
- `styles/index.css` — 전역 리셋.

### pages

라우트 하나에 대응하는 조립만 한다. 사용자 화면 페이지는 **평평한 구조**다 —
`pages/<name>/XxxPage.tsx`(+`.css.ts`)만 두고 `ui/`나 `index.ts`를 만들지 않으며, 라우터가
`@pages/main/MainPage`처럼 파일을 직접 import한다. 현재 `main`, `search`, `product-detail`,
`preorder`, `preorder-detail`, `reviews`, `signup`, `kakao-callback`, `mypage`, `payment`,
`payment-callback`, `result`, `not-found`가 이 구조다.

관리자 페이지(`admin-home`, `admin-products`, `admin-product-new`, `admin-product-detail`,
`admin-reservations`, `admin-promotions`, `admin-promotion-new`, `admin-promotion-edit`,
`admin-placeholder`)는 아직 **이전 구조**(`ui/` + `index.ts` 배럴)다.

### widgets

여러 기능을 묶은 화면 블록이다.

- 공통 레이아웃: `header`(+`HeaderSearch`), `category-nav`, `mobile-tab-bar`, `banner`
- 상품·결과: `product-page-tab`, `product-purchase-bar`, `result-hero`
- 마이페이지: `mypage-menu`, `mypage-cart`, `mypage-address`, `mypage-history`, `mypage-preorder`
- 관리자: `admin-sidebar`, `admin-breadcrumb`, `admin-product-form`, `admin-promotion-form`,
  `admin-dispatch-windows`

컴포넌트가 하나인 위젯은 `ui/` 바로 아래에 파일을 두고(`header/ui/Header.tsx`), 여럿인 위젯은
컴포넌트별 폴더를 만든다(`admin-product-form/ui/AdminProductForm/`, `ColorOptionEditor/` 등).

### features

사용자 행동 단위이며, 이름은 기술명이 아니라 기능명이다(`login`이지 `kakao-login`이 아니다).

- `login` — 카카오 로그인 모달·콜백·로그인 요구 훅
- `payment` — 토스페이먼츠 결제창 호출
- `product-purchase` — 옵션·수량·가격 계산과 구매 요약 UI
- `product-gallery` — 상품 이미지 슬라이더 + 미리보기
- `product-card-select` — 카드 목록의 선택 상태
- `preorder-queue` — 사전예약 대기열
- `address-search` — 다음 우편번호 검색 + 주소 입력 필드
- `terms-agreement` — 약관 동의 UI

### entities

도메인 슬라이스다. 세그먼트는 `api/`(조회 함수, DTO→모델 매퍼, TanStack Query 훅), `model/`(타입·
상수·스토어 — 훅은 두지 않는다), `ui/`(컴포넌트)로 나뉜다.

- 사용자 도메인: `product`, `preorder`, `order`, `review`, `cart`, `payment`, `address`, `profile`,
  `notification`, `auth`
- 관리자 도메인: `admin-product`, `admin-reservation`, `admin-promotion`

각 엔티티의 `index.ts` 배럴이 바깥으로 나가는 문이다 — 예를 들어 `entities/product`는
`ProductCard`, `getProduct`/`useProduct`, 모델 타입 `Product`, 카드 검색 훅 등을 내보낸다.

`ui/` 안의 컴포넌트는 **컴포넌트별 폴더** 패턴을 따른다 — `ui/ProductCard/{ProductCard.tsx,
ProductCard.css.ts, ProductCard.stories.tsx, index.ts}`. `index.ts`가 `export *`만 하므로 엔티티
배럴의 `from './ui/ProductCard'` 경로가 그대로 유지된다.

### shared

- `api/` — axios 클라이언트(`client.ts`), Query 정책(`queryPolicy.ts`), 서버 DTO 타입(`types/`),
  MSW 목(`mock/`). [데이터 레이어](data-layer.md), [MSW 목 서버](mock-api.md) 참고.
- `ui/` — 범용 UI 프리미티브. 모두 컴포넌트별 폴더 패턴이고 `index.ts` 배럴로 공개된다.
  [shared/ui 컴포넌트 라이브러리](shared-ui.md) 참고.
- `config/` — `theme/`(디자인 토큰, [디자인 시스템](design-system.md))과 `routes.ts`(경로 상수·생성 함수).
- `model/` — 앱 전역 UI 스토어(`modalStore`, `toastStore`).
- `lib/` — 범용 훅과 유틸(`useCountdown`, `useFormFields`, `useObjectUrls`, `usePopoverAnchor`,
  `createStore`, `formatNumber`, `parseDateOnly`, `simplexNoise`).
- `assets/` — 번들에 포함되는 이미지.

`shared/ui`의 `Container`와 `Box`는 이름이 비슷하지만 역할이 다르다. `Container`는 페이지 콘텐츠의
표준 레이아웃 계약(모바일 전체 폭, 데스크톱 max-width 1200px, 가운데 정렬)을 강제하고 padding 네
값만 prop으로 덮어쓰게 한다(기본 데스크톱 30/50, 모바일 16/24). `Box`는 sprinkles 속성을 `sx`
prop으로 받는 범용 `div` 래퍼다.

## 관련

- [라우팅과 레이아웃 구성](routing.md)
- [데이터 레이어: API 클라이언트와 서버 상태](data-layer.md)
- [디자인 토큰과 vanilla-extract 스타일 시스템](design-system.md)
- [shared/ui 컴포넌트 라이브러리](shared-ui.md)
