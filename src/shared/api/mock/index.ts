// dev에서만 동작한다. 실제 API로 붙어볼 땐 VITE_USE_MSW=false로 끈다.
export async function startMockWorker() {
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_MSW === 'false') return

  const { worker } = await import('./browser')
  // 핸들러가 없는 요청은 그대로 네트워크로 흘려보낸다(정적 자산 경고 방지).
  await worker.start({ onUnhandledRequest: 'bypass' })
}
