---
paths:
  - "src/app/**"
  - "src/widgets/header/**"
  - "src/widgets/category-nav/**"
---

# Routing

- `react-router` v7, config in `src/app/router/index.tsx`. Nested layout routes: `RootLayout` (always renders `Header`, which owns `CategoryNav`) → `MainLayout` (just a max-width 1200px content wrapper).
- 레이아웃 분기는 prop이 아니라 `Header` 안에서 `useLocation()`의 pathname으로 판단한다 — `/`는 배너 위 오버레이, `/products/:id`는 sticky 해제, `/admin*`은 로고를 `NOVA ADMIN`(링크도 `/admin`)으로 바꾸고 `CategoryNav`를 숨긴 채 알림 버튼만 남긴다. 새 분기도 같은 방식으로 추가한다.
