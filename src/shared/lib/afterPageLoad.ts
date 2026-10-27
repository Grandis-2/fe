// 첫 화면에 꼭 필요하지 않은 SDK(모니터링·분석)를 페이지 load 뒤로 미룬다 — 바로 받으면 첫 화면
// 코드·폰트와 대역폭을 나눠 써서 화면이 늦게 뜬다(Lighthouse 모바일 기준).
export const afterPageLoad = () =>
  new Promise<void>((resolve) => {
    if (document.readyState === 'complete') resolve()
    else window.addEventListener('load', () => resolve(), { once: true })
  })
