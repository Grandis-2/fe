---
type: architecture
title: 라우팅과 레이아웃 구성
description: react-router v7 createBrowserRouter 라우트 트리, RootLayout/MainLayout/AdminLayout 중첩과 RequireLogin 게이트, shared/config/routes 경로 상수, Header·MobileTabBar가 pathname으로 화면별 모양을 바꾸는 방식을 설명한다.
tags: [architecture, routing, react-router, layout, header]
verified:
  - by: openwiki/0.5.0
    at: 2026-10-04T09:44:53.662Z
sources:
  - id: openwiki-source-d421dbd6ae0978e083418e1f
    resource: repo://src/app/layouts/MainLayout.tsx
  - id: openwiki-source-ed9647f42ecf030391ec36db
    resource: repo://src/app/layouts/RequireLogin.tsx
  - id: openwiki-source-b65fd9a56ff85e721f2d0b4c
    resource: repo://src/app/layouts/RootLayout.tsx
  - id: openwiki-source-a52b9019d30f194703418d40
    resource: repo://src/app/router/index.tsx
  - id: openwiki-source-95bfccfd0c712f6e72040e0d
    resource: repo://src/main.tsx
  - id: openwiki-source-9b47a6acae14d12e2ae83197
    resource: repo://src/pages/main/MainPage.tsx
  - id: openwiki-source-3ced966c42818e53e028cadd
    resource: repo://src/shared/config/routes.ts
  - id: openwiki-source-a0aa70c261ba0a14421ba936
    resource: repo://src/widgets/header/lib/useHeaderTheme.ts
  - id: openwiki-source-310ed23c12d57a60ff01ac35
    resource: repo://src/widgets/header/ui/Header.tsx
  - id: openwiki-source-a413991961e3a0b8b12adc42
    resource: repo://src/widgets/mobile-tab-bar/ui/MobileTabBar.tsx
generated: { by: 'claude-code', at: '2026-10-04T09:44:53.662Z' }
---

## 개요

라우트 정의는 `src/app/router/index.tsx`의 `createBrowserRouter` 하나에 있고, `main.tsx`가
`RouterProvider`로 렌더한다. 페이지 파일은 라우터가 직접 import한다(`@pages/main/MainPage`) —
관리자 페이지만 슬라이스 배럴(`@pages/admin-products`)을 거친다.

## 라우트 트리

```
RootLayout                        Header · Outlet · MobileTabBar · Modal · ToastViewport
├─ MainLayout                     고객 화면 래퍼
│  ├─ /                           MainPage
│  ├─ /preorder                   PreorderPage
│  ├─ /preorder/:preorderId       PreorderDetailPage
│  ├─ /products/:productId        ProductDetailPage
│  ├─ /reviews                    ReviewsPage
│  ├─ /search                     SearchPage
│  ├─ /signup                     SignupPage
│  ├─ /auth/kakao/callback        KakaoCallbackPage
│  ├─ RequireLogin                회원 전용
│  │  ├─ /mypage                  Mypage
│  │  ├─ /payment                 PaymentPage
│  │  ├─ /payment/callback        PaymentCallbackPage
│  │  └─ /result                  ResultPage
│  └─ *                           NotFoundPage
└─ AdminLayout                    사이드바 + 콘텐츠
   ├─ /admin                      AdminHomePage
   ├─ /admin/products(/new, /:productId)
   ├─ /admin/preorders(/new, /:promotionId)   프로모션
   ├─ /admin/orders               예약 현황
   └─ /admin/consistency-check, /load-test, /notifications, /mock-settings   AdminPlaceholderPage
```

`*`(NotFound)는 `MainLayout` 안에 있다. 그래서 `/admin/없는경로`처럼 관리자 쪽에서 매칭되지 않는
주소도 고객용 404 화면으로 떨어진다.

## 경로 상수

경로 문자열은 `src/shared/config/routes.ts`에 모은다. 여러 레이어(라우터, 헤더, 탭바, 페이지 간
이동)가 같은 문자열을 쓰기 때문이다.

- 정적 경로는 상수(`HOME_PATH`, `PREORDER_PATH`, `ADMIN_PRODUCTS_PATH` …), 동적 경로는 생성
  함수(`productPath(id)`, `preorderPath(id)`, `adminProductPath(id)`)다. 라우터는 생성 함수에
  `':productId'`를 넘겨 패턴을 만든다.
- 쿼리를 쓰는 화면도 함수로 만든다 — `searchPath(params)`(URLSearchParams로 인코딩),
  `mypagePath(tab)`(`/mypage?state=<tab>`, 탭은 `MYPAGE_TABS`), `resultPath(status)`
  (`/result?status=preorder|paid|failed`).
- 예외: 카카오 콜백(`KAKAO_CALLBACK_PATH`, `features/login`)과 토스 결제 콜백
  (`PAYMENT_CALLBACK_PATH`, `features/payment`)은 SDK 호출과 짝이라 각 feature가 소유한다.
- `EVENTS_PATH`(`/events`)는 상수만 있고 라우트가 없어 NotFound로 간다.

## 레이아웃

### RootLayout

모든 화면의 공통 껍데기다.

- `Header`(회원 여부 전달), `Outlet`, `MobileTabBar`, 전역 `Modal`(`shared/model/modalStore`),
  `ToastViewport`(`toastStore`)를 렌더한다 — 모달과 토스트는 어느 화면에서든 스토어로 띄운다.
- 경로(`pathname`)가 바뀔 때마다 `window.scrollTo(0, 0)`으로 맨 위로 올린다.
- 로그인했는데 `profileComplete`가 false면 `/signup`으로 보낸다(`state.from`에 원래 경로). 이 검사를
  여기 한 곳에서만 해서 로그인·재발급·세션 조회 어느 경로로 세션이 채워져도 빠지지 않게 한다.

### MainLayout

고객 화면의 콘텐츠 래퍼다. `/preorder`, `/preorder/*`, `/products/*`에서는 배경을 흰색(base)으로
바꾸는 클래스를 더한다. 폭 제한은 하지 않고 페이지가 `Container`로 직접 한다.

### RequireLogin

회원 전용 라우트를 감싸는 레이아웃 라우트다. 세션 복구가 끝나기 전(`isAuthReady`가 false)이거나
비회원이면 아무것도 그리지 않는다. 복구가 끝났는데 비회원이면 `KakaoLoginModal`을 열고(`returnTo`에
원래 경로+쿼리) 홈으로 `replace` 이동한다 — 로그인하면 원래 가려던 곳으로 돌아온다.
자세한 흐름은 [로그인과 세션 관리](../features/auth-session.md) 참고.

### AdminLayout

`AdminSidebar` + 콘텐츠 영역이다. 관리자 경로에는 로그인·역할 게이트 레이아웃이 없다.
자세한 내용은 [관리자 콘솔](../features/admin-console.md) 참고.

## 화면별 분기는 pathname으로

레이아웃을 prop으로 바꾸지 않고, 위젯이 `useLocation()`의 pathname을 보고 스스로 모양을 바꾼다.

**Header**

- `/`(메인): 하단 테두리를 숨기고 sticky로 둔다. 다른 페이지는 sticky가 아니다.
- `/admin*`: 로고가 `NOVA ADMIN`(링크도 `/admin`)이 되고, `CategoryNav`·검색·장바구니·마이페이지를
  숨긴 채 알림 버튼만 남긴다.
- 그 밖: 검색, 그리고 회원이면 알림·장바구니(개수 배지)·마이페이지, 비회원이면 로그인 버튼.
  장바구니·알림 개수 쿼리는 회원의 고객 화면에서만 켜진다.
- **글자색 반전**: `useHeaderTheme`가 스크롤·리사이즈 때마다 헤더 세로 중앙 높이에 걸친
  `[data-header-theme]` 구간을 찾고, 가장 안쪽 구간이 `dark`면 헤더를 흰 글자로 바꾼다. 메인 페이지의
  배너·히어로가 `data-header-theme="dark"`, 그 안의 흰 카드 영역이 `"light"`를 단다.

**MobileTabBar**

- 데스크톱에서는 숨고, `/admin*`에서는 렌더하지 않는다.
- 검색·메뉴(카테고리 바텀시트)·홈·사전예약·마이페이지 탭. 비회원이 마이페이지를 누르면 이동 대신
  로그인 모달을 띄운다.

## 관련

- [Feature-Sliced Design 디렉터리 구조](directory-structure.md)
- [로그인과 세션 관리](../features/auth-session.md)
- [관리자 콘솔](../features/admin-console.md)
