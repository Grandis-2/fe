# 파일

- [데이터 레이어: API 클라이언트와 서버 상태](data-layer.md) - shared/api/client.ts의 axios 래퍼가 서버 봉투·인증·타임아웃·401 회복을 어떻게 한곳에서 처리하는지, entities/*/api가 DTO를 모델로 바꾸는 경계, TanStack Query 정책 프리셋과 재시도·폴링 규칙, 화면 쪽 에러 처리 패턴을 설명한다.
- [디자인 토큰과 vanilla-extract 스타일 시스템](design-system.md) - shared/config/theme 아래의 color/typography/spacing/breakpoint/container/motion/shadow 토큰, 배럴이 공개하는 범위, sprinkles 반응형 유틸과 lineClamp 헬퍼, 폰트와 전역 리셋이 실제로 어떻게 쓰이는지 설명한다.
- [Feature-Sliced Design 디렉터리 구조](directory-structure.md) - src/ 하위 FSD 레이어별 현재 슬라이스와 세그먼트 구성, 레이어 별칭(@app~@shared)과 슬라이스 내부 상대경로 규칙, 페이지 평면 구조와 admin-* 이전 구조, eslint가 강제하는 레이어 의존 방향과 DTO import 제한을 설명한다.
- [MSW 목 서버](mock-api.md) - shared/api/mock의 MSW 목 서버가 언제 켜지는지(VITE_USE_MSW), 핸들러·픽스처·봉투 헬퍼 구성, 페이지 컨텍스트에서 돈다는 점을 이용한 쿠키·sessionStorage 처리, 카카오 로그인 우회, ?mock=<status> 강제 에러 스위치를 설명한다.
- [라우팅과 레이아웃 구성](routing.md) - react-router v7 createBrowserRouter 라우트 트리, RootLayout/MainLayout/AdminLayout 중첩과 RequireLogin 게이트, shared/config/routes 경로 상수, Header·MobileTabBar가 pathname으로 화면별 모양을 바꾸는 방식을 설명한다.
- [shared/ui 컴포넌트 라이브러리](shared-ui.md) - shared/ui 프리미티브의 종류와 책임, 아이콘 규칙(lucide DynamicIcon과 PlanetIcon), RootLayout 하나에 띄우는 전역 Modal·Toast와 그 스토어, vaul 기반 BottomSheet, 컴포넌트 폴더 구조와 Storybook 스토리 관례를 설명한다.
- [빌드 및 개발 도구 구성](tooling.md) - Vite·TypeScript·Vanilla Extract 빌드, ESLint·Prettier 품질 도구, Storybook과 브라우저 모드 Vitest, husky·lint-staged·commitlint 커밋 훅, CodeRabbit 리뷰 설정, GitHub Actions(OpenWiki)와 Vercel 배포 설정이 어떻게 연결되는지 설명한다.
