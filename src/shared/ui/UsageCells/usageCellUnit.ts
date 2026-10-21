/** 한 칸이 몇 개인지 — 칸이 maxCells개를 넘지 않게 묶는다 */
export const usageCellUnit = (total: number, maxCells = 20) =>
  Math.max(1, Math.ceil(total / maxCells))

/**
 * 칸 수와 채울 칸 수. 마지막 칸은 한 칸 몫보다 작을 수 있어(상한 101 · 1칸 11이면 마지막 칸은
 * 2) 반올림만 하면 다 썼는데도 덜 차 보인다 — 다 쓰면 모두 채우고, 덜 썼으면 하나는 비운다.
 */
export function usageCells(used: number, total: number, maxCells = 20) {
  const unit = usageCellUnit(total, maxCells)
  const count = Math.ceil(total / unit)
  const full = used >= total
  const on = full ? count : Math.min(count - 1, Math.round(used / unit))
  return { count, on: Math.max(0, on), full }
}
