---
type: architecture
title: '데이터 레이어: API 클라이언트와 서버 상태'
description: shared/api/client.ts의 axios 래퍼가 서버 봉투·인증·타임아웃·401 회복을 어떻게 한곳에서 처리하는지, entities/*/api가 DTO를 모델로 바꾸는 경계, TanStack Query 정책 프리셋과 재시도·폴링 규칙, 화면 쪽 에러 처리 패턴을 설명한다.
tags:
  [architecture, data-layer, api-client, axios, tanstack-query, error-handling]
verified:
  - by: openwiki/0.5.0
    at: 2026-10-04T09:44:53.662Z
sources:
  - id: openwiki-source-1bb3a49ab0ffbce6eda1333a
    resource: repo://src/app/queryClient.ts
  - id: openwiki-source-4e8c2fd9d2783d3ab85fe5eb
    resource: repo://src/entities/auth/api/auth.ts
  - id: openwiki-source-6d56411850c7b268d511503f
    resource: repo://src/entities/auth/model/refreshCoordinator.ts
  - id: openwiki-source-8b36d2be1feae5a5ebbc0645
    resource: repo://src/entities/cart/api/cart.ts
  - id: openwiki-source-c1281c05ba608ccef8a404d5
    resource: repo://src/entities/cart/api/useCart.ts
  - id: openwiki-source-7d5b7993947873b27dfc4733
    resource: repo://src/entities/notification/api/useUnreadNotificationCount.ts
  - id: openwiki-source-dd74325b4f619443b2a46413
    resource: repo://src/entities/product/model/product.ts
  - id: openwiki-source-7cbcca67deb7aca1b08e0fe8
    resource: repo://src/pages/admin-reservations/ui/AdminReservationsPage.tsx
  - id: openwiki-source-9b47a6acae14d12e2ae83197
    resource: repo://src/pages/main/MainPage.tsx
  - id: openwiki-source-10abbb76eaee3f2f7a6732cb
    resource: repo://src/pages/payment/PaymentPage.tsx
  - id: openwiki-source-6bd840df8452798d4679ca55
    resource: repo://src/pages/signup/SignupPage.tsx
  - id: openwiki-source-0675b164c342842e703afafc
    resource: repo://src/shared/api/client.ts
  - id: openwiki-source-39342707d1817bafc3b1415c
    resource: repo://src/shared/api/queryPolicy.ts
generated: { by: 'claude-code', at: '2026-10-04T09:44:53.662Z' }
---

## 개요

서버와의 모든 통신은 `src/shared/api/client.ts`의 `apiClient.request()` 하나를 거친다.
흐름은 다음과 같다.

```
서버 JSON ─ shared/api/client.ts (봉투 벗기기·에러 정규화·인증·401 회복)
          ─ shared/api/types       (서버 DTO 타입)
          ─ entities/<name>/api    (조회 함수 + 필요하면 DTO→모델 매핑, TanStack Query 훅)
          ─ entities/<name>/model  (화면이 쓰는 도메인 타입)
          ─ features / widgets / pages
```

목표는 서버 응답 모양이 UI까지 새지 않게 하는 것이다 — API가 바뀌면 `entities/*/api`만 고친다.

## apiClient: 한 번의 요청이 거치는 단계

`request(path, options)`는 세 단계로 이루어진다.

1. **`send()`** — axios 인스턴스로 요청을 보낸다. 매 요청에 `X-Request-Id`(UUID에서 `-`를 뺀
   값)와 주입된 인증 헤더를 붙이고, 호출부가 넘긴 `signal`을 axios에 그대로 전달한다.
2. **401이면 한 번만 회복 시도** — `recoverFromUnauthorized()`가 `true`를 돌려주면 같은 요청을
   딱 한 번 다시 보낸다. 다시 보낸 요청이 또 401이면 그대로 실패한다.
3. **`unwrap()`** — 서버 봉투 `{ success, data, error }`를 벗겨 `data`만 돌려주고, 실패면
   `ApiRequestError`를 던진다. 204(No Content)는 본문 없이 `undefined`를 돌려준다.

### 상태 코드를 axios가 아니라 봉투로 판단한다

axios 인스턴스는 `validateStatus: () => true`로 만들어져 4xx/5xx에도 reject하지 않는다. 서버가
실패도 항상 같은 JSON 봉투로 내려주기 때문에 성공 여부를 `json.success`로 직접 판단한다.
그 결과 실패 경로가 둘로 나뉜다.

- **응답은 받았는데 실패** → `unwrap()`이 서버 `error`를 담아 `ApiRequestError(error, status)`를 던진다.
  본문이 JSON 객체가 아니면(프록시 에러 HTML 등) `INVALID_RESPONSE` 코드로 감싼다.
- **응답을 못 받음** → `send()`의 `catch`에서 `toTransportError()`가 axios 에러를
  `ApiRequestError`로 바꾼다. 타임아웃(`ECONNABORTED`/`ETIMEDOUT`)은 `TIMEOUT`, 그 밖은
  `NETWORK_ERROR`이고 둘 다 **`status: 0`** 이다 — HTTP 코드가 아니라 "서버까지 못 갔다"는
  이 프로젝트의 약속이다.
- **취소**(`axios.isCancel`)는 실패로 보지 않고 원래 에러를 그대로 던진다. TanStack Query가
  취소된 요청을 알아서 무시한다.

타임아웃은 `TIMEOUT_MS = 10_000`(10초)이고, 인스턴스는 `withCredentials: true`로 쿠키(리프레시
토큰)를 함께 보낸다. `baseURL`은 없다 — 엔티티 API는 `/api/v1/...` 상대경로를 쓴다.

### 인증은 바깥에서 주입된다

`shared`는 FSD 규칙상 `entities`를 import할 수 없어서, 클라이언트는 `getAuthHeaders`와
`onUnauthorized`를 빈 동작으로 둔 `let` 변수로 갖고 `configureApiAuth()`로 채워지기를 기다린다.
`entities/auth/model/refreshCoordinator.ts`가 모듈 로드 시점에 이 함수를 호출해 세션 스토어의
`sessionToken`을 `Authorization: Bearer` 헤더로, `ensureFreshSession`을 401 처리기로 등록한다.
주입 전에도 인증이 필요 없는 엔드포인트는 정상 동작한다. 재발급 single-flight와 탭 간 동기화는
[로그인과 세션 관리](../features/auth-session.md)에서 다룬다.

401 회복에는 예외가 둘 있다.

- 401 응답의 `error.details.retryable`이 참이면(서버 쪽 일시 장애) 재발급 대신 2초 기다렸다가 같은
  요청을 한 번 더 보낸다.
- `skipAuthRefresh` 옵션을 준 호출(세션 재발급·관리자 세션처럼 그 자체가 인증 흐름인 호출)은
  재발급을 트리거하지 않는다 — 재발급 실패가 또 재발급을 부르는 루프를 막는다.

### 화면 문구 꺼내기

`getErrorMessage(caught, fallback)`은 잡힌 값이 `ApiRequestError`면 서버 메시지를, 아니면
호출부의 기본 문구를 돌려준다. 결제·회원가입·배송지 모달·장바구니처럼 `try/catch`로 변경 요청을
보내는 화면이 이 헬퍼로 에러 문구를 만든다.

## DTO와 모델의 경계

서버 DTO 타입은 `src/shared/api/types/`에 도메인별 파일로 있고 `index.ts`가 `export type *`로
모은다. DTO는 `shared`에 있어야 한다 — MSW 목([MSW 목 서버](mock-api.md))이 DTO를 쓰는데 `shared`는
`entities`를 import할 수 없기 때문이다.

`entities/<name>/api`는 두 가지 방식 중 하나를 쓴다.

- **모양이 같으면 재노출만** — `entities/product/model/product.ts`는 `export type Product = ProductDetail`
  한 줄이고, `getProduct()`는 DTO를 그대로 모델로 돌려준다.
- **모양이 다르면 매퍼** — `entities/cart/api/cart.ts`의 `getCartItems()`는 `cartItemId`→`id`,
  `unitPrice`→`price`처럼 필드명을 바꿔 `CartItem` 모델을 만든다.

## TanStack Query 정책

### 프리셋

`useQuery`는 `staleTime`/`retry`를 직접 쓰지 않고 `queryPolicy`의 프리셋을 펼친다.

| 프리셋    | staleTime | 재시도   | 쓰는 곳             |
| --------- | --------- | -------- | ------------------- |
| `catalog` | 5분       | 최대 2회 | 상품 목록·검색·상세 |
| `account` | 5분       | 최대 1회 | 프로필·기본 배송지  |
| `live`    | 0         | 최대 1회 | 장바구니·알림 개수  |

재시도 여부는 `isRetryableError()`가 판단한다. `ApiRequestError`가 아닌 에러, `status === 0`
(타임아웃·네트워크), `status >= 500`만 재시도하고 4xx는 즉시 실패한다 — 다시 보내도 결과가 같은
실패라서다.

`app/queryClient.ts`는 `defaultQueryOptions`를 `QueryClient` 기본값으로 쓴다. 프리셋을 고르지 않은
쿼리도 4xx는 재시도하지 않고(`retryUpTo(1)`), mutation은 같은 요청이 두 번 반영될 수 있어
자동 재시도하지 않는다(`retry: false`).

### 취소와 폴링

`queryFn`은 `({ signal })`을 API 함수까지 넘긴다(예: `useProduct` → `getProduct(productId, signal)`).
쿼리 키가 바뀌거나 화면을 떠나면 이전 요청이 취소돼 늦게 온 응답이 새 화면을 덮지 않는다.

주기적 갱신은 `pollingInterval(baseMs, maxMs = baseMs * 8)`을 `refetchInterval`에 넣는다. 실패가
이어지면 `fetchFailureCount`에 따라 간격을 두 배씩 늘리고, 성공하면 원래 간격으로 돌아온다.
헤더 알림 배지(`useUnreadNotificationCount`)가 60초 기본 간격으로 이걸 쓴다.

### mutation 후 캐시 갱신

변경 응답으로 캐시를 직접 고치는 방식을 선호한다. 장바구니 수량 변경은 `setQueryData`로 해당
항목만 바꾸고, 삭제는 목록에서 항목을 빼면서 헤더 배지용 `['cart', 'count']`만 invalidate한다.
비회원에게 의미 없는 장바구니·알림 개수 쿼리는 `enabled` 인자로 꺼서 401 → 재발급 시도가 헛돌지
않게 한다.

## 화면 쪽 에러 처리 패턴

- **조회**는 쿼리의 `isPending`/`isError`/빈 결과를 구분해 그 자리에 문구를 채운다. `MainPage`는
  베스트·추천 섹션마다 "불러오는 중", "불러오지 못했어요", "아직 없어요"를 따로 고르고
  `InlineAlert`의 `status`를 `error`/`info`로 바꾼다. 재시도가 정책대로 끝난 뒤에야 `isError`가 된다.
- **변경**은 `try/catch` + `getErrorMessage`로 문구를 상태에 담는다.
- **관리자 페이지**(`admin-*`)는 아직 이전 방식이다 — `useEffect`에서 API 함수를 직접 부르고
  `.catch((cause: Error) => setError(cause.message))`로 처리해, 취소·재시도 정책을 타지 않는다.
- 렌더링 중 예외를 잡는 ErrorBoundary나 라우터 `errorElement`는 아직 없다.

## 관련

- [MSW 목 서버](mock-api.md) — 같은 봉투 모양의 목 응답과 `?mock=<status>` 강제 에러 스위치
- [로그인과 세션 관리](../features/auth-session.md) — `configureApiAuth`에 주입되는 재발급 로직
- [Feature-Sliced Design 디렉터리 구조](directory-structure.md) — DTO import를 제한하는 레이어 규칙
