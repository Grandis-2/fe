<!-- OPENWIKI:START -->

## OpenWiki

See [AGENTS.md](AGENTS.md) for OpenWiki agent instructions.

<!-- OPENWIKI:END -->

기능 전반의 흐름을 설명하거나 코드 위치를 모를 때는 `openwiki/index.md`부터 확인한다. 위키는 정기 갱신이라 최근 변경이 빠져 있을 수 있으니, 코드를 고칠 땐 소스가 기준이다.

경로별 상세 규칙은 `.claude/rules/`에 있다 — 해당 경로 파일을 다룰 때 자동으로 읽힌다(`styling` → `*.css.ts`, `data-layer` → `entities`/`shared/api`, `routing` → `app`/`header`, `jsx` → `*.tsx`).

## Commands

```bash
npm run dev             # Vite dev server
npm run build            # tsc -b && vite build
npm run lint              # eslint .
npm run lint:fix          # eslint . --fix
npm run storybook         # Storybook dev server on :6006
npm run format:fix        # prettier --write .
```

- 테스트 러너는 없다 — 검증은 `npm run lint` + `npm run build` + 브라우저 확인.
- 커밋 시 husky가 commitlint(`feat:`/`fix:`/`test:` …)와 lint-staged(eslint --fix, prettier)를 돌린다.
- MSW는 dev에서 기본 on이다. 실제 API에 붙이려면 `.env.local`에 `VITE_USE_MSW=false`.

## Architecture

- **Feature-Sliced Design**: `src/app` → `pages` → `widgets` → `features` → `entities` → `shared`. Higher layers may import lower layers, never the reverse — enforced by `import-x/no-restricted-paths` in `eslint.config.js`.
- **Import 경로**: 슬라이스(`features/login`, `entities/product` 등) 밖은 레이어별 별칭(`@app`/`@pages`/`@widgets`/`@features`/`@entities`/`@shared`), 슬라이스 안은 상대경로를 쓴다(`../../lib/usePreorderQueue`, `./Modal.css`). `@/` 같은 src 통째 별칭은 쓰지 않는다. 별칭을 추가·변경할 땐 `tsconfig.app.json`의 `paths`와 `vite.config.ts`의 `alias`를 같이 고친다. 슬라이스 안에서 자기 배럴(`@features/login`)을 import하면 `index.ts` → 컴포넌트 → `index.ts` 순환이 생기므로 파일을 직접 가리킨다 — 배럴은 밖에서 들어오는 문이다.
- **Pages**: 페이지는 라우트 하나에 대응하는 조립만 한다. `pages/<name>/` 아래에 `XxxPage.tsx`(+`.css.ts`)를 평평하게 두고 `ui/`·`index.ts`를 만들지 않는다(라우터가 `@pages/main/MainPage`처럼 파일을 직접 import). 페이지 안에서 쓰는 하위 컴포넌트는 페이지 폴더에 두지 말고 `widgets`/`features`로 뺀다(예: 이미지 슬라이더+미리보기 → `features/product-gallery`). 관리자 페이지(`admin-*`)는 아직 이전 구조(`ui/` + `index.ts`)다.
- **Segment**: hook(`useXxx`)은 `model/`에 두지 않는다 — `model/`은 타입·상수·스토어만, hook은 `lib/`에 둔다. TanStack Query 훅은 `entities/*/api/`에 둔다.
- **Feature 이름**: 기능 단위로 짓고 기술명을 쓰지 않는다(`login`, `payment`, `address-search` — `kakao-login`, `toss-payment` X). 슬라이스 안 파일명은 실제 구현을 드러내도 된다(`KakaoLoginModal`).
- **Reuse before adding**: 새 컴포넌트/타입/색상을 만들기 전에 `shared/ui`, 관련 `entities/*` 슬라이스, `shared/config/theme`(특히 `color.*` 토큰)에 이미 있는지부터 확인한다. 실제로 겪은 사례 — 거의 동일한 타입을 두 군데(`ProductColorSwatch`/`ProductColorSwatchItem`)에 따로 선언, 이미 있는 `color.background.surface` 대신 생 hex 값을 하드코딩. 구조가 겹치는 타입(필드 일부만 빠짐/전부 optional/키로 매핑 등)은 새로 손으로 적지 말고 `Pick`/`Omit`/`Partial`/`Record` 같은 유틸리티 타입으로 기존 타입에서 파생시킨다 — 단, 호출부가 하나뿐인데 제네릭을 억지로 붙이는 건 과한 설계다.
- **컴포넌트 폴더 구조**: `entities/*/ui/`(다른 레이어도 컴포넌트가 여러 개면 동일하게 적용) 안에서 컴포넌트를 `ui/ComponentName.tsx`처럼 평평하게 두지 않는다. 컴포넌트마다 `ui/ComponentName/` 폴더를 만들고 그 안에 `ComponentName.tsx`, `ComponentName.css.ts`, `ComponentName.stories.tsx`와 `export * from './ComponentName'`만 있는 `index.ts`를 넣는다. `index.ts` 덕분에 엔티티 배럴(`entities/*/index.ts`)의 `from './ui/ComponentName'` import는 그대로 유지된다 — 새 컴포넌트를 추가할 때도 처음부터 이 구조로 만든다.

## Error handling

- API 실패는 `apiClient`에서 전부 `ApiRequestError`(`error.code`/`error.message`/`status`)로 정규화된다 — 타임아웃·네트워크는 `status: 0`, JSON이 아닌 응답은 `INVALID_RESPONSE`, 취소는 실패가 아니라 그대로 던진다. 호출부에서 axios 에러를 따로 다루지 않는다.
- `catch`로 받은 값은 `unknown`이다. `.catch((cause: Error) => ...)`처럼 타입을 단언하지 말고, 화면 문구는 `getErrorMessage(caught, '기본 문구')`로 꺼낸다. 분기가 필요하면 `instanceof ApiRequestError`로 좁힌 뒤 `error.code`/`status`를 본다.
- 할 일이 있는 곳에서만 잡는다 — 문구 표시, 롤백, 다른 화면으로 이동. 할 일이 없으면 잡지 말고 위로 던지게 두고, `console.log`만 하고 삼키지 않는다.
- 서버 데이터 조회는 `useEffect` + `.then/.catch` + `useState`로 직접 하지 않고 TanStack Query 훅을 쓴다 — 취소(`signal`), 재시도(`queryPolicy`, 4xx는 재시도 안 함), `isError`가 따라온다. 관리자 페이지(`admin-*`)는 아직 이전 방식이다.
- mutation(변경)은 자동 재시도하지 않는다(같은 요청이 두 번 반영될 수 있음). 진행 중엔 `isPending`으로 버튼을 막아 중복 제출을 막는다.
- "0건"과 "조회 실패"를 구분한다 — 실패를 빈 배열로 대체하지 말고 `undefined`/`isError`로 남겨 실패 문구를 보여준다(`AdminReservationsPage`의 `reservations` 참고).
