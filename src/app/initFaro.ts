import {
  createReactRouterV7DataOptions,
  getWebInstrumentations,
  initializeFaro,
  ReactIntegration,
} from '@grafana/faro-react'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'
import { matchRoutes } from 'react-router'

import { beforeSend } from './faroScrub'

declare const __APP_VERSION__: string

// 무거운 SDK(OpenTelemetry 포함)라 faro.ts가 켤 때만 따로 받아 온다.
export function initFaro(url: string) {
  initializeFaro({
    url,
    app: {
      name: 'nova-web',
      version: __APP_VERSION__,
      environment: 'production',
    },
    sessionTracking: { samplingRate: 1 },
    beforeSend,
    // 화면을 떠나며 취소한 요청은 오류가 아니다
    ignoreErrors: [/CanceledError/, /AbortError/, /ResizeObserver loop/],
    instrumentations: [
      // 이미지 같은 리소스마다 기록이 생겨 양이 많다. 웹 바이탈·페이지 이동은 그대로 남는다
      ...getWebInstrumentations({ enablePerformanceInstrumentation: false }),
      // 빼면 샘플에서 빠진 세션이 "기록하지 않음" traceparent를 붙여 보내고,
      // 백엔드가 그걸 따라 그 세션의 서버 트레이스·요청 지표를 버린다.
      new TracingInstrumentation({
        omitTraceContextForUnsampledSessions: true,
      }),
      new ReactIntegration({
        router: createReactRouterV7DataOptions({ matchRoutes }),
      }),
    ],
  })
}
