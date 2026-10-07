---
paths:
  - "src/**/*.tsx"
---

# JSX

- 텍스트 요소에는 `<p>` 대신 `<div>`/`<span>`을 쓴다 (`<p>`는 사용하지 않는다).
- lucide-react 아이콘은 `color` prop을 직접 주지 않는다(정적 값이라 `:hover`에 반응 안 함). prop을 비워두면 아이콘의 `stroke="currentColor"`가 부모의 CSS `color`를 상속하므로, 부모에서 `color`를 transition하면 hover가 된다.
- `embla-carousel` + `loop: true`로 무한 오토스크롤 캐러셀을 만들 때:
  - flex 슬라이드 컨테이너에 `width`를 명시하지 않는다 (`auto`로 뷰포트 폭만큼만 잡혀야 함). `max-content`를 주면 Embla의 `canLoop()`가 항상 실패해서 `loop`가 조용히 `false`로 폴백되고 오토스크롤 자체가 멈춘다.
  - flex `gap`은 마지막↔첫 슬라이드 사이에는 안 먹는다(Embla/CSS 공통 한계) — 마지막 슬라이드에 `gap`만큼 `margin-right`을 추가로 줘야 이음매 간격이 안 튄다.
  - `AutoScroll` 플러그인과 같이 쓸 땐 `dragFree: true`를 켜야 한다 — 안 그러면 스냅포인트마다 멈칫거린다.
