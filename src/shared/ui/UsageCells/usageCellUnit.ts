/** 한 칸이 몇 개인지 — 칸이 maxCells개를 넘지 않게 묶는다 */
export const usageCellUnit = (total: number, maxCells = 20) =>
  Math.max(1, Math.ceil(total / maxCells))
