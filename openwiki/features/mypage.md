---
type: feature
title: '마이페이지: 장바구니·배송지·내역'
description: /mypage의 쿼리 파라미터 탭 구성과 mypage-* 위젯, 장바구니 조회·수량 변경·삭제와 헤더 배지 갱신, 기본 배송지 저장과 다음 우편번호 검색, 아직 목업으로 도는 구매·사전예약 내역, 헤더 알림 배지 폴링을 설명한다.
tags: [feature, mypage, cart, address, notification]
verified:
  - by: openwiki/0.5.0
    at: 2026-10-04T09:44:53.662Z
sources:
  - id: openwiki-source-1fe12f538739ed1aca04c4d4
    resource: repo://src/entities/address/api/defaultAddress.ts
  - id: openwiki-source-761a991b4c78a1fa341f735c
    resource: repo://src/entities/address/api/useDefaultAddress.ts
  - id: openwiki-source-2a239bc5db63c35e663b70a5
    resource: repo://src/features/address-search/lib/loadDaumPostcode.ts
  - id: openwiki-source-630cb947fc7f319e642a8494
    resource: repo://src/pages/mypage/Mypage.tsx
  - id: openwiki-source-3ced966c42818e53e028cadd
    resource: repo://src/shared/config/routes.ts
  - id: openwiki-source-36ff51f54639368448375a57
    resource: repo://src/widgets/mypage-address/ui/AddressFormModal/AddressFormModal.tsx
  - id: openwiki-source-689e391d65ce185a87334892
    resource: repo://src/widgets/mypage-cart/ui/MypageCart.tsx
  - id: openwiki-source-5d7d3329daa87f550fef36a3
    resource: repo://src/widgets/mypage-history/ui/MypageHistory.tsx
  - id: openwiki-source-8856a2ba7ac728ad0f59c409
    resource: repo://src/widgets/mypage-preorder/ui/MypagePreorder.tsx
generated: { by: 'claude-code', at: '2026-10-04T09:44:53.662Z' }
---

## 개요

`/mypage`는 `RequireLogin` 안에 있는 회원 전용 화면이다. 탭은 경로가 아니라 쿼리 파라미터
`?state=<tab>`로 고르고(`mypagePath(tab)`), 탭 목록은 `shared/config/routes`의 `MYPAGE_TABS`다.

| 탭 값                   | 제목          | 위젯             | 데이터                 |
| ----------------------- | ------------- | ---------------- | ---------------------- |
| `preorder-check` (기본) | 사전예약 확인 | `MypagePreorder` | 목업                   |
| `cart`                  | 장바구니      | `MypageCart`     | `entities/cart` API    |
| `history`               | 구매 내역     | `MypageHistory`  | 목업                   |
| `address-manage`        | 배송지 관리   | `MypageAddress`  | `entities/address` API |

알 수 없는 `state` 값은 기본 탭으로 본다. 데스크톱은 왼쪽 `MypageMenu`(사이드 메뉴), 모바일은 이름 +
`SegmentedTabs`(짧은 라벨)를 CSS 미디어쿼리로 바꿔 보여 준다. 사용자 이름은 아직 목업 상수다.

헤더의 장바구니 아이콘은 `?state=cart`로, 마이페이지 아이콘과 모바일 탭은 `?state=preorder-check`로 들어온다.

## 장바구니

`entities/cart`가 API와 Query 훅을 갖는다.

- 조회 — `useCartItems()`(`live` 정책). 서버 DTO를 `CartItem` 모델(`id`, `productId`, `optionCode`,
  `quantity`, `price`)로 매핑한다.
- 수량 변경 — `PATCH /api/v1/cart/items/:id`, 성공 응답으로 해당 항목만 캐시에서 바꾼다.
- 삭제 — `DELETE`, 캐시에서 항목을 빼고 헤더 배지용 `['cart', 'count']`만 invalidate한다.
- 개수 — `useCartCount(enabled)`는 헤더 배지용 "담긴 줄 수"다. 회원의 고객 화면에서만 켠다.

`MypageCart` 위젯은:

- 각 줄(`CartItemRow`)이 `useProduct(productId)`로 상품 상세를 따로 불러 이름·썸네일·옵션명을 채운다(장바구니
  응답엔 상품 정보가 없다). 상세가 아직 없으면 id·옵션 코드로 대신 보여 준다.
- 수량 변경 요청은 바뀐 수량을 통째로 보내므로, 진행 중에 또 누르면 무시한다(같은 값 중복 전송 방지).
  삭제도 진행 중엔 무시하고, 성공하면 선택 목록에서도 뺀다.
- 체크한 줄로 상품 수·합계를 계산해 `entities/order`의 `OrderSummary`(리모컨)에 넘기고, "결제하기"는 `/payment`로
  이동한다. 선택이 없으면 버튼을 막는다.
- 목록은 로딩·에러·빈 장바구니 문구를, 변경 실패는 `getErrorMessage`로 만든 에러 문구를 `InlineAlert`로 띄운다.

## 배송지

`entities/address`의 기본 배송지는 회원당 하나다.

- `useDefaultAddress()`(`account` 정책) — 서버 응답의 `{ shippingAddress }` 봉투를 벗겨 주소 하나(없으면
  `null`)만 돌려준다. 비회원이면 401이고 4xx는 재시도하지 않는다.
- `useSaveDefaultAddress()` — 다섯 칸을 통째로 `PUT`하고, 응답으로 캐시를 바로 갱신해 마이페이지·결제 화면이
  다시 조회하지 않게 한다.

`MypageAddress`는 주소가 있으면 `AddressCard`(수정 버튼), 없으면 빈 상태와 "주소 추가"를 보여 준다.
`AddressFormModal`은 전역 모달 스토어가 아니라 `Modal`을 직접 렌더한다. 저장할 때 수령인 이름·전화번호를 폼에서
받지 않고 `getProfile()`로 로그인한 회원 본인 값을 가져와 채운다. 주소를 새로 검색하면 상세 주소는 비운다.

### 다음 우편번호 검색

`features/address-search`가 담당한다.

- `loadDaumPostcode()` — 다음 우편번호 스크립트를 한 번만 로드하고 같은 Promise를 재사용한다(토스 SDK 로더와 같은
  패턴). 로드 실패는 "우편번호 서비스를 불러오지 못했습니다."로 reject한다.
- `useDaumPostcodeEmbed()` — 열려 있을 때만 로드·embed하고, 컨테이너 노드가 바뀌면 새 노드에 다시 embed한다
  (`Modal`의 `<dialog>`처럼 항상 마운트된 컨테이너에서 한 번만 도는 effect로는 embed가 안 걸리는 문제 때문).
- `DaumPostcodeSearch`, `AddressFields` UI를 제공한다.

## 구매 내역·사전예약 확인 (목업)

구매 내역·사전예약 API가 아직 없어 두 위젯 모두 모듈 상수 목업을 쓴다.

- `MypageHistory` — 상태별 주문 목업을 `entities/order`의 `HistoryCard`로 그린다.
- `MypagePreorder` — 결제 마감 시각을 모듈 로드 시점 기준으로 만들고(렌더마다 새 `Date`를 만들면
  `useCountdown` 타이머가 계속 새로 걸리기 때문), 남은 시간을 카운트다운으로 보여 주며 결제 버튼은 `/payment`로 보낸다.

## 알림 배지

`entities/notification`의 `useUnreadNotificationCount(enabled)`는 `/api/v1/notifications/unread-count`를
60초 간격으로 폴링하고, 실패가 이어지면 `pollingInterval`이 간격을 최대 8배까지 늘린다. 장바구니 개수와 같이
회원의 고객 화면 헤더에서만 켜진다. 알림 목록 화면은 아직 없다.

## 관련

- [로그인과 세션 관리](auth-session.md) — `RequireLogin`과 프로필
- [상품 구매와 결제 흐름](product-purchase-payment.md) — 결제 페이지가 기본 배송지를 쓰는 방식
- [데이터 레이어: API 클라이언트와 서버 상태](../architecture/data-layer.md) — 정책 프리셋과 mutation 캐시 갱신
