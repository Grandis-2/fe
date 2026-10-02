# 📱 Nova

> **오픈 직후 신청이 몰려도 사전예약을 유실 없이 접수하고, 외부 시스템 처리를 기다리지 않고 결과를 안내하는 스마트폰 사전예약 플랫폼**  
> 급증 트래픽 대응과 비동기 처리 신뢰성에 집중해 개발한 반응형 웹 서비스입니다.

---

## 🌟 프로젝트 개요

- **서비스명**: **Nova**
- **타겟**: 신규 스마트폰 출시 직후 사전예약을 신청하려는 유저와, 그 접수 흐름을 감시해야 하는 운영자
- **기간**: 약 2개월
- **범위**: 구매자용 쇼핑 화면 + 운영자용 관리자 콘솔. 외부 예약 시스템은 팀이 만든 Mock으로 대체

### 🔍 배경 및 문제 상황

- 오픈 직후 신청이 한꺼번에 몰림 — 목표 규모는 **10초에 5,000건**
- 예약을 확정하려면 외부 예약 시스템에 등록해야 하는데, **평균 500ms가 걸리고 5% 확률로 실패**
- 외부 호출을 요청 안에서 기다리면 줄이 멈추고, 서버가 중단되면 접수된 예약이 공중에 뜸
- 버튼 연타·네트워크 재전송으로 **한 사람이 두 자리를 차지**할 위험
- 우리 기록과 외부 기록이 어긋나도 **운영자가 알아차릴 방법이 없음**

### 🌈 핵심 가치

- **접수와 확정의 분리**: 접수는 순번만 끊어 주고 즉시 응답하고, 외부 등록은 백그라운드에서 처리 — 외부 시스템이 느리거나 죽어도 접수 경로는 독립적으로 동작
- **일시 실패 ≠ 최종 실패**: 자동 재시도로 복구하고, 재시도가 소진되면 운영자가 재처리해서 결국 확정까지 밀어붙임
- **운영자가 볼 수 있는 파이프라인**: 지금 어디서 막혀 있고 사람이 손댈 건 몇 건인지 한 화면에서 확인

---

## ⚙️ 핵심 처리 흐름

```
모델·옵션 선택 → 영속 접수 → 접수 완료·순번 안내 → 백그라운드 외부 등록 → 예약 확정·배송 차수 안내
```

> **접수 완료는 "신청을 안전하게 받았다"는 뜻입니다.** 외부 등록·구매·재고 확보가 끝났다는 뜻이 아닙니다.
> 그래서 화면도 처리 중(`ACCEPTED`)와 확정(`CONFIRMED`)을 다른 상태로 보여줍니다.

접수가 끊어 주는 **순번은 모델마다 1번부터** 독립적으로 부여되고, 그 순번으로 **배송 차수**(1차·2차·3차…)가 결정됩니다. 다른 모델의 신청 때문에 내 순번이 밀리지 않고, 외부 등록이 끝난 순서로 배송을 배정하지도 않습니다.

### 분리하면 생기는 세 가지 문제점

| 숙제       | 대응                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **유실**   | 처리 중 서버가 죽어도 재기동 후 **유실 없이 최종 결과에 도달**해야 하고, 그 과정에서 외부 등록이 중복돼서도 안 됨                             |
| **중복**   | 같은 접수 키·같은 내용이면 새 예약을 만들지 않고 기존 결과를 반환. 업무 규칙은 **모델별 1인 1매** (색상·용량을 바꿔도 추가 불가)              |
| **불일치** | 확정했는데 외부에 등록이 없거나, 취소했는데 외부 등록이 살아 있거나(고아), 외부 예약번호가 둘 생기는 경우를 **정합성 배치**가 양방향으로 대조 |

### 일시 실패를 최종 실패로 취급하지 않습니다

**5%는 외부 호출의 실패율이지, 전체 예약의 5%를 최종 실패시키라는 뜻이 아닙니다.** 일시 실패는 자동 재시도로 복구하고, 재시도로도 안 되면 DLQ에 쌓아 **관리자가 확인하고 재처리**합니다.

DLQ에 들어간 것 자체가 예약의 최종 실패는 아닙니다.

그래서 UI에서 `FAILED`를 '확정 실패'가 아니라 **'재처리 필요'**로 부릅니다. 끝난 게 아니라 손이 필요한 상태라서요.

---

## 👥 팀원 소개

<!-- ⚠️ 담당 내용과 GitHub 핸들을 팀원별로 확인해서 채워 주세요 -->

<table>
  <thead>
    <tr>
      <th width="50%" align="center">김혜진</th>
      <th width="50%" align="center">이주현</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><img src="https://github.com/llmeajinll.png" width="100%"/></td>
      <td align="center"><img src="https://github.com/hana03030.png" width="100%"/></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/llmeajinll">@llmeajinll</a></td>
      <td align="center"><a href="https://github.com/hana03030">@hana03030</a></td>
    </tr>
    <tr>
      <td align="center">구매자 화면 개발(메인, 사전예약 프로모션, 사전예약 옵션 선택, 대기, 결제, 마이페이지), 디자인 토큰·공용 UI, MSW 목 서버</td>
      <td align="center">운영자용 백오피스 개발(상품·재고·배송 구간·사전예약·예약 현황), 디자인 토큰·공용 UI, MSW 목 서버</td>
    </tr>
  </tbody>
</table>

---

## 🛠️ 기술 스택

- **Frontend**: React 19, TypeScript 6, Vite 8
- **Routing**: react-router v7 (`createBrowserRouter`)
- **Styling**: Vanilla Extract + `@vanilla-extract/sprinkles` (zero-runtime CSS-in-TS)
- **Server State**: TanStack Query v5
- **API Mocking**: MSW 2 (Service Worker)
- **Payment**: 토스페이먼츠 SDK (결제창 개별연동)
- **Auth**: 카카오 OAuth
- **Docs & Test**: Storybook 10 + Vitest (Playwright 브라우저 모드)
- **Quality**: ESLint, Prettier, husky + lint-staged, commitlint

---

## 💻 포팅 매뉴얼

로컬 개발 환경에서 프로젝트를 구동하기 위한 설치 및 실행 가이드입니다.

**1. 사전 요구사항**  
`Vite 8` 스펙 구동을 위해 아래 버전 이상이 필요합니다.

- **Node.js**: `v20.19.0` 이상 또는 `v22.12.0` 이상 (개발은 v22.17에서 진행)
- **npm**: `v10.x` 권장

**2. 저장소 클론**

```bash
git clone https://github.com/Grandis-Nova/fe.git
cd fe
```

**3. 의존성 패키지 설치**

```bash
npm install
```

**4. 환경 변수 설정**  
프로젝트 루트에 `.env.local` 파일을 만들고 본인의 발급 키를 입력합니다(`*.local`은 커밋되지 않습니다).

```bash
# 카카오 개발자 콘솔 > 내 애플리케이션 > 앱 키
VITE_KAKAO_OAUTH_REST_API_KEY=YOUR_KAKAO_REST_API_KEY_HERE
VITE_KAKAO_OAUTH_JAVASCRIPT_KEY=YOUR_KAKAO_JAVASCRIPT_KEY_HERE

# 토스 개발자센터 > 내 개발정보 > "API 개별 연동" 테스트 클라이언트 키 (test_ck_...)
VITE_TOSS_PAYMENTS_CLIENT_KEY=YOUR_TOSS_CLIENT_KEY_HERE

```

**5. 개발 서버 실행**

```bash
npm run dev     # http://localhost:5173
```

> ⏳ 서버는 금방 뜨는데 첫 페이지 로드가 1분 가까이 걸릴 수 있습니다.

---

## 📜 스크립트

```bash
npm run dev          # Vite 개발 서버
npm run build        # tsc -b && vite build
npm run preview      # 빌드 결과 미리보기
npm run lint         # eslint .
npm run lint:fix     # eslint . --fix
npm run format       # prettier --check .
npm run format:fix   # prettier --write .
npm run storybook    # Storybook (:6006)

npx vitest --run     # 스토리 기반 테스트 (스토리 55개)
```

`test` 스크립트는 따로 없습니다. 테스트는 Storybook 스토리의 `play` 함수를 Vitest가 실제 브라우저(Chromium)에서 돌리는 방식이라 `npx vitest`로 실행합니다. 처음 돌릴 때 Playwright 브라우저 설치가 필요할 수 있습니다(`npx playwright install chromium`).

---

## 🧩 아키텍처

### Feature-Sliced Design

```
src/app → pages → widgets → features → entities → shared
```

위 레이어는 아래를 import할 수 있고 **그 반대는 안 됩니다.**

`eslint.config.js`의 `import-x/no-restricted-paths`가 강제하니, 잘못 쓰면 lint에서 막힙니다.

| 레이어     | 역할                                                      |
| ---------- | --------------------------------------------------------- |
| `app`      | 라우터, 레이아웃, 전역 스타일, QueryClient                |
| `pages`    | 라우트 하나에 대응하는 화면                               |
| `widgets`  | 여러 화면이 쓰는 큰 조립물 (헤더, 사이드바, 상품 등록 폼) |
| `features` | 사용자 행동 단위 (카카오 로그인, 옵션 선택, 토스 결제)    |
| `entities` | 도메인 모델 + 조회 함수 (상품, 예약, 장바구니, 인증)      |
| `shared`   | 공용 UI, 디자인 토큰, fetch 래퍼, DTO, 훅                 |

**Import 경로 규칙**: 슬라이스 밖은 `@/` 별칭, 슬라이스 안은 상대경로를 씁니다. 슬라이스 안에서 자기 배럴(`@/features/kakao-login`)을 import하면 `index.ts` → 컴포넌트 → `index.ts` 순환이 생기므로 파일을 직접 가리킵니다.

### 데이터 레이어

목적은 하나입니다: **서버 응답 모양(DTO)이 UI까지 새지 않게 해서, API가 바뀌어도 고칠 곳이 `entities/*/api` 하나로 끝나게 한다.**

```
서버 JSON → shared/api → entities/*/api → entities/*/model → ui
             (DTO, fetch)   (DTO→모델)      (도메인 타입)
```

- `@/shared/api/types`(DTO)는 `entities/*/api`, `entities/*/model`에서만 import합니다. 나머지는 엔티티 배럴이 내보내는 모델 타입만 씁니다 — lint로 강제됩니다.
- 매퍼는 모양이 실제로 다를 때만 만듭니다(ISO 문자열 → `Date`, 필드명 변경 등). 같으면 `export type Product = ProductDetail`로 재노출하고 끝냅니다.
- `ApiResponse` 봉투는 fetch 래퍼가 벗겨 `data`만 돌려주고 실패는 throw합니다. 호출부에서 `success`를 매번 검사하지 않습니다.
- Repository 인터페이스, DI 컨테이너, `UseCase` 클래스는 만들지 않습니다(구현이 하나뿐인 추상화).

### 스타일

- 디자인 토큰은 `src/shared/config/theme/tokens/`에 있습니다 — `color`, `typography`, `spacing`, `breakpoint`, `container`, `motion`, `shadow`
- 토큰은 **항상 배럴(`@/shared/config/theme`)에서** 가져옵니다. 개별 토큰 파일을 직접 import하지 않습니다.
- 반응형은 `sprinkles()`로, 기준은 mobile-first에 `desktop = (min-width: 744px)`입니다. **브레이크포인트마다 값이 실제로 다른 속성에만** `sprinkles()`를 쓰고, 고정값은 평범한 `style()`에 둡니다.
- 색은 용도명을 씁니다(`primary.focus`). base 색상 이름이나 생 hex를 하드코딩하지 않습니다.

---

## 📁 폴더 구조

```
src/
├─ app/                      # 앱 조립
│  ├─ layouts/               # RootLayout → MainLayout / AdminLayout
│  ├─ router/                # createBrowserRouter 설정
│  ├─ styles/                # 전역 CSS
│  └─ queryClient.ts
│
├─ pages/                    # 라우트 하나 = 폴더 하나
│  ├─ main/  product-detail/  preorder/  payment/  mypage/ …
│  └─ admin-products/  admin-promotions/  admin-reservations/ …
│
├─ widgets/                  # 큰 조립물
│  ├─ header/  category-nav/  banner/  mobile-tab-bar/
│  └─ admin-sidebar/  admin-product-form/  admin-promotion-form/ …
│
├─ features/                 # 사용자 행동 단위
│  ├─ kakao-login/  toss-payment/  daum-postcode/
│  └─ preorder-queue/  product-purchase/  product-card-select/
│
├─ entities/                 # 도메인
│  └─ product/
│     ├─ api/                # 조회 함수 + DTO→모델 매퍼
│     ├─ model/              # 화면이 쓰는 도메인 타입
│     ├─ ui/ProductCard/     # 컴포넌트는 폴더 단위
│     │  ├─ ProductCard.tsx
│     │  ├─ ProductCard.css.ts
│     │  ├─ ProductCard.stories.tsx
│     │  └─ index.ts
│     └─ index.ts            # 배럴 — 밖에서 들어오는 문
│
└─ shared/
   ├─ api/
   │  ├─ client.ts           # axios 래퍼 (봉투 해제, 401 재발급)
   │  ├─ types/              # 서버 DTO
   │  └─ mock/               # MSW
   │     ├─ handlers/        # 엔드포인트별 핸들러
   │     ├─ fixtures/        # 시드 데이터 (메모리 저장소)
   │     └─ response.ts      # ok / fail 봉투 조립
   ├─ config/
   │  ├─ routes.ts           # 경로 문자열 상수
   │  └─ theme/              # 디자인 토큰, sprinkles
   ├─ lib/                   # 공용 훅·유틸
   ├─ model/                 # 전역 스토어 (모달 등)
   └─ ui/                    # 공용 컴포넌트 28종
```

**컴포넌트 폴더 규칙**: `ui/` 아래에 `.tsx`를 평평하게 두지 않습니다. 컴포넌트마다 폴더를 만들고 `ComponentName.tsx` · `.css.ts` · `.stories.tsx` · `index.ts`를 함께 둡니다.

---

## 🗺️ 라우트

### 구매자

| 경로                              | 화면                                         |
| --------------------------------- | -------------------------------------------- |
| `/`                               | 메인 (배너 캐러셀)                           |
| `/preorder`, `/preorder/:id`      | 사전예약 목록·상세                           |
| `/products/:productId`            | 상품 상세                                    |
| `/payment`, `/payment/callback`   | 결제, 결제 콜백                              |
| `/result`                         | 결제 결과 (`?status=preorder\|paid\|failed`) |
| `/reviews`, `/search`             | 후기, 검색                                   |
| `/signup`, `/auth/kakao/callback` | 가입, 카카오 콜백                            |
| `/mypage`                         | 마이페이지 (`?state=` 탭)                    |

### 관리자

| 경로                                          | 화면                                              |
| --------------------------------------------- | ------------------------------------------------- |
| `/admin`                                      | 홈                                                |
| `/admin/products` · `/new` · `/:productId`    | 상품 관리 — 목록, 등록, 수정(옵션·재고·배송 구간) |
| `/admin/preorders` · `/new` · `/:promotionId` | 사전예약 관리 — 목록, 생성, 수정                  |
| `/admin/orders`                               | 예약 현황 — 대시보드 + 표                         |
| `/admin/consistency-check`                    | 정합성 대조 — **placeholder**                     |
| `/admin/load-test`                            | 부하 검증 — **placeholder**                       |
| `/admin/notifications`                        | 관리자 알림 내역 — **placeholder**                |
| `/admin/mock-settings`                        | Mock 지연·실패율 설정 — **placeholder**           |

경로 문자열은 `src/shared/config/routes.ts`에 모여 있습니다.

레이아웃 분기는 prop이 아니라 `Header` 안에서 `useLocation()`의 pathname으로 판단합니다 — `/`는 배너 위 오버레이, `/products/:id`는 sticky 해제, `/admin*`은 로고를 `NOVA ADMIN`으로 바꾸고 `CategoryNav`를 숨깁니다. 새 분기도 같은 방식으로 추가합니다.

---

## 🧪 API 목 (MSW)

백엔드가 아직 올라오지 않아 **모든 API는 MSW 목으로 동작**합니다. `main.tsx`가 렌더보다 **먼저** worker 등록을 기다립니다.

**관리자 목 계정**: `admin` / `admin1234`

주의할 점 둘:

- **핸들러 순서가 중요합니다.** 구매자용 `/products`가 `*/products`로 컴파일돼서 `/api/v1/admin/products`까지 가로챕니다. MSW는 먼저 일치하는 핸들러를 쓰므로 `handlers/index.ts`에서 admin을 앞에 둡니다.
- **목은 쿠키를 진짜로 심지 못합니다.** 브라우저가 Service Worker의 합성 응답에 담긴 `Set-Cookie`를 무시하는 건 의도된 보안 제약입니다(MSW 한계가 아님). 그래서 핸들러가 `X-Mock-Set-Cookie` 커스텀 헤더로 내려보내고 `mock/browser.ts`가 페이지 쪽에서 대신 심습니다. `HttpOnly`는 흉내낼 수 없습니다.

### 배포 환경에서는 목이 동작하지 않습니다

`startMockWorker()`가 `import.meta.env.DEV`로 걸려 있어서, `vite build` 결과물에는 MSW 코드가 아예 들어가지 않습니다(빌드 산출물 기준 확인). Vercel 같은 배포본에서 관리자 화면을 데이터까지 보려면 게이트를 환경 변수 opt-in으로 바꾸고 미리보기 환경에만 `VITE_USE_MSW=true`를 주는 식이 필요합니다.

---

## ✍️ 커밋 컨벤션

`commitlint` + `husky`로 강제합니다. 본문은 한국어, 제목은 명사형으로 끝냅니다.

```
feat: 배송 구간 설정 탭 구현
fix(NF-18): 수정 저장 후 재고 사라짐 문제
```

- 타입: `feat` `fix` `refactor` `style` `docs` `design` `chore` `test`
- 스코프는 선택이고, 쓸 때는 보통 Jira 이슈 키(`NF-18`)를 넣습니다.
- `pre-commit`에서 `lint-staged`가 변경된 파일만 `eslint --fix` + `prettier --write`로 돌립니다.

---

## ⚠️ 알려진 상태

리드미를 읽고 바로 헷갈릴 만한 것들입니다.

- **결제는 아무거나 눌러도 성공합니다.** 토스 테스트 결제창은 실제로 열리지만(테스트 클라이언트 키라 청구는 일어나지 않습니다), 돌아온 뒤의 승인은 목이 `orderId`와 금액만 대조하고 바로 `DONE`을 돌려줍니다. `paymentKey`는 받기만 하고 검증하지 않습니다 — 진짜 승인은 백엔드가 시크릿 키로 해야 하는데 그 백엔드가 아직 없습니다. **결제가 됐다고 믿을 수 있는 화면이 아닙니다.**
- **관리자 로그인 화면이 없습니다.** `postAdminSession()` API와 목 핸들러는 있지만 연결된 UI가 없어서, `/admin`은 인증 없이 바로 열립니다.
- **사전예약 관리는 UI만 있습니다.** API 명세가 아직 없어 `entities/admin-promotion/model/mock.ts`의 임시 데이터로 돕니다.
- **소셜 로그인은 카카오만 구현됐습니다.** 요구사항은 구글도 포함합니다.
- `prettier --check .`를 저장소 전체에 돌리면 일부 파일이 걸립니다. 누적된 것이라 건드리는 파일만 맞춰 가는 중입니다.

---

## 📚 더 읽을 것

- [`CLAUDE.md`](CLAUDE.md) — 아키텍처 규칙과 실제로 겪은 함정 모음(`mixBlendMode`, Embla 캐러셀, `maxWidth` + `padding` 등). 새 코드를 쓰기 전에 훑어보면 같은 데서 안 넘어집니다.
- [`openwiki/`](openwiki/) — 자동 생성되는 코드 인덱스. 손으로 고치지 않습니다.
- [`AGENTS.md`](AGENTS.md) — OpenWiki 에이전트 안내.

---

## 🔗 웹사이트

<!-- 배포 URL을 넣어 주세요 -->

https://fe-iota-peach.vercel.app/
