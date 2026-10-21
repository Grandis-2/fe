import { defineConfig, devices } from '@playwright/test'

// E2E는 MSW 목으로만 돈다 — 실서버는 카카오 로그인에 막히고 데이터가 바뀌면 결과도 바뀐다.
// 평소 쓰는 5173(실서버에 붙어 있을 수 있음)과 겹치지 않게 5174에 따로 띄운다.
const PORT = 5174

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // 브라우저 4개가 개발 서버 하나에 붙으면 CPU가 차서(8코어에서 load 20) 결제 승인·대기열이
  // 시간 안에 안 끝난다. 2개여도 전체 시간은 같았다.
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  // 개발 서버가 번들 없이 모듈을 하나씩 내려줘서, 여러 브라우저가 동시에 열면 첫 화면이 몇 초씩 걸린다.
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    // 사전예약 일정은 한국 시간 문자열을 브라우저 시간대로 읽는다.
    timezoneId: 'Asia/Seoul',
    locale: 'ko-KR',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // 프로세스 환경 변수가 .env.local보다 우선한다 — .env.local이 MSW를 꺼 둬도 여기서 켠다.
    // 모니터링·분석은 테스트 기록을 실제로 보내지 않게 끈다. 토스 키는 가짜 SDK(e2e/fixtures.ts)가 받기만 한다.
    env: {
      VITE_USE_MSW: 'true',
      VITE_FARO_URL: '',
      VITE_AMPLITUDE_API_KEY: '',
      VITE_TOSS_PAYMENTS_CLIENT_KEY: 'test_ck_e2e',
      VITE_MOCK_CONFIRM_DELAY_MS: '',
    },
  },
})
