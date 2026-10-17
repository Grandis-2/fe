/** ms만큼 기다린다 — 재시도·폴링 간격에 쓴다 */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))
