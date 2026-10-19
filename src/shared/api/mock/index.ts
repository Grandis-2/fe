// dev는 기본 on(실제 API로 붙어볼 땐 VITE_USE_MSW=false), 배포(prod)는 VITE_USE_MSW=true일 때만 on.
export const isMockEnabled = import.meta.env.DEV
  ? import.meta.env.VITE_USE_MSW !== 'false'
  : import.meta.env.VITE_USE_MSW === 'true'

/**
 * 부하 검증의 [시험 시작]·[종료]에 맞춰 목 예약이 저절로 들어오고 처리되게 한다. 목이 꺼져
 * 있으면(실서버) 아무것도 하지 않고, 목 코드도 불러오지 않는다.
 */
export async function setMockLoad(running: boolean) {
  if (!isMockEnabled) return
  const { setLoadSimulation } = await import('./loadSimulation')
  setLoadSimulation(running)
}

export async function startMockWorker() {
  if (isMockEnabled) {
    const { startWorker } = await import('./browser')
    await startWorker('all')
    // 주소에 ?mockScenario=open 을 붙여 열면 오픈 상황(5,000명 · 실패 5%)을 흉내 낸다.
    // 새로 고치면 목 데이터가 처음으로 돌아가므로 다시 붙여 연다.
    if (
      new URLSearchParams(window.location.search).get('mockScenario') === 'open'
    ) {
      const { startOpenScenario } = await import('./openScenario')
      startOpenScenario()
    }
    return
  }
  // 실서버에 붙어도 dev에서는 백엔드에 아직 없는 API(사전예약 프로모션)만 목으로 받는다.
  // 배포에서는 켜지 않는다 — 없는 API는 실패로 보여야 한다.
  if (import.meta.env.DEV) {
    const { startWorker } = await import('./browser')
    await startWorker('pending')
  }
}
