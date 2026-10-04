---
type: guide
title: 빠른 시작
description: nova 프론트엔드를 로컬에서 실행하는 방법(환경 변수, MSW 목 켜고 끄기, 주요 명령)과 앱 부팅 순서, 그리고 작업 종류별로 이 위키에서 어느 페이지를 봐야 하는지 안내하는 진입 페이지.
tags: [quickstart, onboarding, local-development]
verified:
  - by: openwiki/0.5.0
    at: 2026-10-04T09:44:53.662Z
sources:
  - id: openwiki-source-5f5b95b3d6a215fa02ceb945
    resource: repo://.env.example
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-95bfccfd0c712f6e72040e0d
    resource: repo://src/main.tsx
generated: { by: 'claude-code', at: '2026-10-04T09:44:53.662Z' }
---

## 이 저장소는 무엇인가

전자기기 사전예약·구매 쇼핑몰 nova의 프론트엔드다. React 19 + TypeScript + Vite이고, 스타일은 Vanilla Extract,
서버 상태는 TanStack Query, 라우팅은 react-router v7이다. `src/`는 Feature-Sliced Design 레이어로 나뉘고 레이어
경계는 ESLint로 강제된다. 백엔드 없이도 돌도록 MSW 목 서버가 들어 있고, 고객 화면과 `/admin` 관리자 화면이 한 앱에
있다.

## 로컬 실행

README 기준 Node.js `v20.19+` 또는 `v22.12+`가 필요하다(Vite 8).

```bash
npm install
cp .env.example .env.local   # 키를 채운다 — *.local은 커밋되지 않는다
npm run dev
```

`.env.example`의 변수:

| 변수                              | 용도                                                           |
| --------------------------------- | -------------------------------------------------------------- |
| `VITE_KAKAO_OAUTH_REST_API_KEY`   | 카카오 로그인 인가 URL의 `client_id`                           |
| `VITE_KAKAO_OAUTH_JAVASCRIPT_KEY` | 카카오 JavaScript 키                                           |
| `VITE_TOSS_PAYMENTS_CLIENT_KEY`   | 토스페이먼츠 "API 개별 연동" 테스트 클라이언트 키(`test_ck_…`) |

`VITE_` 변수는 클라이언트 번들에 그대로 들어가므로 Admin 키·시크릿 키는 넣지 않는다.

**MSW 목 서버** — 개발 서버에서는 기본으로 켜져 있어, 실제 API 없이 상품·장바구니·로그인·결제 등이 목 응답으로 돈다.
로그인도 카카오를 거치지 않고 가짜 코드로 바로 처리된다. 실제 API에 붙어 보려면 `VITE_USE_MSW=false`, 배포본에서
목을 쓰려면 `VITE_USE_MSW=true`. 페이지 주소에 `?mock=500`을 붙이면 모든 API가 500으로 실패한다. 자세한 내용은
[MSW 목 서버](architecture/mock-api.md).

### 주요 명령

```bash
npm run dev              # Vite 개발 서버
npm run build            # tsc -b 타입 검사 후 프로덕션 빌드
npm run preview          # 빌드 결과 미리보기
npm run lint             # eslint .   (lint:fix로 자동 수정)
npm run format           # prettier --check .   (format:fix로 자동 수정)
npm run storybook        # Storybook :6006
npm run build-storybook  # Storybook 정적 빌드
```

`test` 스크립트는 없다 — Storybook 스토리와 `play` 함수가 브라우저 모드 Vitest로 실행되는 구성이다. 커밋 시 husky가
lint-staged(ESLint·Prettier)와 commitlint(`feat:`, `fix(NF-18):` 형식)를 돌린다.

### 앱이 켜지는 순서

`src/main.tsx`는 ① MSW 워커 시작을 기다린 뒤 ② 리프레시 쿠키로 세션 복구(`initAuth`)를 시작하고(렌더를 막지 않음)
③ `QueryClientProvider` + `RouterProvider`를 `StrictMode`로 렌더한다.

## 이 위키에서 다음에 볼 곳

**구조와 규칙**

- [Feature-Sliced Design 디렉터리 구조](architecture/directory-structure.md) — 레이어별 슬라이스, import 별칭, ESLint가 막는 의존 방향
- [라우팅과 레이아웃 구성](architecture/routing.md) — 라우트 트리, 레이아웃·로그인 게이트, 헤더의 경로별 분기
- [빌드 및 개발 도구 구성](architecture/tooling.md) — Vite·ESLint·Storybook·커밋 훅·CodeRabbit·GitHub Actions·Vercel

**데이터와 서버 통신**

- [데이터 레이어: API 클라이언트와 서버 상태](architecture/data-layer.md) — `apiClient`의 에러 정규화·401 회복, DTO→모델, Query 정책, 에러 처리
- [MSW 목 서버](architecture/mock-api.md) — 목 켜고 끄기, 핸들러 구성, 강제 에러 스위치

**UI와 디자인**

- [디자인 토큰과 vanilla-extract 스타일 시스템](architecture/design-system.md) — 색·글꼴·간격·모션·그림자 토큰과 sprinkles
- [shared/ui 컴포넌트 라이브러리](architecture/shared-ui.md) — 공용 컴포넌트, 아이콘 규칙, 전역 Modal·Toast, Storybook

**기능별**

- [로그인과 세션 관리](features/auth-session.md) — 카카오 OAuth, 세션 재발급, 회원가입
- [상품 카탈로그와 탐색](features/product-catalog.md) — 상품 카드·옵션 컴포넌트, 카테고리 메뉴, 검색
- [메인 페이지 히어로와 상품 캐러셀](features/main-page-carousel.md) — 배너, embla 무한 캐러셀의 제약
- [상품 구매와 결제 흐름](features/product-purchase-payment.md) — 상품 상세 → 결제 → 토스 → 결과
- [사전예약 목록·상세와 대기열](features/preorder-detail.md) — 카운트다운, 모델 선택 시트, 대기열
- [마이페이지: 장바구니·배송지·내역](features/mypage.md) — 장바구니, 기본 배송지, 알림 배지
- [관리자 콘솔](features/admin-console.md) — 상품 등록·재고, 예약 현황, 프로모션

## 참고

코드 작성 규칙(레이어 배치, 토큰 import, 컴포넌트 폴더 구조, Query 정책, 에러 처리 등)은 저장소 루트의 `CLAUDE.md`가
기준이다. 이 위키는 코드가 지금 어떻게 동작하는지를 설명하며, 정기 갱신이라 최근 변경이 빠져 있을 수 있다.
