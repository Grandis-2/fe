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
  if (!isMockEnabled) return
  const { startWorker } = await import('./browser')
  await startWorker()
}
