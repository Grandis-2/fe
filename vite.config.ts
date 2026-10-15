/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
import path from 'node:path'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
const dirname = import.meta.dirname

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  resolve: {
    alias: {
      // FSD 레이어별 별칭 — tsconfig.app.json의 paths와 같이 고친다.
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@widgets': fileURLToPath(new URL('./src/widgets', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@entities': fileURLToPath(new URL('./src/entities', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.grandis-nova.link',
        changeOrigin: true, // Host 를 api.grandis-nova.link 로
        cookieDomainRewrite: 'localhost', // 응답 쿠키(refresh_token)를 localhost 에 저장
        configure: (proxy) => {
          proxy.on('proxyReq', (req) => {
            // 앱의 CORS · 재발급 Origin 검사를 운영 프런트로 통과시킨다 (개발 서버에서만)
            req.setHeader('origin', 'https://www.grandis-nova.link')
            // localhost 의 다른 쿠키(IDE, Auth.js 등)는 넘기지 않는다 — WAF 가 차단한 원인.
            // 관리자 리프레시는 admin_refresh_token 이라 이름을 같이 받는다 — 빼면
            // 관리자 세션이 새로고침마다 끊긴다.
            const keep = String(req.getHeader('cookie') ?? '')
              .split(/;\s*/)
              .filter((c) => /^(admin_)?refresh_token=/.test(c))
            keep.length
              ? req.setHeader('cookie', keep.join('; '))
              : req.removeHeader('cookie')
          })
        },
      },
      // 상품 사진 업로드(S3 presigned PUT)를 개발 서버가 대신 보낸다. 업로드 버킷 CORS가
      // 운영 프런트 도메인만 허용해서 localhost에서 브라우저가 직접 보내면 막힌다 — 같은
      // 주소(/__s3)로 받아 서버끼리 넘기면 CORS 검사가 없다. 운영 빌드엔 프록시가 없고
      // 브라우저가 S3로 직접 올린다(shared/api/presignedUpload.ts가 개발일 때만 주소를 바꾼다).
      // 서명에 host·content-type·content-length가 들어 있어 Host만 버킷으로 맞추고 둘은
      // 그대로 둔다. 버킷이 바뀌면 presignedUpload.ts의 DEV_S3_ORIGIN과 같이 고친다.
      '/__s3': {
        target:
          'https://nova-prod-upload-316708313927.s3.ap-northeast-2.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__s3/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (req) => {
            // 업로드엔 인증·쿠키를 싣지 않는다(명세). localhost 쿠키가 S3로 새지 않게 뺀다.
            req.removeHeader('cookie')
            req.removeHeader('authorization')
            req.removeHeader('origin')
          })
        },
      },
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
        },
      },
    ],
  },
})
