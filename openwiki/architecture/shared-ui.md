---
type: architecture
title: shared/ui 컴포넌트 라이브러리
description: shared/ui 프리미티브의 종류와 책임, 아이콘 규칙(lucide DynamicIcon과 PlanetIcon), RootLayout 하나에 띄우는 전역 Modal·Toast와 그 스토어, vaul 기반 BottomSheet, 컴포넌트 폴더 구조와 Storybook 스토리 관례를 설명한다.
tags: [architecture, ui-components, design-system, storybook, modal, toast]
verified:
  - by: openwiki/0.5.0
    at: 2026-10-04T09:44:53.662Z
sources:
  - id: openwiki-source-808b9ff10fba3d7819aa09ab
    resource: repo://.storybook/main.ts
  - id: openwiki-source-dc148dcfd63a2eebc35c0f06
    resource: repo://.storybook/preview.tsx
  - id: openwiki-source-b65fd9a56ff85e721f2d0b4c
    resource: repo://src/app/layouts/RootLayout.tsx
  - id: openwiki-source-bd561f608df9567932e7a433
    resource: repo://src/shared/lib/createStore.ts
  - id: openwiki-source-c5526f4a875c8b4a20ca3989
    resource: repo://src/shared/lib/useObjectUrls.ts
  - id: openwiki-source-e1b64eb4637c8d767ed766a5
    resource: repo://src/shared/model/modalStore.ts
  - id: openwiki-source-c3381dae54734e5ca45fca54
    resource: repo://src/shared/model/toastStore.ts
  - id: openwiki-source-2ceede115a3430c4a9aaf46c
    resource: repo://src/shared/ui/BottomSheet/BottomSheet.css.ts
  - id: openwiki-source-78363aa32feea4375d1eaacf
    resource: repo://src/shared/ui/BottomSheet/BottomSheet.tsx
  - id: openwiki-source-1123826d945230350a137da7
    resource: repo://src/shared/ui/Button/Button.tsx
  - id: openwiki-source-ed5d77266b05639573b26bae
    resource: repo://src/shared/ui/ConfirmDialog/ConfirmDialog.tsx
  - id: openwiki-source-f0eb033e61a8983ce3ceb7c0
    resource: repo://src/shared/ui/ImageUploader/ImageUploader.tsx
  - id: openwiki-source-d131a7da28ef0d717bef8452
    resource: repo://src/shared/ui/index.ts
  - id: openwiki-source-dd59ca091ffa7fb39701d838
    resource: repo://src/shared/ui/InlineAlert/InlineAlert.tsx
  - id: openwiki-source-e85510601c409eda6c588434
    resource: repo://src/shared/ui/Modal/Modal.tsx
  - id: openwiki-source-ddee90b3d3f6b858a71d354e
    resource: repo://src/shared/ui/PriceText/PriceText.tsx
  - id: openwiki-source-6cc4b7a19ebd4655613e7daa
    resource: repo://src/shared/ui/Toast/Toast.tsx
generated: { by: 'claude-code', at: '2026-10-04T09:44:53.662Z' }
---

## 개요

`src/shared/ui/`는 도메인을 모르는 범용 UI 프리미티브 모음이다. 새 컴포넌트를 만들기 전에 여기에
이미 있는지 먼저 확인하는 것이 관례다. 모든 컴포넌트는 `ui/ComponentName/{ComponentName.tsx,
ComponentName.css.ts, ComponentName.stories.tsx, index.ts}` 폴더 구조를 따르고, `shared/ui/index.ts`
배럴로 공개된다(`import { Button, Modal } from '@shared/ui'`). 스타일 값은
[디자인 토큰](design-system.md)에서 온다.

## 구성

| 분류            | 컴포넌트                                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 레이아웃        | `Container`(페이지 표준 폭·여백 계약), `Box`(sprinkles를 `sx` prop으로 받는 div)                                                                       |
| 액션            | `Button`, `SelectButton`, `Toggle`, `Tag`, `Navigator`, `SegmentedTabs`                                                                                |
| 폼              | `Input`, `Textarea`, `Checkbox`, `Dropdown`, `QuantityStepper`, `Calendar`, `DateRangeField`, `ImageUploader`, `FormSection`(작은 제목+설명+내용 묶음) |
| 피드백·오버레이 | `InlineAlert`, `Modal`(+`ModalTitle`), `ConfirmDialog`, `ToastViewport`, `BottomSheet`                                                                 |
| 데이터 표시     | `Table`, `StatCard`, `PriceText`                                                                                                                       |
| 장식·브랜드     | `PlanetIcon`, `SwirlBackground`, `Slider`                                                                                                              |

`PlanetIcon`과 `SwirlBackground`를 빼면 모두 `.stories.tsx`가 있다.

## 아이콘 규칙

- 아이콘은 lucide다. 컴포넌트 안에서 직접 그릴 때는 `lucide-react`의 아이콘 컴포넌트를 쓰고
  `color` prop을 주지 않는다 — `stroke="currentColor"`가 부모 CSS `color`를 따르게 해 hover 전환이
  되게 한다.
- `Button`의 `icon`과 `InlineAlert`의 `icon`은 **lucide 아이콘 이름 문자열**(`IconName`)을 받아
  `lucide-react/dynamic`의 `DynamicIcon`으로 그린다(예: `<Button icon="globe">`). 이름으로 받는 대가로,
  빌드 결과물에 lucide 아이콘 전체가 개별 청크로 포함되고 아이콘이 처음 그려질 때 네트워크로 받아온다.
- 브랜드 행성 아이콘은 lucide에 없어서 `PlanetIcon`(인라인 SVG, `color` 기본 `currentColor`)으로
  그린다. `InlineAlert`와 `widgets/result-hero`는 아이콘 이름 대신 `'box_planet'`을 받으면
  `PlanetIcon`으로 바꿔 그린다.

## 전역 Modal과 Toast

둘 다 **`RootLayout`에 하나만** 렌더해 두고, 여는 쪽은 스토어만 부른다.

- **Modal** — `shared/model/modalStore`(zustand)의 `open(content)`에 내용을 넘긴다
  (`open(<KakaoLoginModal />)`). 한 번에 하나만 열린다. `Modal`은 네이티브 `<dialog>`를 항상 마운트해 두고
  `showModal()`/`close()`로만 여닫는다 — 언마운트하면 닫히는 CSS 애니메이션(`@starting-style`)이
  재생될 기회가 없어서다. backdrop 클릭과 X 버튼이 `onClose`를 부르고, `ModalTitle`이 `aria-labelledby`
  id를 맞춘다. 스토어의 `close()`는 내용을 비우지 않는다(닫히는 220ms 동안 빈 상자가 보이지 않게).
- **ConfirmDialog** — "제목 + 설명 + 확인/취소"만 있는 모달 **내용**이다. 껍데기는 `Modal`이 갖고,
  여는 쪽이 `open(<ConfirmDialog ... />)`로 띄운다.
- **Toast** — `shared/model/toastStore`의 `showToast(message)`. 한 번에 하나만 띄우고, 연달아 부르면
  새 id로 갈아 끼워 등장 애니메이션과 타이머가 처음부터 다시 돈다. `ToastViewport`는 비어 있어도
  `role="status"` `aria-live="polite"` 영역을 항상 그려 둔다(스크린리더가 기존 live region의 변경만
  읽기 때문). 기본 2.5초 뒤 사라지는 애니메이션이 끝나면 목록에서 뺀다.

`toastStore`는 zustand 대신 `shared/lib/createStore`(useSyncExternalStore로 zustand `create()` 모양을
흉내 낸 최소 구현)로 만들었다. 세션 스토어(`entities/auth`)도 같은 헬퍼를 쓴다.

## BottomSheet

`vaul`의 `Drawer`를 얇게 감싼 네임스페이스(`BottomSheet.Root`, `Content`, `Title`, `Close` …)다.
`Root`는 기본값을 `noBodyStyles = true`, `modal = false`로 바꿔 둔다 — vaul이 Safari에서 body를
`position: fixed`로 바꾸며 폭이 줄어드는 문제와, 내부 Radix Dialog가 body 스크롤을 잠그며 고정
요소(헤더 등)와 어긋나는 문제를 피하려고. `modal = false`면 vaul이 오버레이를 그리지 않으므로 `Content`가
닫기 버튼 역할의 오버레이를 직접 그린다. 모바일 하단 탭바 높이(`TAB_BAR_HEIGHT`)만큼 피해야 해서 그
토큰이 `shared/config/theme`에 있다.

## 그 밖의 쓰임새

- **PriceText** — `"2,278,100원"`에서 `원`만 별도 `span`으로 분리한다. 감싸는 요소를 만들지 않아
  부모의 타이포그래피를 그대로 받는다.
- **Table** — 제네릭 `TableProps<T>`. `onRowClick`과 행 끝 화살표 열(`rowAction`)을 지원해 관리자 목록
  화면이 쓴다.
- **ImageUploader** — 미리보기 URL을 `shared/lib/useObjectUrls`로 관리한다. 이 훅은 자기가 만든
  objectURL만 추적해 교체·언마운트 때 해제하고, 서버 이미지 URL은 건드리지 않는다.

## Storybook

`.storybook/main.ts`는 `src/**/*.stories.*`와 `*.mdx`를 읽고 addon-vitest·a11y·docs·mcp를 켠다.
`preview.tsx`는 모든 스토리를 `QueryClientProvider`(재시도 끔)와 `MemoryRouter`로 감싼다. 경로에 따라
모양이 바뀌는 컴포넌트(`Header` 등)는 스토리에서 `parameters: { initialEntries: ['/admin'] }`로 진입
경로를 정한다. Storybook에는 MSW가 없어 쿼리를 쓰는 컴포넌트는 바로 에러 상태가 된다. a11y 검사는
`test: 'todo'`로 위반을 UI에만 표시한다.

## 관련

- [디자인 토큰과 vanilla-extract 스타일 시스템](design-system.md)
- [빌드 및 개발 도구 구성](tooling.md)
- [라우팅과 레이아웃 구성](routing.md) — Modal·Toast를 렌더하는 RootLayout
