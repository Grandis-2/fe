---
paths:
  - "src/**/*.css.ts"
---

# Styling

- **Styling**: Vanilla Extract (`*.css.ts`). Design tokens live in `src/shared/config/theme/tokens/`: `color`(`semantic.css.ts`, 용도별 네이밍 — 상태명을 그대로 쓰는 `border.focus` 같은 경우가 아니면 base 색상 이름 대신 용도명을 쓴다, 예: `primary.focus`), `typography`, `spacing`, `breakpoint`, `container` (maxWidth scale), `motion` (`duration`/`easing`), `shadow`.
- **Theme import**: `color`/`spacing`/`typography`/`motion`/`sprinkles`/`lineClamp`는 항상 barrel(`@shared/config/theme`)에서 가져온다 — `tokens/color/semantic.css`처럼 개별 토큰 파일을 직접 import하지 않는다. Barrel이 내보내지 않는 base 토큰(`tokens/typography/base`의 `fontWeight`/`fontSize`, `tokens/container`의 `maxWidth`)만 예외적으로 직접 import한다.
- **Responsive**: `@vanilla-extract/sprinkles` (`src/shared/config/theme/sprinkles.css.ts`), mobile-first, `desktop` = `(min-width: 744px)`. Only use `sprinkles()` for properties that actually differ by breakpoint — static values stay in plain `style()`.

## Gotchas

- `maxWidth` + `padding`을 같은 요소에 쓸 땐 `boxSizing: 'border-box'`를 꼭 같이 줘야 한다 — 안 그러면 실제 렌더링 너비가 `maxWidth + padding*2`가 된다 (`Header`/`CategoryNav`에서 겪음).
- hover 시 두꺼워 보이는 효과가 필요하면 `font-weight`를 transition하지 말 것(레이아웃 폭이 흔들림). 대신 `-webkit-text-stroke-color`(transparent → `currentColor`)를 transition — `CategoryNav.css.ts`의 `link` 스타일 참고.
- `mixBlendMode`는 자식까지 한 그룹으로 묶어 backdrop과 blend한다 — 자식에 `mixBlendMode: 'normal'`을 줘도 안 풀린다. 그래서 반전시킬 텍스트 자체에만 걸고, 흰 배경 패널 같은 자식이 들어갈 컨테이너에는 걸지 않는다(`CategoryNav`에서 `links` → `link`로 옮긴 이유 — 안 옮기면 hover 메뉴 배경이 반전된다).
