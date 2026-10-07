---
type: feature
title: 상품 카탈로그와 탐색
description: entities/product의 모델·API·UI(ProductCard와 카드 데이터 변환, 색상 스와치, 옵션 선택, 결제 카드 variant)가 나누는 책임, 카드 목록 조회와 카드별 선택 상태, 헤더 메가 메뉴에서 검색 페이지로 이어지는 카테고리 탐색을 설명한다.
tags: [feature, product, catalog, search, category-nav]
verified:
  - by: openwiki/0.5.0
    at: 2026-10-04T09:44:53.662Z
sources:
  - id: openwiki-source-8d3e82ed1fc3dad448ddb8c0
    resource: repo://src/entities/product/api/searchProductCards.ts
  - id: openwiki-source-3596ae0deb83c212ecc9b1dc
    resource: repo://src/entities/product/api/useSearchProductCards.ts
  - id: openwiki-source-d776cca5236e216ba85991fa
    resource: repo://src/entities/product/index.ts
  - id: openwiki-source-53658e0977cb67181465a15b
    resource: repo://src/entities/product/ui/ProductCard/ProductCard.tsx
  - id: openwiki-source-1f98360d1e32ee0ad2cd8fb9
    resource: repo://src/entities/product/ui/ProductCard/toProductCardData.ts
  - id: openwiki-source-cc6e6776447ca864721deee9
    resource: repo://src/entities/product/ui/ProductColorSwatches/ProductColorSwatches.tsx
  - id: openwiki-source-fa12911d3200298e9428096c
    resource: repo://src/entities/product/ui/ProductOptionSelector/ProductOptionSelector.tsx
  - id: openwiki-source-da483db467471eaa7c1fc5fa
    resource: repo://src/entities/product/ui/ProductPaymentCard/ProductPaymentCard.tsx
  - id: openwiki-source-8194c2288602f84972a1ce3d
    resource: repo://src/entities/product/ui/ProductSummary/ProductSummary.tsx
  - id: openwiki-source-62e30b9db993329b89f7a348
    resource: repo://src/features/product-card-select/lib/useProductCardSelection.ts
  - id: openwiki-source-4f3633bceaf417b0078873af
    resource: repo://src/pages/search/SearchPage.tsx
  - id: openwiki-source-9e0abb3baec310a46cf18028
    resource: repo://src/widgets/category-nav/model/menu.ts
  - id: openwiki-source-2fca0c7e3a64296cf3b1f6c4
    resource: repo://src/widgets/category-nav/ui/CategoryNav.css.ts
  - id: openwiki-source-31646969bfb8dcef505cdfe6
    resource: repo://src/widgets/category-nav/ui/CategoryNav.tsx
generated: { by: 'claude-code', at: '2026-10-04T09:44:53.662Z' }
---

## 개요

상품 도메인은 `entities/product` 하나에 모여 있다.

| 세그먼트 | 내용                                                                                                                                                                                     |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model/` | `Product`(= 상세 DTO `ProductDetail`), 카드 목록용 `ProductCardSummary`·`ProductCardSort`·`ProductCardSearchParams`·`SaleMode` — 모두 DTO를 그대로 재노출한다(모양이 같아서 매퍼가 없다) |
| `api/`   | `getProduct`/`useProduct`, `getProductCards`/`useProductCards`, `searchProductCards`/`useSearchProductCards`                                                                             |
| `ui/`    | `ProductCard`(+`toProductCardData`), `ProductColorSwatches`, `ProductOptionSelector`, `ProductPaymentCard`, `ProductSummary`                                                             |

모든 조회는 `catalog` 정책(5분 캐시, 재시도 2회)을 쓴다([데이터 레이어](../architecture/data-layer.md)).

## 조회 API

- `useProductCards(query)` — `GET /api/v1/products?query=best|recommend` 큐레이션 목록. 응답의 `items`만 돌려준다.
  메인 페이지가 쓴다([메인 페이지](main-page-carousel.md)).
- `useSearchProductCards(params)` — `GET /api/v1/products/search?category&subCategory&brand&sort`. 값이 없는 키는
  쿼리에서 빼서 `'undefined'` 문자열이 새지 않게 한다. 필터를 바꾸면 쿼리 키가 바뀌어 이전 요청은 `signal`로 취소된다.
  응답은 `{ items, total }`이다.
- `useProduct(productId)` — `GET /api/v1/products/:id` 상세. `productId`가 빈 문자열이면 요청하지 않는다. 상품 상세
  페이지와 장바구니 줄이 쓴다.

## 카드: 데이터 변환과 선택 상태

`ProductCard`는 서버 응답을 그대로 받지 않고 `ProductCardData`(이미지 목록, 이름, 모델번호, 현재 색상명, 스와치 목록,
옵션 목록, 기본가, `saleMode`) 객체 하나를 `product` prop으로 받는다. 변환은 `toProductCardData(summary, colorIndex,
optionIndex)`가 한다 — 선택한 색상의 `imageUrls`를 이미지로, 그 색 이름을 색상명으로 쓰고 스와치·옵션에 `selected`를
채운다.

선택 인덱스는 `features/product-card-select`의 `useProductCardSelection()`이 상품 id → 인덱스 맵으로 들고 있다.
`<ProductCard {...getCardProps(product)} />`로 `product`, `onColorSelect`, `onOptionSelect`를 한 번에 펼친다. 상품 수가
응답마다 달라도 되도록 배열이 아니라 id 맵이다.

`ProductCard` 자체는:

- `saleMode === 'PREORDER'`면 "사전예약" 태그를 붙인다.
- 이미지는 `shared/ui`의 `Slider`로 넘기고, `key`를 이미지 목록에 묶어 **색상을 바꿀 때만** 슬라이더를 첫 장으로 리셋한다.
- 상품명은 `productPath(id)` 링크다.
- 색상 선택은 `ProductColorSwatches`(small)에, 용량 선택은 `ProductOptionSelector`(label "용량", small)에 위임한다.
- 가격은 `기본가 + 선택 옵션 extraPrice`로 계산해 숫자와 단위(`원`)를 다른 타이포그래피로 나눠 그린다.

## 하위 컴포넌트

**ProductColorSwatches** — 색 동그라미 목록. `shared/ui`의 `Button`은 "행동을 실행"하는 CTA용이라 재사용하지 않고,
여러 개 중 하나를 고르는 상태를 `aria-pressed`로 표현한다. `onSelect`가 없으면 버튼이 `disabled`인 표시 전용이 된다.
`small`은 선택 색 이름 한 줄을, `medium`(상품 상세)은 "색상" 제목과 모든 색 이름을 보여 준다.

**ProductOptionSelector** — 라벨 + `shared/ui`의 `SelectButton` 나열. 도메인 객체 없이 `label`과 `ProductOption[]`
(`label`, `selected`, `extraPrice`)만 받는다. `small`(카드)과 `medium`(상세 옵션 패널)에서 라벨 크기가 다르고, `medium`일
때만 추가금(`+N원`)을 버튼에 붙인다.

**ProductPaymentCard** — 주문·결제 맥락의 상품 한 줄. `variant` 하나로 네 맥락을 처리한다.

| variant                         | 추가 요소                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `default`                       | 없음(결과 페이지 등)                                                             |
| `cart`                          | 체크박스, `QuantityStepper`(수량이 주어졌을 때), 삭제 버튼(`onRemove`가 있을 때) |
| `preorder-pending` / `checkout` | 액션 버튼(`actionLabel`, `actionDisabled`로 결제 기한 만료 등 바깥 사정 반영)    |

`productId`가 있으면 상품명이 상세 링크가 되고, 가격은 `PriceText`로 그린다.

**ProductSummary** — 이름·옵션 요약·CTA 한 줄. 현재 앱 화면에서는 쓰지 않는다.

이 컴포넌트들은 타이포그래피 프리셋을 `.tsx`에서 클래스명으로 합성하고(`[typography.body.sub, styles.x].join(' ')`),
`size`별 프리셋은 매핑 객체(`colorNameTypography`, `labelTypography`)로 고른다.

## 카테고리 탐색

헤더의 `widgets/category-nav`가 탐색 진입점이다.

- 메뉴 데이터는 `model/menu.ts`의 상수다(카테고리 API가 생기면 교체) — 그룹(모바일, PC/주변기기, 웨어러블)마다
  카테고리, 제조사 필터, "사전예약 중인 …"·"… 구매후기" 링크와 `public/images/menu`의 카테고리 썸네일.
- 데스크톱 메가 메뉴는 JS 상태 없이 CSS `:hover`/`:focus-within`으로만 열린다. 헤더는 같은 선택자
  (`[data-mega-menu]:is(:hover, :focus-within)`)를 `:has()`로 보고 배경을 맞춘다. 이동을 일으키는 링크를 누르면
  포커스를 풀어 메뉴를 닫는다.
- 모바일은 탭바 "메뉴" → `BottomSheet` 안의 `MobileCategoryNav`가 같은 상수로 세로 목록을 그린다.
- 링크는 모두 `searchPath({ category, subCategory?, brand? })`로 `/search?...`를 만든다. 검색 페이지에 있을 때만 URL의
  카테고리로 활성 항목을 표시한다.

`SearchPage`(`/search`)는 쿼리 파라미터(`category`, `subCategory`, `brand`, `sort`)를 그대로 `useSearchProductCards`에
넘긴다. 정렬(낮은/높은 가격순)도 URL에 남겨 새로고침·공유해도 유지되고, 제목은 `카테고리 > 브랜드 > 하위 카테고리`
경로와 총 개수를 보여 준다. 로딩·에러·0건은 `InlineAlert` 문구로 대신한다.

## 관련

- [상품 구매와 결제 흐름](product-purchase-payment.md) — 상품 상세의 옵션 패널(`medium` 크기)
- [메인 페이지 히어로와 상품 캐러셀](main-page-carousel.md)
- [디자인 토큰과 vanilla-extract 스타일 시스템](../architecture/design-system.md)
