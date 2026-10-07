---
paths:
  - "src/app/**"
  - "src/widgets/header/**"
  - "src/widgets/category-nav/**"
---

# Routing

- `react-router` v7, config in `src/app/router/index.tsx`. Nested layout routes: `RootLayout` (always renders `Header`, which owns `CategoryNav`) → `MainLayout` (폭 제한 없음 — pathname으로 바탕색(어두운/흰/투명)만 고르고, 모바일 탭바 높이만큼 아래를 비운다. 1200px 폭은 각 페이지가 `Container`로 건다).
- 헤더의 경로 분기는 prop이 아니라 `Header` 안에서 `useLocation()`의 pathname으로 판단한다 — `/`만 sticky(`isStickyPage`, 나머지는 기본 `position: relative`), `/admin*`은 로고를 `NOVA ADMIN`(링크도 `/admin`)으로 바꾸고 `CategoryNav`를 숨긴 채 알림 버튼만 남긴다. 새 경로 분기도 같은 방식으로 추가한다.
- 헤더 글자색(어두운 바탕 위 흰 글자)은 경로로 분기하지 않는다 — 페이지가 어두운 구간에 `data-header-theme="dark"`를 달면 `useHeaderTheme`가 헤더 밑 구간을 보고 바꾼다. 헤더 뒤까지 어두운 페이지는 루트를 헤더 높이만큼 끌어올린다(`marginTop: calc(-1 * headerHeight)` — `PreorderPage`, `ProductDetailPage` 참고).
