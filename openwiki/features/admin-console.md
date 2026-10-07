---
type: feature
title: 관리자 콘솔
description: /admin 아래 관리자 화면의 구성(AdminLayout·사이드바·헤더 분기), 상품 등록·수정 폼 모델과 재고·출고 회차 API를 나눠 저장하는 흐름, 예약 현황 폴링과 재처리, 아직 목 데이터로 도는 프로모션 화면, 이전 구조로 남은 데이터 조회 방식을 설명한다.
tags: [feature, admin, backoffice, product-form, reservations]
verified:
  - by: openwiki/0.5.0
    at: 2026-10-04T09:44:53.662Z
sources:
  - id: openwiki-source-be719bc1ce8137b9c827d737
    resource: repo://src/app/layouts/AdminLayout.tsx
  - id: openwiki-source-a52b9019d30f194703418d40
    resource: repo://src/app/router/index.tsx
  - id: openwiki-source-06c190f33db9f03270a1b750
    resource: repo://src/entities/admin-product/api/adminProduct.ts
  - id: openwiki-source-909f3367d62076cdefe5fd51
    resource: repo://src/entities/admin-product/model/dispatch.ts
  - id: openwiki-source-6250016b9a0561f980797386
    resource: repo://src/entities/admin-product/model/form.ts
  - id: openwiki-source-0e854f57d9aea94298201577
    resource: repo://src/entities/admin-promotion/model/mock.ts
  - id: openwiki-source-4e8c2fd9d2783d3ab85fe5eb
    resource: repo://src/entities/auth/api/auth.ts
  - id: openwiki-source-c7686eda5139b6e0dd4712ea
    resource: repo://src/entities/auth/index.ts
  - id: openwiki-source-f9c47e8bd3a62da3db960f79
    resource: repo://src/pages/admin-product-detail/ui/AdminProductDetailPage.tsx
  - id: openwiki-source-fe69539069cfe9cb2ab833d9
    resource: repo://src/pages/admin-product-new/ui/AdminProductNewPage.tsx
  - id: openwiki-source-985c134354e295de7c091069
    resource: repo://src/pages/admin-promotions/ui/AdminPromotionsPage.tsx
  - id: openwiki-source-7cbcca67deb7aca1b08e0fe8
    resource: repo://src/pages/admin-reservations/ui/AdminReservationsPage.tsx
  - id: openwiki-source-24aa39fe272b8cd68c7e0e42
    resource: repo://src/widgets/admin-sidebar/ui/AdminSidebar.tsx
generated: { by: 'claude-code', at: '2026-10-04T09:44:53.662Z' }
---

## 개요

관리자 화면은 `/admin` 아래에 있고, 라우터에서 `RootLayout` → `AdminLayout`(사이드바 + 콘텐츠)로
렌더된다. 헤더는 같은 `Header` 위젯이 `/admin*` 경로를 보고 로고를 `NOVA ADMIN`으로 바꾸고 쇼핑
내비게이션을 숨긴다. 모바일 하단 탭바는 렌더하지 않는다. 경로 상수는 `shared/config/routes`의
`ADMIN_*`이다([라우팅](../architecture/routing.md)).

관리자 경로를 감싸는 로그인·역할 게이트 레이아웃은 없다. 관리자 세션 API(`postAdminSession`,
`/api/v1/admin/session`)는 `entities/auth`가 내보내지만 이를 호출하는 로그인 화면은 아직 없다.

## 메뉴 구성

`widgets/admin-sidebar`는 세 묶음을 그린다.

| 묶음        | 메뉴                                           | 경로                          | 화면                                     |
| ----------- | ---------------------------------------------- | ----------------------------- | ---------------------------------------- |
| (없음)      | 홈                                             | `/admin`                      | `AdminHomePage` — 각 메뉴 카드           |
| 백오피스    | 상품 관리                                      | `/admin/products`             | 목록·등록·상세                           |
|             | 사전 예약 관리                                 | `/admin/preorders`            | 프로모션 목록·등록·수정                  |
|             | 예약 현황                                      | `/admin/orders`               | 예약 목록                                |
| 개발자 기능 | 정합성 대조, 부하 검증, 관리자 알림, Mock 설정 | `/admin/consistency-check` 등 | `AdminPlaceholderPage`("준비 중입니다.") |

## 상품 관리

### 데이터와 API

`entities/admin-product`가 관리자 상품 API와 폼 모델을 갖는다.

- `api/adminProduct.ts` — 목록(`displayStatus`/`saleStatus`/`q`/페이지 쿼리), 상세, 등록(초안으로
  생성), 수정(오픈 이후엔 409), 전시(`publish`, DRAFT/HIDDEN → PUBLISHED), 숨김(`hide`, 사유 5자 이상).
- `api/adminStock.ts` — 조합(옵션 코드)별 재고 조회·`PUT`.
- `api/adminDispatch.ts` — 사전예약 출고 회차(dispatch window) 조회·생성·게시, 오픈 시각 변경.

### 폼 모델: 서버 DTO와 다른 모양

`model/form.ts`의 `AdminProductFormValue`는 편집하기 좋은 모양이다 — 색상(`noColor` 체크 가능,
이미지 포함)과 옵션 그룹(값마다 추가금)을 따로 들고, **조합별 수량은 `quantities` 맵**(키
`색상|옵션값|옵션값`, 조합이 없으면 `default`)으로만 들고 있다.

- 조합 행은 상태로 저장하지 않고 `getProductVariants()`가 색상 × 옵션값 곱집합을 매번 다시 계산한다.
  그래서 색상이나 옵션을 추가·삭제해도 살아남은 조합의 수량 입력이 유지된다. 라벨이 빈 옵션 값은
  계산에서 빠지고, `noColor`를 체크하면 색상 축이 빠진다.
- `toUpsertRequest()`가 폼을 등록·수정 본문으로, `toFormValue()`가 상세 응답을 폼으로 바꾼다.
- 등록·수정 본문에는 수량 필드가 없다. `toStockRequests(value, detail)`가 서버가 발급한 옵션 코드와
  `quantities` 키를 맞춰 재고 `PUT` 요청 목록을 만든다(코드가 아직 없는 조합은 건너뛴다).
- 업로드 이미지는 아직 대응 API 필드가 없어 요청 본문에 실리지 않는다.

### 저장 흐름

- **등록**(`AdminProductNewPage`) — `createAdminProduct(toUpsertRequest(value))` 후 새 상품 상세로 이동한다.
  등록 단계에서는 재고를 보내지 않는다.
- **수정**(`AdminProductDetailPage`) — 상품 상세와 재고를 함께 불러오고, 저장하면
  `updateAdminProduct` → **그 응답의** 옵션 코드로 `toStockRequests` → 재고 `PUT`들을 병렬로 보낸 뒤 목록으로
  돌아간다. PATCH가 variant 코드를 새로 만들기 때문에 수정 전 코드로 보내면 새 조합에 재고가 붙지 않는다.
  탭(`?tab=`) 전환은 히스토리를 쌓지 않도록 `replace`로 바꾼다.
- **출고 회차**(`widgets/admin-dispatch-windows`) — 회차 버전 중 게시된 것이 있으면 그것을, 없으면 가장
  최근 초안을 보여주고(`pickActiveVersion`), 다음 회차의 시작 순번은 직전 회차 `toSeq + 1`이다.

폼 UI는 `widgets/admin-product-form`(`AdminProductForm`과 색상·옵션 그룹·조합 표·가격·기간 필드
하위 컴포넌트)이 담당하고, `mode`(create/edit)에 따라 라벨이 바뀐다.

## 예약 현황

`AdminReservationsPage`(`/admin/orders`)는 상품 목록·회원 목록을 한 번 받아(회원 이름은 예약 응답에 없어
`memberId`로 이어 붙인다) 예약 목록을 **10초마다** 다시 받는다. 상태 탭과 예약번호 검색은 서버 쿼리가
아니라 받아온 목록(최대 100건)을 화면에서 거른다 — 집계 카드와 표가 같은 목록에서 나와야 숫자가 맞기
때문이다. 100건을 넘으면 카드 숫자가 덜 세진다. 외부 등록 재처리는 `ConfirmDialog`로 한 번 더 확인한 뒤
`reprocessAdminReservation`을 부르고 목록을 다시 받는다.

## 사전 예약(프로모션) 관리

프로모션 API가 아직 없어 `entities/admin-promotion/model/mock.ts`의 `mockPromotions`/
`mockLinkableProducts` 표본으로 화면을 채운다. MSW 핸들러(DTO 기반 목)와 달리 화면 확인용 모델 표본이다.
`widgets/admin-promotion-form`이 등록·수정 폼을 담당한다.

## 이전 구조로 남은 부분

- 관리자 페이지는 슬라이스가 `ui/` + `index.ts` 배럴 구조다(고객 화면 페이지는 파일을 평평하게 둔다).
- 데이터 조회는 TanStack Query가 아니라 `useEffect` + API 함수 직접 호출 + `useState`다. 실패는
  `.catch((cause: Error) => setError(cause.message))`로 문구를 띄운다 — 취소·재시도·캐시 정책
  ([데이터 레이어](../architecture/data-layer.md))을 타지 않는다. 상품 상세는 `cancelled` 플래그로 늦게 온
  응답을 무시한다.

## 관련

- [라우팅과 레이아웃 구성](../architecture/routing.md)
- [데이터 레이어: API 클라이언트와 서버 상태](../architecture/data-layer.md)
- [로그인과 세션 관리](auth-session.md) — 관리자 세션 API와 리프레시 쿠키
- [MSW 목 서버](../architecture/mock-api.md) — 관리자 상품·재고·회차·예약 목 핸들러
