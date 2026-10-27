// 실사용자 모니터링(Grafana Faro). 운영 빌드에 VITE_FARO_URL이 있을 때만 켠다 —
// Vercel Production 환경 변수에만 넣으므로 Preview·로컬·목(MSW) 배포에서는 꺼진다.
// SDK는 첫 번들 절반 가까이 되는 크기라 바로 import하지 않고 켤 때만 따로 받는다 — 첫 화면을
// 막지 않는 대신, SDK가 도착하기 전의 첫 요청엔 traceparent가 붙지 않고 그 사이 오류는 빠진다.
// 라우터 계측(withFaroRouterInstrumentation)은 이동할 때마다 초기화 여부를 보므로 늦게 켜도 된다.
// 받는 것도 페이지 load 뒤로 미룬다 — 웹 바이탈은 SDK가 켜질 때 지난 값까지 읽어 보낸다.
import { afterPageLoad } from '@shared/lib/afterPageLoad'

const url = import.meta.env.VITE_FARO_URL

if (import.meta.env.PROD && url && import.meta.env.VITE_USE_MSW !== 'true') {
  void afterPageLoad()
    .then(() => import('./initFaro'))
    .then((m) => m.initFaro(url))
}
