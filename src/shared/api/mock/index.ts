// dev는 기본 on(실제 API로 붙어볼 땐 VITE_USE_MSW=false), 배포(prod)는 VITE_USE_MSW=true일 때만 on.
export const isMockEnabled = import.meta.env.DEV
  ? import.meta.env.VITE_USE_MSW !== 'false'
  : import.meta.env.VITE_USE_MSW === 'true'

export async function startMockWorker() {
  if (isMockEnabled) {
    const { startWorker } = await import('./browser')
    await startWorker('all')
    return
  }
  // 실서버에 붙어도 dev에서는 백엔드에 아직 없는 API(사전예약 프로모션)만 목으로 받는다.
  // 배포에서는 켜지 않는다 — 없는 API는 실패로 보여야 한다.
  if (import.meta.env.DEV) {
    const { startWorker } = await import('./browser')
    await startWorker('pending')
  }
}
