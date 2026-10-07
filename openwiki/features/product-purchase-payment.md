---
type: feature
title: 상품 구매와 결제 흐름
description: 상품 상세에서 옵션·수량·가격을 고르는 useProductPurchase와 구매 UI, 회원 게이트를 거쳐 사전예약 결과 또는 결제 페이지로 넘어가는 주문 초안, 결제 페이지의 수령인·배송지·약관 입력, 결제 준비 API → 토스 결제창 → 콜백 승인 → 결과 페이지로 이어지는 3단계 결제와 각 단계의 실패 처리를 설명한다.
tags: [feature, product-detail, checkout, payment, toss-payments]
verified:
  - by: openwiki/0.5.0
    at: 2026-10-04T09:44:53.662Z
sources:
  - id: openwiki-source-85a0193d500f3ada81d8d814
    resource: repo://src/entities/payment/api/payment.ts
  - id: openwiki-source-6c7a8df984f878053fac026a
    resource: repo://src/features/payment/lib/requestTossPayment.ts
  - id: openwiki-source-a27da905dc27aa15364931b9
    resource: repo://src/features/payment/lib/tossClient.ts
  - id: openwiki-source-92115789397d46f9c7f4fc49
    resource: repo://src/features/product-purchase/lib/useProductPurchase.ts
  - id: openwiki-source-cde74a6292d2ead2f76ba87c
    resource: repo://src/features/product-purchase/model/benefit.ts
  - id: openwiki-source-ff4136956f1024df9f5629c7
    resource: repo://src/features/product-purchase/model/purchaseDraft.ts
  - id: openwiki-source-a2f3600b144f7f4476618dc0
    resource: repo://src/pages/payment-callback/PaymentCallbackPage.tsx
  - id: openwiki-source-10abbb76eaee3f2f7a6732cb
    resource: repo://src/pages/payment/PaymentPage.tsx
  - id: openwiki-source-1c893975135ff616dbbb2088
    resource: repo://src/pages/product-detail/ProductDetailPage.tsx
  - id: openwiki-source-9613623344d0abe41188f8c4
    resource: repo://src/pages/result/ResultPage.tsx
  - id: openwiki-source-3f6dd0b33f1690130d43ba0b
    resource: repo://src/shared/lib/useFormFields.ts
generated: { by: 'claude-code', at: '2026-10-04T09:44:53.662Z' }
---

## 개요

```
/products/:id  ProductDetailPage
   옵션·수량 선택(useProductPurchase) ── "결제하기"/"사전예약하기" ── useRequireLogin
      ├ 사전예약 상품 → /result?status=preorder   (replace, state = PurchaseDraft)
      └ 일반 상품     → /payment                  (state = PurchaseDraft)
/payment  PaymentPage
   ① preparePayment(orderName, amount) → { orderId, amount }
   ② requestTossPayment(...)           → 토스 결제창(카드) → successUrl / failUrl
/payment/callback  PaymentCallbackPage
   ③ confirmPayment(paymentKey, orderId, amount)
      ├ 성공 → /result?status=paid
      └ 실패 → /result?status=failed
```

`/payment`, `/payment/callback`, `/result`는 `RequireLogin` 안에 있는 회원 전용 경로다
([로그인과 세션 관리](auth-session.md)).

## 상품 상세

`ProductDetailPage`는 아직 대부분 목업이다 — 색상·옵션 그룹(크기·RAM·용량·칩과 추가금), 기본가(2,390,000원), 이미지,
모델번호, 배송 시작일, 탭 콘텐츠가 상수다. 실제 API(`useProduct`)에서는 **`saleMode`(사전예약 여부)만** 쓴다.

- **결제 진행 가능 여부** — 상품 조회가 끝나지 않았거나 실패하면 `isCheckoutReady`가 false라 결제·사전예약 버튼을
  막는다. 로딩 중 `isPreorder`의 기본값(false) 때문에 사전예약 상품이 일반 결제 흐름을 타는 것을 막기 위해서다.
  에러 문구는 따로 보여 주지 않는다.
- **선택 상태** — `features/product-purchase`의 `useProductPurchase()`가 색상·옵션 그룹별 선택 인덱스·수량을 들고,
  옵션 라벨(`·`로 이은 한 줄), 단가(기본가 + 선택 옵션 추가금), 총액을 파생한다. 같은 라우트에서 다른 상품으로 옮겨가면
  렌더 중에 선택을 초기화한다(이펙트에서 setState하지 않는다). **사전예약은 1인 1개**라 스테퍼 값과 무관하게 주문
  수량을 1로 고정한다.
- **UI 분담** — 옵션 패널은 `ProductOptionSelector`/`ProductColorSwatches`(medium), 가격 요약은 `PurchaseSummary`,
  이미지는 `features/product-gallery`(슬라이더 + 데스크톱 미리보기, 현재 번호를 공유), 모바일 하단·데스크톱 스크롤 주문바는
  `widgets/product-purchase-bar`가 맡는다. 주문바는 훅 반환값(`ProductPurchase`)에서 필요한 필드만 `Pick`해 받는다.
  스티키 주문바·탭바 노출과 탭 동기화는 페이지 폴더의 `useProductDetailScroll`이 담당한다.
- **사전예약 혜택** — `PREORDER_BENEFIT_RATE = 0.1`. 고정 금액이었다가 소액 주문에서 총액이 음수가 되어 비율로
  바꿨고, 상세 요약과 결제 화면이 같은 상수를 써서 합계가 맞는다.

### 주문 초안 넘기기

"결제하기"는 `useRequireLogin()`으로 감싸 비회원이면 로그인 모달을 연다. 회원이면 `PurchaseDraft`(상품명, 색상 라벨,
옵션 라벨, 수량, 단가)를 `navigate(..., { state })`로 넘긴다. 사전예약은 결과 화면으로 `replace` 이동해, 완료 후 뒤로가기로
상세에 돌아와 다시 제출하는 것을 막는다.

## 결제 페이지

`PaymentPage`는 `location.state`의 `PurchaseDraft`를 쓰고, 주소로 직접 들어와 없으면 목업 초안으로 대체한다.

- **폼 기본값** — `shared/lib/useFormFields`로 프로필(이름·휴대폰·이메일)과 기본 배송지를 기본값으로 깐다. 사용자가 고친
  칸이 항상 우선이라 응답이 늦게 와도 입력 중인 값을 덮어쓰지 않는다. 기본 배송지가 없으면 목업 주소로 채운다(배송지
  없음 처리가 정해지기 전 임시). 기본 주소는 직접 입력하지 않고 다음 우편번호 검색으로만 바꾸며, 새 주소를 고르면 상세
  주소를 비운다. "배송지 관리" 링크는 마이페이지 배송지 탭으로 간다.
- **필수 입력** — 이름·휴대폰·배송지명·주소·상세주소. 제출을 한 번 시도한 뒤에만 빈 칸을 빨갛게 표시한다.
- **약관** — `features/terms-agreement`의 `TermsAgreement`(전체 동의 + 개별 항목). `required` 항목을 모두 동의해야
  `OrderSummary`의 결제 버튼이 활성화된다.
- **금액** — 주문 금액(단가 × 수량) − 사전예약 혜택(10%, 반올림) = 결제 예정 금액.

## 3단계 결제

1. **준비** — `preparePayment({ orderName, amount })`(`POST /api/v1/payments/prepare`). 결제창을 열기 전에 서버가
   주문 ID와 금액을 확정해 저장한다.
2. **결제창** — `features/payment`의 `requestTossPayment()`. 토스 SDK는 `getTossPayments()`가 한 번만 로드해 Promise를
   재사용한다. 카드 결제창(API 개별연동)을 `customerKey: ANONYMOUS`로 연다(세션에 아직 안정적인 회원 식별자가 없다).
   `successUrl`과 `failUrl`은 둘 다 `/payment/callback`이다. 정상 진행되면 브라우저가 리다이렉트되어 함수가 끝나지
   않고, 사용자가 창을 닫은 경우(`USER_CANCEL`)는 오류가 아니라 조용히 반환한다.
3. **승인** — `PaymentCallbackPage`가 쿼리의 `paymentKey`·`orderId`·`amount`를 `confirmPayment()`(`POST
/api/v1/payments/confirm`)로 넘긴다. 서버는 이 금액을 1단계에서 저장한 값과 대조해 위변조를 걸러낸 뒤에만 토스 승인
   API를 부른다. `useRef`로 StrictMode의 이중 effect에서 승인을 두 번 보내지 않는다.

### 실패 처리

| 단계             | 실패                                             | 화면                                                                                        |
| ---------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 준비·결제창 호출 | API 에러, SDK 파라미터 오류, 네트워크            | 결제 페이지 상단 `InlineAlert`(`getErrorMessage`, 기본 "결제 요청 중 문제가 발생했습니다…") |
| 결제창           | 사용자가 닫음(`USER_CANCEL`)                     | 아무 문구 없이 결제 페이지에 머문다                                                         |
| 콜백             | `failUrl`로 돌아옴(파라미터 없음) 또는 승인 실패 | `/result?status=failed`로 `replace` 이동                                                    |

## 결과 페이지

`ResultPage`(`/result?status=preorder|paid|failed`, 알 수 없는 값은 `paid`)는 `widgets/result-hero`의 그라데이션 배너
(완료는 남색→보라, 실패는 보라 계열)를 공유한다.

- **preorder / paid** — 주문 번호·결제 수단(사전예약은 결제 전이라 없음)·배송지·배송 예정일, 주문 상품 카드, 총액, "예약/구매
  내역 보러 가기"(마이페이지 탭)와 "홈으로". 사전예약이면 결제 기한 안내 `InlineAlert`를 더한다. 주문 조회 API가 없어 값은
  목업이다.
- **failed** — 행성 일러스트 + "Something went wrong." + "홈으로"만 보여 준다.

## 관련

- [상품 카탈로그와 탐색](product-catalog.md) — 옵션 선택·결제 카드 컴포넌트
- [로그인과 세션 관리](auth-session.md) — `useRequireLogin`, `RequireLogin`
- [마이페이지: 장바구니·배송지·내역](mypage.md) — 장바구니에서 결제로, 기본 배송지
- [사전예약 목록·상세와 대기열](preorder-detail.md) — 대기열 완료 후 상품 상세로 진입
- [MSW 목 서버](../architecture/mock-api.md) — 결제 준비·승인 목(금액 대조)
