/**
 * 채울 칸 수 — 전체가 얼마든 칸은 count개로 두고 쓴 비율만큼 채운다. 반올림만 하면 다 썼는데
 * 덜 차 보이거나 조금 썼는데 비어 보여서, 다 쓰면 모두, 덜 썼으면 하나는 비우고, 조금이라도
 * 썼으면 하나는 채운다.
 */
export function usageCells(used: number, total: number, count = 10) {
  const full = used >= total
  const on = full
    ? count
    : Math.min(count - 1, Math.round((used / total) * count))
  return { on: used > 0 ? Math.max(1, on) : 0, full }
}
