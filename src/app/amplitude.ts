// 사용 행태 분석(Amplitude). VITE_AMPLITUDE_API_KEY가 있을 때만 켠다 — 비워 두면 꺼진다.
// 페이지 이동·클릭·폼 제출은 autocapture가 알아서 남기므로 track()을 따로 부르지 않는다.
// SDK가 커서 켤 때만 따로 받는다 — 바로 import하면 꺼진 배포에도 첫 번들에 실린다.
const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY

if (apiKey) {
  void import('@amplitude/analytics-browser').then((amplitude) =>
    amplitude.init(apiKey, { autocapture: true }),
  )
}
