---
type: feature
title: 로그인과 세션 관리
description: 카카오 OAuth 로그인(state CSRF 검증·returnTo·콜백 처리), 메모리에만 두는 세션 토큰과 리프레시 쿠키 재발급, 재발급 single-flight와 탭 간 동기화(Web Locks·BroadcastChannel), 앱 부팅 시 세션 복구, 로그인 게이트와 회원가입(프로필 완성) 흐름을 설명한다.
tags: [feature, auth, session, oauth, kakao, security]
verified:
  - by: openwiki/0.5.0
    at: 2026-10-04T09:44:53.662Z
sources:
  - id: openwiki-source-6d56411850c7b268d511503f
    resource: repo://src/entities/auth/model/refreshCoordinator.ts
  - id: openwiki-source-8836cae18623d2ffe14b6b68
    resource: repo://src/entities/auth/model/session.ts
  - id: openwiki-source-64cb50e4d7d0a116d350d53c
    resource: repo://src/entities/auth/model/sessionStore.ts
  - id: openwiki-source-8c05dd4f9de922b1382cb070
    resource: repo://src/entities/profile/api/profile.ts
  - id: openwiki-source-083b348bbda28cff5468c06b
    resource: repo://src/entities/profile/api/useProfile.ts
  - id: openwiki-source-5e8cb43786b7495d224bfe46
    resource: repo://src/features/login/lib/getKakaoAuthorizeUrl.ts
  - id: openwiki-source-ed31e80e5326c1bffd0209dc
    resource: repo://src/features/login/lib/kakaoState.ts
  - id: openwiki-source-507a0666dcae0ff21319b03a
    resource: repo://src/features/login/lib/useKakaoCallback.ts
  - id: openwiki-source-f8f61bee3ea1345f26afe0b0
    resource: repo://src/features/login/lib/useRequireLogin.tsx
  - id: openwiki-source-6bd840df8452798d4679ca55
    resource: repo://src/pages/signup/SignupPage.tsx
generated: { by: 'claude-code', at: '2026-10-04T09:44:53.662Z' }
---

## 개요

인증은 세 층으로 나뉜다.

| 층               | 위치             | 하는 일                                                                               |
| ---------------- | ---------------- | ------------------------------------------------------------------------------------- |
| 세션 상태·재발급 | `entities/auth`  | 세션 스토어, 로그인/로그아웃/복구 함수, 재발급 조정, apiClient 인증 주입              |
| 로그인 행동      | `features/login` | 카카오 인가 URL 생성, state·returnTo 저장, 콜백 처리, 로그인 모달, 로그인 요구 훅     |
| 게이트           | `app/layouts`    | 회원 전용 라우트(`RequireLogin`), 프로필 미완성 사용자의 `/signup` 이동(`RootLayout`) |

## 세션 상태

`entities/auth/model/sessionStore.ts`는 `shared/lib/createStore`로 만든 스토어다.

- `sessionToken`은 **메모리에만** 둔다 — `localStorage`/`sessionStorage`에 넣지 않는다. 새로고침하면
  사라지고, 리프레시 쿠키로 재발급해 되살린다.
- `displayName`, `role`(`USER`/`ADMIN`), `profileComplete`, 그리고 `isAuthReady`(부팅 시 복구 시도가
  끝났는지)를 함께 든다. 로그아웃 상태의 `profileComplete`는 게이트에 걸리지 않게 `true`로 둔다.
- 화면은 `useSession()`으로 `isLoggedIn`(= 토큰 있음), `isAuthReady`, `displayName`, `role`,
  `profileComplete`를 읽는다. 토큰 자체는 스토어 밖으로 내보내지 않는다.

## 카카오 로그인 흐름

```
KakaoLoginModal "카카오로 로그인"
  └ getKakaoAuthorizeUrl(returnTo)
      state(UUID 2개, 64자) → sessionStorage   returnTo → sessionStorage
      → https://kauth.kakao.com/oauth/authorize?client_id&redirect_uri&state …
        (MSW가 켜져 있으면 카카오를 건너뛰고 /auth/kakao/callback?code=mock-…&state=… 로 바로 이동)
카카오 → /auth/kakao/callback?code&state
  └ KakaoCallbackPage → useKakaoCallback()
      consumeReturnTo()  consumeStoredState(state)   ← 둘 다 성공/실패와 무관하게 한 번만 꺼내고 지운다
      loginWithKakao({ code, redirectUri }) → POST /api/v1/auth/kakao/callback → 세션 저장
      profileComplete ? returnTo : /signup(state.from = returnTo) 로 replace 이동
```

- **CSRF** — `state`는 탭 단위 `sessionStorage`에 저장한다(`localStorage`는 다른 탭·다음 세션까지 남아
  금지). 저장소를 못 쓰면 검증할 방법이 없어 로그인 시작 자체를 막고 모달에 에러를 띄운다.
- **오픈 리다이렉트 방지** — `returnTo`는 `/`로 시작하고 `//`로 시작하지 않을 때만 쓰고, 아니면 홈이다.
- **1회용 code** — `useRef`로 StrictMode의 이중 effect를 막아 code를 두 번 보내지 않고, 성공하면
  `replace` 내비게이션으로 URL에서 code를 지운다.
- **실패** — `error` 파라미터면 "로그인을 취소했습니다.", state 불일치·code 없음은 일반 문구,
  서버가 `INVALID_OAUTH_CALLBACK`이면 "만료되었거나 이미 사용됐습니다."를 보여 주고 2초 뒤 로그인을 시작한
  화면으로 돌아간다.

## 재발급: single-flight와 탭 간 조정

`entities/auth/model/refreshCoordinator.ts`가 재발급(`POST /api/v1/session/refresh`, 리프레시 쿠키 사용)을
조정한다. 같은 쿠키로 재발급을 두 번 보내면 서버가 토큰 재사용 공격으로 판정해 세션을 끊기 때문이다.

1. **탭 안 single-flight** — `ensureFreshSession()`은 진행 중인 Promise가 있으면 그것을 돌려준다. 여러
   요청이 동시에 401을 받아도 재발급은 한 번만 나간다.
2. **탭 간 락** — `navigator.locks.request('nova-auth-refresh')`로 탭끼리도 한 번에 하나만 재발급한다.
   락을 기다리는 동안 다른 탭이 5초 안에 이미 갱신했으면 네트워크를 타지 않는다. Web Locks가 없으면
   그냥 수행한다.
3. **결과 공유** — `BroadcastChannel('nova-auth')`로 `session-updated`(새 세션) / `session-cleared`를
   보내고, 받은 탭은 자기 스토어를 맞춘다.
4. **실패 처리** — 재발급이 **401**일 때만 세션을 지우고 다른 탭에 알린다. 네트워크 오류 같은 일시 실패로는
   멀쩡한 세션을 끊지 않는다.

이 모듈은 로드되는 순간 `configureApiAuth()`로 `apiClient`에 `Authorization: Bearer <sessionToken>`
헤더와 401 처리기(`ensureFreshSession`)를 주입한다. 그래서 일반 보호 API(예: `/me/profile`)는 401을 받으면
재발급 후 한 번 다시 시도하고, 인증 흐름 자체인 호출(카카오 콜백, 재발급, 세션 조회·삭제, 관리자 세션)은
`skipAuthRefresh`로 재발급을 트리거하지 않는다([데이터 레이어](../architecture/data-layer.md)).

## 부팅 시 복구와 로그아웃

- `main.tsx`가 렌더와 동시에 `initAuth()`를 부른다(렌더를 막지 않는다). 메모리에 토큰이 없으면
  `ensureFreshSession()`으로 리프레시 쿠키 재발급을 시도하고, 성공·실패와 무관하게 끝나면
  `markAuthReady()`로 `isAuthReady`를 켠다.
- `logout()`은 `DELETE /api/v1/session` 결과와 무관하게 로컬 세션을 지우고 다른 탭에 `session-cleared`를
  보낸다. 현재 이 함수를 부르는 UI는 없다.

## 로그인 게이트

- **`RequireLogin` 레이아웃 라우트** — `/mypage`, `/payment`, `/payment/callback`, `/result`를 감싼다.
  `isAuthReady` 전에는 아무것도 그리지 않아(새로고침 직후 회원이 잠깐 튕기지 않게) 복구를 기다리고, 끝났는데
  비회원이면 `KakaoLoginModal`(returnTo = 원래 경로)을 열고 홈으로 보낸다.
- **`useRequireLogin()` 훅** — 버튼 같은 **행동** 단위 게이트. 회원이면 넘긴 함수를 실행하고, 아니면 로그인
  모달을 연다(로그인 후 같은 화면으로 돌아오므로 다시 누르면 된다).
- 헤더·모바일 탭바도 비회원에게는 마이페이지 대신 로그인 모달을 연다.

## 회원가입: 프로필 완성

카카오 로그인 직후 `profileComplete`가 false인 사용자는 `/signup`에서 이름·이메일·휴대폰을 채워야 한다.

- 콜백에서 바로 `/signup`으로 보내고, `RootLayout`도 로그인 상태에서 `profileComplete`가 false면 어느 경로에서든
  `/signup`으로 보낸다 — 새로고침으로 재발급을 탄 사용자도 놓치지 않기 위해 이 검사를 한 곳에 둔다.
- `SignupPage`는 기존 프로필(`useProfile`, `account` 정책)로 폼을 미리 채우고, 세 칸을 통째로
  `PUT /api/v1/me/profile`한다. 응답에 `profileComplete`가 없어서, 응답의 세 값이 모두 채워졌을 때만
  `markProfileComplete()`로 로컬에 반영한 뒤 `state.from`(없으면 홈)으로 돌아간다. 저장 응답으로 프로필 캐시를
  바로 갱신해 결제 화면이 옛 값을 보지 않게 한다.
- 약관 동의 UI(`features/terms-agreement`)는 회원가입이 아니라 결제 페이지에서 쓴다.

## 관련

- [데이터 레이어: API 클라이언트와 서버 상태](../architecture/data-layer.md) — 인증 주입과 401 1회 회복
- [라우팅과 레이아웃 구성](../architecture/routing.md) — `RequireLogin`, `RootLayout` 게이트 위치
- [MSW 목 서버](../architecture/mock-api.md) — 목 세션·리프레시 쿠키 우회
- [상품 구매와 결제 흐름](product-purchase-payment.md) — 회원 전용 결제 경로
