---
type: architecture
title: 빌드 및 개발 도구 구성
description: Vite·TypeScript·Vanilla Extract 빌드, ESLint·Prettier 품질 도구, Storybook과 브라우저 모드 Vitest, husky·lint-staged·commitlint 커밋 훅, CodeRabbit 리뷰 설정, GitHub Actions(OpenWiki)와 Vercel 배포 설정이 어떻게 연결되는지 설명한다.
tags: [architecture, tooling, vite, eslint, storybook, ci, vercel]
verified:
  - by: openwiki/0.5.0
    at: 2026-10-04T09:44:53.662Z
sources:
  - id: openwiki-source-44d77985ad29194abad2384a
    resource: repo://.coderabbit.yaml
  - id: openwiki-source-6d4b4e707b8d60b6ccfa3425
    resource: repo://.github/workflows/openwiki-update.yml
  - id: openwiki-source-cf2bedd52c170bfab2bbf723
    resource: repo://.husky/commit-msg
  - id: openwiki-source-43c41f18d49c25a86be5e9ae
    resource: repo://.husky/pre-commit
  - id: openwiki-source-1911308755a010411fc9869e
    resource: repo://.prettierrc
  - id: openwiki-source-808b9ff10fba3d7819aa09ab
    resource: repo://.storybook/main.ts
  - id: openwiki-source-dc148dcfd63a2eebc35c0f06
    resource: repo://.storybook/preview.tsx
  - id: openwiki-source-0bce0323701d8f46f6287199
    resource: repo://commitlint.config.js
  - id: openwiki-source-276795f6d5ad19adb078c64e
    resource: repo://eslint.config.js
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-c5a2ecd4ab5ca01116080973
    resource: repo://src/app/styles/index.css
  - id: openwiki-source-81cf84df6b5988f0684554d1
    resource: repo://tsconfig.app.json
  - id: openwiki-source-98d5ddb014a0fd4d678f6f2a
    resource: repo://tsconfig.json
  - id: openwiki-source-66b17f07b4ebfe7c85be1d44
    resource: repo://tsconfig.node.json
  - id: openwiki-source-55831e92f29f8b3e9d43f58b
    resource: repo://vercel.json
  - id: openwiki-source-5e1b077422a94ae165e88e4e
    resource: repo://vite.config.ts
generated: { by: 'claude-code', at: '2026-10-04T09:44:53.662Z' }
---

## 개요

Vite가 번들러, TypeScript가 타입 검사기, Vanilla Extract가 CSS-in-TS, ESLint가 린터,
Prettier가 포맷터, Storybook이 컴포넌트 문서화·테스트 도구다. 커밋 단계는 husky 훅이, PR 리뷰는
CodeRabbit이, 배포는 Vercel이 맡는다. lint·build를 PR마다 돌리는 CI 워크플로는 없다 — GitHub
Actions에는 OpenWiki 갱신 워크플로 하나만 있다.

## 스크립트

| 스크립트                        | 명령                                                        |
| ------------------------------- | ----------------------------------------------------------- |
| `dev`                           | `vite`                                                      |
| `build`                         | `tsc -b && vite build` — 타입 검사가 통과해야 번들을 만든다 |
| `lint` / `lint:fix`             | `eslint .` / `eslint . --fix`                               |
| `format` / `format:fix`         | `prettier --check .` / `prettier --write .`                 |
| `preview`                       | 빌드 결과물 미리보기                                        |
| `storybook` / `build-storybook` | `:6006` 개발 서버 / 정적 빌드                               |
| `prepare`                       | `husky`(설치 시 훅 등록)                                    |

`test` 스크립트는 없다.

## Vite

`vite.config.ts`는 `@vitejs/plugin-react`와 `vanillaExtractPlugin()`을 등록하고, `resolve.alias`에
레이어 별칭(`@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared`)을 정의한다 —
`tsconfig.app.json`의 `paths`와 같이 고쳐야 한다. dev 서버 proxy나 API `baseURL` 설정은 없다.

`test.projects`에는 `@storybook/addon-vitest`의 `storybookTest()` 프로젝트가 하나 있어,
`.storybook` 설정 기준으로 스토리를 브라우저 모드 Vitest(`@vitest/browser-playwright`, headless
Chromium)로 실행한다. 즉 스토리와 그 `play` 함수가 곧 테스트다. 별도 단위 테스트 파일은 없다.

## TypeScript

`tsconfig.json`은 파일을 직접 포함하지 않고 두 project reference를 묶는다.

- `tsconfig.app.json` — `src/`용. `moduleResolution: "bundler"`, `jsx: "react-jsx"`, `noEmit: true`,
  `noUnusedLocals`/`noUnusedParameters`, `erasableSyntaxOnly`, 레이어 별칭 `paths`.
  TypeScript는 `~6.0`이다.
- `tsconfig.node.json` — `vite.config.ts`만 Node 컨텍스트로 검사한다.

## ESLint와 Prettier

린터는 `eslint.config.js`(flat config) 하나다. `typescript-eslint`, `react-hooks`, `react-refresh`,
`import-x`, `unused-imports`, `eslint-plugin-storybook`을 조합하고 마지막에 `eslint-config-prettier`로
스타일 규칙을 끈다. 주요 규칙:

- `import-x/order` — `react` → 외부 → 레이어 별칭 → 상대경로 → 타입 순, 그룹 사이 빈 줄, 알파벳 정렬.
- `import-x/no-restricted-paths` — FSD 레이어 방향과 DTO import 제한
  ([디렉터리 구조](directory-structure.md) 참고).
- `unused-imports/*` — 안 쓰는 import는 error, 안 쓰는 변수는 `_` 접두사면 허용.
- `import-x/no-cycle`은 warn.

`public/mockServiceWorker.js`(MSW 생성 파일)와 `eslint.config.js` 자신은 검사에서 뺀다. `.storybook/`은
Node 전역과 `tsconfig.node.json` resolver로 따로 검사한다.

Prettier 설정(`.prettierrc`)은 `singleQuote: true`, `semi: false`뿐이다.

## 커밋 훅: husky · lint-staged · commitlint

- `pre-commit` — `npx lint-staged`. 스테이징된 `*.{js,jsx,ts,tsx}`에 `eslint --fix` + `prettier --write`,
  `*.{json,md,yml,yaml,css}`에 `prettier --write`.
- `commit-msg` — `commitlint`. `@commitlint/config-conventional`을 기반으로 type을 `feat`, `fix`,
  `refactor`, `style`, `docs`, `design`, `chore`, `test`로 제한하고, 한글 커밋이라 `subject-case`를 끈다.
  scope는 선택이며 보통 Jira 키를 쓴다(`feat(NF-18): ...`).

훅은 로컬에서만 돈다(`--no-verify`로 건너뛸 수 있다).

## 리뷰: CodeRabbit과 PR 템플릿

`.coderabbit.yaml`은 `main`/`develop` 대상 PR을 한국어로 자동 리뷰한다(draft 제외, 제목에 `[WIP]`·
`[skip review]`가 있으면 건너뜀, `assertive` 프로필, 지적이 남으면 Request changes). `path_instructions`가
레이어별(`shared`, `entities`, `features`, `widgets/pages`)·파일 종류별(`*.css.ts`, `*.tsx`, 스토리,
`shared/api`, `app`, `package.json`, ESLint 설정, 워크플로) 리뷰 기준을 CLAUDE.md 규칙에 맞춰 적어 둔다 —
둘이 어긋나면 CLAUDE.md가 기준이라고 명시한다. 테스트 생성 지침은 "테스트 러너가 없으니 스토리와 `play`
함수를 만든다"이다.

`.github/pull_request_template.md`는 PR 제목을 commitlint와 같은 형식으로 쓰게 하고, 관련 이슈·작업
내용·스크린샷(또는 스토리 `play` 통과)·리뷰 포인트 칸을 둔다.

## GitHub Actions: OpenWiki

`.github/workflows/openwiki-update.yml`은 매일 08:00 UTC와 수동 실행(`workflow_dispatch`)에
`openwiki code --update`를 돌려 `openwiki/` 위키를 갱신하고, 결과를 `openwiki/update` 브랜치의
PR(`docs: update OpenWiki`)로 올린다. 실패해도 그때까지 완료된 페이지는 PR에 남긴다. 저장소 시크릿
`OPENAI_API_KEY`가 필요하다.

## 배포: Vercel

`vercel.json`은 모든 경로를 `/index.html`로 rewrite하는 SPA 설정 하나뿐이다. 그래서 `/api/*` 같은
경로도 HTML로 응답한다 — 실서버를 붙일 때는 API 경로를 rewrite 앞에 따로 두거나 API 주소를 분리해야
한다. 배포본에서 목 데이터를 쓰려면 `VITE_USE_MSW=true` 환경 변수를 준다([MSW 목 서버](mock-api.md)).

## 관련

- [Feature-Sliced Design 디렉터리 구조](directory-structure.md)
- [디자인 토큰과 vanilla-extract 스타일 시스템](design-system.md)
- [shared/ui 컴포넌트 라이브러리](shared-ui.md) — Storybook 데코레이터
- [빠른 시작](../quickstart.md)
