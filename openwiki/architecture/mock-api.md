---
type: architecture
title: MSW 목 서버
description: shared/api/mock의 MSW 목 서버가 언제 켜지는지(VITE_USE_MSW), 핸들러·픽스처·봉투 헬퍼 구성, 페이지 컨텍스트에서 돈다는 점을 이용한 쿠키·sessionStorage 처리, 카카오 로그인 우회, ?mock=<status> 강제 에러 스위치를 설명한다.
tags: [architecture, msw, mock, testing, local-development]
verified:
  - by: openwiki/0.5.0
    at: 2026-10-04T09:44:53.662Z
sources:
  - id: openwiki-source-5e8cb43786b7495d224bfe46
    resource: repo://src/features/login/lib/getKakaoAuthorizeUrl.ts
  - id: openwiki-source-95bfccfd0c712f6e72040e0d
    resource: repo://src/main.tsx
  - id: openwiki-source-a4ee47d113fd790715f1c3fe
    resource: repo://src/shared/api/mock/browser.ts
  - id: openwiki-source-280c2d98f42ca94a92de4c9a
    resource: repo://src/shared/api/mock/handlers/auth.ts
  - id: openwiki-source-efdef997f5fb856dbfca752a
    resource: repo://src/shared/api/mock/handlers/cart.ts
  - id: openwiki-source-ac1a6affeec91ad14b03109b
    resource: repo://src/shared/api/mock/handlers/forceError.ts
  - id: openwiki-source-3d5cfd5749f4ec60c8b5cb74
    resource: repo://src/shared/api/mock/handlers/index.ts
  - id: openwiki-source-6178c6d71836ccf1910db1bc
    resource: repo://src/shared/api/mock/handlers/payment.ts
  - id: openwiki-source-aa20d19c0f8ee29b43a9a530
    resource: repo://src/shared/api/mock/index.ts
  - id: openwiki-source-428010253a8dcd3af40aab9e
    resource: repo://src/shared/api/mock/response.ts
  - id: openwiki-source-bcd2d69006a1c208503f1c70
    resource: repo://src/shared/api/mock/url.ts
generated: { by: 'claude-code', at: '2026-10-04T09:44:53.662Z' }
---

## 개요

백엔드 없이도 화면을 개발·확인할 수 있도록 `src/shared/api/mock/`에 MSW(Mock Service Worker)
목 서버가 있다. 서비스 워커가 브라우저의 `fetch`/XHR을 가로채고, 등록된 핸들러가 실제 서버와 같은
JSON 봉투로 응답한다. 앱 코드(`apiClient`)는 목인지 실제 서버인지 모른다.

목은 DTO 타입(`shared/api/types`)을 쓰기 때문에 `shared`에 있다 — `shared`는 `entities`를 import할
수 없어 모델 타입이 아니라 DTO로 응답을 만든다.

## 켜지는 조건

`mock/index.ts`의 `isMockEnabled`가 판단한다.

| 환경                                    | 기본     | 바꾸는 법                                         |
| --------------------------------------- | -------- | ------------------------------------------------- |
| `vite` 개발 서버(`import.meta.env.DEV`) | **켜짐** | `VITE_USE_MSW=false`면 꺼짐(실제 API로 붙어볼 때) |
| 빌드 결과물(배포)                       | **꺼짐** | `VITE_USE_MSW=true`면 켜짐                        |

`main.tsx`는 `startMockWorker()`가 끝날 때까지 렌더를 미룬다 — 워커 등록 전에 첫 요청이 나가면
목을 놓치기 때문이다. 꺼져 있으면 `./browser`를 동적 import하지도 않는다. 워커는
`onUnhandledRequest: 'bypass'`로 시작해, 핸들러가 없는 요청(정적 자산 등)은 그대로 네트워크로
보낸다. 서비스 워커 파일은 `public/mockServiceWorker.js`(MSW가 생성, ESLint 제외 대상)다.

> README의 MSW 절에는 "`import.meta.env.DEV`로만 켜져 빌드 결과물에 MSW가 없다"는 이전 설명이
> 남아 있다. 현재 코드는 위 표처럼 `VITE_USE_MSW=true`로 배포본에서도 켤 수 있다.

## 구성

- `browser.ts` — `setupWorker(...handlers)`.
- `handlers/` — 도메인별 핸들러 배열(`product`, `cart`, `auth`, `address`, `payment`,
  `notification`, `admin-product`, `admin-stock`, `admin-dispatch`, `admin-reservation`)과 이를
  모으는 `index.ts`.
- `fixtures/` — 상품·카드 목록·장바구니·관리자 데이터 시드.
- `response.ts` — `ok(data, status = 200)`와 `fail(status, { code, message, violations?, retryable? })`.
  실제 서버 봉투(`success`/`data`/`error`/`timestamp`/`traceId`)를 여기서만 조립한다. `violations`·
  `retryable`은 평평하게 받아 `error.details` 아래로 넣는다.
- `url.ts` — `url(path)`는 `*${path}`를 돌려준다. 앱이 상대경로로 부르든 절대 URL로 부르든 잡히게
  origin을 와일드카드로 둔다.
- `validate.ts` — `codePointLength`. 서버와 같이 이모지 1개를 길이 1로 센다(배송지 글자 수 검증에 쓴다).

핸들러는 실제 서버 계약을 흉내 내 검증 실패를 `400 VALIDATION_FAILED` + `violations`로, 없는 항목을
`404`로 돌려준다. 예를 들어 장바구니 수량은 1~99 정수만 받고, 결제 승인(`/payments/confirm`)은 준비
단계(`/payments/prepare`)에서 저장한 주문 금액과 다르면 `AMOUNT_MISMATCH`로 거절한다.

## 페이지 컨텍스트에서 돈다는 점

MSW v2 브라우저 모드에서 핸들러는 서비스 워커가 아니라 **페이지(main thread)** 에서 실행된다.
목 코드는 이 점을 여러 곳에서 이용한다.

- **상태 유지** — 인증 목(`nova-auth-mock-db`)과 결제 목(`nova-payment-mock-db`)은 메모리 상태를
  `sessionStorage`에 함께 저장해 새로고침에도 살아남게 한다(탭을 닫으면 사라진다). 장바구니 목은
  메모리에만 있어 새로고침하면 시드로 돌아간다.
- **쿠키 우회** — 브라우저는 서비스 워커가 만든 응답의 `Set-Cookie`를 반영하지 않는다(보안 제약).
  그래서 인증 핸들러는 리프레시 쿠키 값을 `X-Mock-Set-Cookie` 헤더로 내려보내고, `browser.ts`가
  `response:mocked` 이벤트에서 `document.cookie`로 대신 심는다. 재발급 핸들러는 `document.cookie`에서
  `refresh_token`(관리자는 `admin_refresh_token`)을 읽는다. `HttpOnly`는 흉내 낼 수 없다.
- **강제 에러 스위치** — 아래 참고.

## 카카오 로그인 우회

목이 켜져 있으면 `features/login`의 `getKakaoAuthorizeUrl()`이 카카오 인가 페이지 대신
`/auth/kakao/callback?code=mock-<uuid>&state=...` 같은 콜백 URL을 직접 만든다. 인증 목이 이 가짜
`code`로 세션을 발급한다(같은 `code` 재사용은 400). 목 사용자 이름은 `기매진`이고, 로컬 관리자 계정은
`admin` / `admin1234`다(실제 값이 아니다).

## 강제 에러 스위치: `?mock=<status>`

`handlers/forceError.ts`가 핸들러 목록 **맨 앞**에 등록돼 모든 `/api/*` 요청을 먼저 본다. 페이지
주소(`location.search`)에 `mock` 파라미터가 있으면 그 상태 코드로 실패 응답을 돌려준다.

```
/?mock=500              # 모든 API가 500
/products/1?mock=503    # 400~599 사이 아무 코드
/?mock=error            # 500과 같다
```

파라미터가 없거나 범위를 벗어나면 `undefined`를 돌려 원래 핸들러로 넘긴다. 실패 화면은
[데이터 레이어](data-layer.md)의 재시도 정책을 그대로 타므로, 5xx면 자동 재시도가 끝난 뒤(약 3초)에
에러 상태가 된다. 사이트 안에서 링크로 이동하면 주소의 `?mock`이 사라진다.

## 관련

- [데이터 레이어: API 클라이언트와 서버 상태](data-layer.md) — 목 응답을 소비하는 `apiClient`와 재시도 정책
- [로그인과 세션 관리](../features/auth-session.md) — 목 세션·리프레시 쿠키를 쓰는 실제 흐름
- [빠른 시작](../quickstart.md) — 로컬 실행과 환경 변수
