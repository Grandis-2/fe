<!-- OPENWIKI:START -->

## OpenWiki

See [AGENTS.md](AGENTS.md) for OpenWiki agent instructions.

<!-- OPENWIKI:END -->

## Commands

```bash
npm run dev             # Vite dev server
npm run build            # tsc -b && vite build
npm run lint              # eslint .
npm run lint:fix          # eslint . --fix
npm run storybook         # Storybook dev server on :6006
```

## Architecture

- **Feature-Sliced Design**: `src/app` → `pages` → `widgets` → `features` → `entities` → `shared`. Higher layers may import lower layers, never the reverse — enforced by `import-x/no-restricted-paths` in `eslint.config.js`.
- **Import 경로**: 슬라이스(`features/login`, `entities/product` 등) 밖은 레이어별 별칭(`@app`/`@pages`/`@widgets`/`@features`/`@entities`/`@shared`), 슬라이스 안은 상대경로를 쓴다(`../../lib/usePreorderQueue`, `./Modal.css`). `@/` 같은 src 통째 별칭은 쓰지 않는다. 별칭을 추가·변경할 땐 `tsconfig.app.json`의 `paths`와 `vite.config.ts`의 `alias`를 같이 고친다. 슬라이스 안에서 자기 배럴(`@features/login`)을 import하면 `index.ts` → 컴포넌트 → `index.ts` 순환이 생기므로 파일을 직접 가리킨다 — 배럴은 밖에서 들어오는 문이다.
- **Routing**: `react-router` v7, config in `src/app/router/index.tsx`. Nested layout routes: `RootLayout` (always renders `Header`, which owns `CategoryNav`) → `MainLayout` (just a max-width 1200px content wrapper). 레이아웃 분기는 prop이 아니라 `Header` 안에서 `useLocation()`의 pathname으로 판단한다 — `/`는 배너 위 오버레이, `/products/:id`는 sticky 해제, `/admin*`은 로고를 `NOVA ADMIN`(링크도 `/admin`)으로 바꾸고 `CategoryNav`를 숨긴 채 알림 버튼만 남긴다. 새 분기도 같은 방식으로 추가한다.
- **Styling**: Vanilla Extract (`*.css.ts`). Design tokens live in `src/shared/config/theme/tokens/`: `color`(`semantic.css.ts`, 용도별 네이밍 — 상태명을 그대로 쓰는 `border.focus` 같은 경우가 아니면 base 색상 이름 대신 용도명을 쓴다, 예: `primary.focus`), `typography`, `spacing`, `breakpoint`, `container` (maxWidth scale), `motion` (`duration`/`easing`).
- **Theme import**: `color`/`spacing`/`typography`/`motion`/`sprinkles`/`lineClamp`는 항상 barrel(`@shared/config/theme`)에서 가져온다 — `tokens/color/semantic.css`처럼 개별 토큰 파일을 직접 import하지 않는다. Barrel이 내보내지 않는 base 토큰(`tokens/typography/base`의 `fontWeight`/`fontSize`, `tokens/container`의 `maxWidth`)만 예외적으로 직접 import한다.
- **Responsive**: `@vanilla-extract/sprinkles` (`src/shared/config/theme/sprinkles.css.ts`), mobile-first, `desktop` = `(min-width: 744px)`. Only use `sprinkles()` for properties that actually differ by breakpoint — static values stay in plain `style()`.
- **Pages**: 페이지는 라우트 하나에 대응하는 조립만 한다. `pages/<name>/` 아래에 `XxxPage.tsx`(+`.css.ts`)를 평평하게 두고 `ui/`·`index.ts`를 만들지 않는다(라우터가 `@pages/main/MainPage`처럼 파일을 직접 import). 페이지 안에서 쓰는 하위 컴포넌트는 페이지 폴더에 두지 말고 `widgets`/`features`로 뺀다(예: 이미지 슬라이더+미리보기 → `features/product-gallery`). 관리자 전용 페이지·위젯은 `pages/admin/<name>/`, `widgets/admin/<name>/`(예: `pages/admin/products/AdminProductsPage.tsx`, `@widgets/admin/sidebar`)에 모은다 — `admin/`은 정리용 묶음 폴더라 그 바로 아래에 `index.ts`·공용 유틸 같은 코드를 두지 않고, 묶인 슬라이스끼리도 서로 import하지 않는다(두면 `admin`이 슬라이스가 돼 같은 레이어끼리 코드를 나눠 쓰게 된다). 폴더 이름엔 `admin-`을 붙이지 않고, 파일·컴포넌트 이름은 구매자 쪽과 겹치지 않게 `Admin` 접두어를 유지한다. entities는 화면이 아니라 데이터로 나누므로 묶지 않는다(`entities/admin-product` 그대로).
- **Segment**: hook(`useXxx`)은 `model/`에 두지 않는다 — `model/`은 타입·상수·스토어만, hook은 `lib/`에 둔다. TanStack Query 훅은 `entities/*/api/`에 둔다.
- **Feature 이름**: 기능 단위로 짓고 기술명을 쓰지 않는다(`login`, `payment`, `address-search` — `kakao-login`, `toss-payment` X). 슬라이스 안 파일명은 실제 구현을 드러내도 된다(`KakaoLoginModal`).
- **TanStack Query 정책**: `useQuery`에 `staleTime`/`retry`를 직접 쓰지 않고 `@shared/api/queryPolicy`의 프리셋(`catalog`/`account`/`live`)을 펼친다. 새 유형이 필요하면 프리셋을 추가한다. `queryFn`은 `({ signal })`을 API 함수까지 넘겨 키가 바뀌면 이전 요청이 취소되게 한다. 폴링은 `pollingInterval()`로 실패 시 간격을 늘린다.
- **Reuse before adding**: 새 컴포넌트/타입/색상을 만들기 전에 `shared/ui`, 관련 `entities/*` 슬라이스, `shared/config/theme`(특히 `color.*` 토큰)에 이미 있는지부터 확인한다. 실제로 겪은 사례 — 거의 동일한 타입을 두 군데(`ProductColorSwatch`/`ProductColorSwatchItem`)에 따로 선언, 이미 있는 `color.background.surface` 대신 생 hex 값을 하드코딩. 구조가 겹치는 타입(필드 일부만 빠짐/전부 optional/키로 매핑 등)은 새로 손으로 적지 말고 `Pick`/`Omit`/`Partial`/`Record` 같은 유틸리티 타입으로 기존 타입에서 파생시킨다 — 단, 호출부가 하나뿐인데 제네릭을 억지로 붙이는 건 과한 설계다.
- **컴포넌트 폴더 구조**: `entities/*/ui/`(다른 레이어도 컴포넌트가 여러 개면 동일하게 적용) 안에서 컴포넌트를 `ui/ComponentName.tsx`처럼 평평하게 두지 않는다. 컴포넌트마다 `ui/ComponentName/` 폴더를 만들고 그 안에 `ComponentName.tsx`, `ComponentName.css.ts`, `ComponentName.stories.tsx`와 `export * from './ComponentName'`만 있는 `index.ts`를 넣는다. `index.ts` 덕분에 엔티티 배럴(`entities/*/index.ts`)의 `from './ui/ComponentName'` import는 그대로 유지된다 — 새 컴포넌트를 추가할 때도 처음부터 이 구조로 만든다.

## Data layer

FSD 위에 얹는 규칙이다 — `domain/`, `data/`, `usecases/` 같은 별도 최상위 폴더는 만들지 않는다.
목적은 하나: **서버 응답 모양(DTO)이 UI까지 새지 않게 해서, API가 바뀌어도 고칠 곳이 `entities/*/api` 하나로 끝나게 한다.**

흐름: 서버 JSON → `shared/api`(DTO 타입, fetch) → `entities/*/api`(DTO → 모델) → `entities/*/model`(도메인 타입) → ui/features/widgets/pages

| 코드                                                                     | 위치                     |
| ------------------------------------------------------------------------ | ------------------------ |
| 공통 fetch 래퍼, `ApiResponse`/`Paged`/`ApiError`, 서버 DTO 타입, MSW 목 | `shared/api/`            |
| 엔티티별 조회 함수(`getProduct(id)`) + DTO→모델 매퍼                     | `entities/<name>/api/`   |
| 화면이 쓰는 도메인 타입(`Product`)                                       | `entities/<name>/model/` |
| 사용자 행동 단위 로직(옵션 선택, 장바구니 담기)                          | `features/<name>/lib/`   |

- `@shared/api/types`(DTO)는 `entities/*/api`, `entities/*/model`에서만 import한다. 나머지는 엔티티 배럴(`@entities/product`)이 내보내는 모델 타입만 쓴다 — `import-x/no-restricted-paths`로 강제된다.
- DTO는 `shared/api`에 둔다(MSW 목이 DTO를 쓰는데 shared는 entities를 import할 수 없어서).
- 매퍼는 모양이 실제로 다를 때만 만든다(ISO 문자열 → `Date`, `null` 기본값, 필드명 변경). 같으면 `entities/*/model`에서 `export type Product = ProductDetail`로 재노출하고 끝낸다.
- `ApiResponse` 봉투는 fetch 래퍼에서 벗겨 `data`만 돌려주고, 실패는 throw한다 — 호출부에서 `success`를 매번 검사하지 않는다.
- Repository 인터페이스/구현체, DI 컨테이너, `UseCase` 클래스는 만들지 않는다(구현이 하나뿐인 추상화).
- `entities/product/api/`를 첫 기준 구현으로 만든다 — 이후 엔티티는 이 구조를 복사해서 시작한다.

## Error handling

- API 실패는 `apiClient`에서 전부 `ApiRequestError`(`error.code`/`error.message`/`status`)로 정규화된다 — 타임아웃·네트워크는 `status: 0`, JSON이 아닌 응답은 `INVALID_RESPONSE`, 취소는 실패가 아니라 그대로 던진다. 호출부에서 axios 에러를 따로 다루지 않는다.
- `catch`로 받은 값은 `unknown`이다. `.catch((cause: Error) => ...)`처럼 타입을 단언하지 말고, 화면 문구는 `getErrorMessage(caught, '기본 문구')`로 꺼낸다. 분기가 필요하면 `instanceof ApiRequestError`로 좁힌 뒤 `error.code`/`status`를 본다.
- 할 일이 있는 곳에서만 잡는다 — 문구 표시, 롤백, 다른 화면으로 이동. 할 일이 없으면 잡지 말고 위로 던지게 두고, `console.log`만 하고 삼키지 않는다.
- 서버 데이터 **조회**는 `useEffect` + `.then/.catch` + `useState`로 직접 하지 않고 TanStack Query 훅을 쓴다 — 취소(`signal`), 재시도(`queryPolicy`, 4xx는 재시도 안 함), `isError`가 따라온다. 관리자 페이지도 이관을 마쳤다. 예외는 `PaymentCallbackPage` 하나다 — 결제 승인은 조회가 아니라 페이지 진입 시 한 번 보내는 명령이고, `signal`로 중간에 끊기면 돈은 빠졌는데 승인 결과를 모르게 된다.
- mutation(변경)은 자동 재시도하지 않는다(같은 요청이 두 번 반영될 수 있음). 진행 중엔 `isPending`으로 버튼을 막아 중복 제출을 막는다. 화면 반영은 기본이 **서버 확인**(`onSuccess`에서 응답으로 캐시 갱신)이고, 틀려도 되돌리면 그만인 값(장바구니 수량·토글)만 낙관적(`onMutate`)으로 한다 — 기준은 `queryPolicy.ts` 아래쪽 주석에 적어 뒀다.
- "0건"과 "조회 실패"를 구분한다 — 실패를 빈 배열로 대체하지 말고 `undefined`/`isError`로 남겨 실패 문구를 보여준다(`AdminReservationsPage`의 `reservations` 참고).
- 실패 화면은 MSW 핸들러에서 `fail(status, { code, message })`(`@shared/api/mock/response`)로 재현해 확인한다 — 5xx(재시도 후 실패), 4xx(즉시 실패), 지연(타임아웃)을 각각 본다.

## Gotchas

- 텍스트 요소에는 `<p>` 대신 `<div>`/`<span>`을 쓴다 (`<p>`는 사용하지 않는다).
- `maxWidth` + `padding`을 같은 요소에 쓸 땐 `boxSizing: 'border-box'`를 꼭 같이 줘야 한다 — 안 그러면 실제 렌더링 너비가 `maxWidth + padding*2`가 된다 (`Header`/`CategoryNav`에서 겪음).
- hover 시 두꺼워 보이는 효과가 필요하면 `font-weight`를 transition하지 말 것(레이아웃 폭이 흔들림). 대신 `-webkit-text-stroke-color`(transparent → `currentColor`)를 transition — `CategoryNav.css.ts`의 `link` 스타일 참고.
- `mixBlendMode`는 자식까지 한 그룹으로 묶어 backdrop과 blend한다 — 자식에 `mixBlendMode: 'normal'`을 줘도 안 풀린다. 그래서 반전시킬 텍스트 자체에만 걸고, 흰 배경 패널 같은 자식이 들어갈 컨테이너에는 걸지 않는다(`CategoryNav`에서 `links` → `link`로 옮긴 이유 — 안 옮기면 hover 메뉴 배경이 반전된다).
- lucide-react 아이콘은 `color` prop을 직접 주지 않는다(정적 값이라 `:hover`에 반응 안 함). prop을 비워두면 아이콘의 `stroke="currentColor"`가 부모의 CSS `color`를 상속하므로, 부모에서 `color`를 transition하면 hover가 된다.
- `embla-carousel` + `loop: true`로 무한 오토스크롤 캐러셀을 만들 때:
  - flex 슬라이드 컨테이너에 `width`를 명시하지 않는다 (`auto`로 뷰포트 폭만큼만 잡혀야 함). `max-content`를 주면 Embla의 `canLoop()`가 항상 실패해서 `loop`가 조용히 `false`로 폴백되고 오토스크롤 자체가 멈춘다.
  - flex `gap`은 마지막↔첫 슬라이드 사이에는 안 먹는다(Embla/CSS 공통 한계) — 마지막 슬라이드에 `gap`만큼 `margin-right`을 추가로 줘야 이음매 간격이 안 튄다.
  - `AutoScroll` 플러그인과 같이 쓸 땐 `dragFree: true`를 켜야 한다 — 안 그러면 스냅포인트마다 멈칫거린다.
