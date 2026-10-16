// 바로 구매의 Idempotency-Key — 같은 내용으로 다시 보내면(응답을 못 받았거나 결제창을 닫음) 같은 키로 보내
// 기존 주문을 돌려받고, 배송지를 고쳐 내용이 바뀌면 새 키로 새 주문을 만든다(같은 키에 다른 내용은 422).
// 결제 화면을 나갔다 다시 열어도 같은 키를 쓰도록 탭별 sessionStorage에 둔다.
const STORAGE_KEY = 'buy_now_idempotency'

type Saved = { payload: string; key: string }

const load = (): Saved | null => {
  try {
    return JSON.parse(
      sessionStorage.getItem(STORAGE_KEY) ?? 'null',
    ) as Saved | null
  } catch {
    return null
  }
}

// 저장소를 못 쓰면 이 메모리 값으로 화면 안에서라도 같은 키를 쓴다.
let saved = load()

const save = (next: Saved | null) => {
  saved = next
  try {
    if (next) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // 메모리 값은 남는다.
  }
}

export function buyNowKeyFor(body: object): string {
  const payload = JSON.stringify(body)
  if (saved?.payload === payload) return saved.key
  const key = crypto.randomUUID()
  save({ payload, key })
  return key
}

// 결제가 끝났거나(같은 내용을 다시 사면 새 주문이어야 한다) 서버가 키를 거절했을 때 버린다.
export const resetBuyNowKey = () => save(null)
