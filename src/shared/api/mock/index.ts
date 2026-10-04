// dev는 기본 on(실제 API로 붙어볼 땐 VITE_USE_MSW=false), 배포(prod)는 VITE_USE_MSW=true일 때만 on.
export const isMockEnabled = import.meta.env.DEV
  ? import.meta.env.VITE_USE_MSW !== 'false'
  : import.meta.env.VITE_USE_MSW === 'true'

export async function startMockWorker() {
  if (!isMockEnabled) return

  const { worker } = await import('./browser')
  // 핸들러가 없는 요청은 그대로 네트워크로 흘려보낸다(정적 자산 경고 방지).
  await worker.start({ onUnhandledRequest: 'bypass' })
}
