// 바로 구매의 Idempotency-Key — 같은 내용으로 다시 보내면(응답을 못 받았거나 결제창을 닫음) 같은 키로 보내
// 기존 주문을 돌려받고, 배송지를 고쳐 내용이 바뀌면 새 키로 새 주문을 만든다(같은 키에 다른 내용은 422).
// 결제 화면을 나갔다 다시 열어도 같은 키를 쓰도록 탭별 sessionStorage에 두고, 내용마다 키를 따로 둬서
// 다른 상품을 바로 구매하다 돌아와도 처음 키로 다시 보낸다.
const STORAGE_KEY = 'buy_now_idempotency'

type Entry = { payload: string; key: string; orderId?: string }

const load = (): Entry[] => {
  try {
    const saved: unknown = JSON.parse(
      sessionStorage.getItem(STORAGE_KEY) ?? '[]',
    )
    return Array.isArray(saved) ? (saved as Entry[]) : []
  } catch {
    return []
  }
}

// 저장소를 못 쓰면 이 메모리 값으로 화면 안에서라도 같은 키를 쓴다.
let entries = load()

const save = (next: Entry[]) => {
  entries = next
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 메모리 값은 남는다.
  }
}

export function buyNowKeyFor(body: object): string {
  const payload = JSON.stringify(body)
  const found = entries.find((entry) => entry.payload === payload)
  if (found) return found.key
  const key = crypto.randomUUID()
  save([...entries, { payload, key }])
  return key
}

// 키로 만든 주문을 붙여 둔다 — 결제 승인 화면은 주문 id만 알아서, 그 주문의 키만 골라 버릴 때 쓴다.
export const linkBuyNowOrder = (key: string, orderId: string) =>
  save(
    entries.map((entry) => (entry.key === key ? { ...entry, orderId } : entry)),
  )

// 그 키로는 더 주문하지 않는다 — 결제가 끝났거나(같은 상품을 다시 사면 새 주문이어야 한다),
// 주문이 취소·만료됐거나, 서버가 키를 거절했을 때.
export const forgetBuyNowKey = (
  target: { key: string } | { orderId: string },
) =>
  save(
    entries.filter((entry) =>
      'key' in target
        ? entry.key !== target.key
        : entry.orderId !== target.orderId,
    ),
  )
