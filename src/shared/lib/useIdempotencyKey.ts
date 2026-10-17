import { useRef } from 'react'

/**
 * 만들기 요청의 Idempotency-Key. 응답을 받을 때까지 키를 유지해, 응답을 못 받았거나
 * 서버 장애로 실패한 뒤 같은 본문을 다시 보내면 같은 키를 쓴다 — 서버는 처음 결과를
 * 돌려준다.
 *
 * 결과를 모르는 채 본문이 바뀌면 키를 주지 않고 null을 돌려준다. 같은 키로는 거절되거나
 * 무시되고, 새 키로 보내면 이전 요청이 반영됐을 때 둘이 된다 — 호출부가 확인받은 뒤
 * forget()으로 키를 버린다. 응답을 받았거나 만들어지지 않은 게 확실한 실패에도 forget()한다.
 */
export function useIdempotencyKey() {
  const pendingRef = useRef<{ key: string; body: string } | null>(null)

  return {
    keyFor: (request: unknown) => {
      const body = JSON.stringify(request)
      const pending = pendingRef.current
      if (pending && pending.body !== body) return null
      const key = pending?.key ?? crypto.randomUUID()
      pendingRef.current = { key, body }
      return key
    },
    forget: () => {
      pendingRef.current = null
    },
  }
}
