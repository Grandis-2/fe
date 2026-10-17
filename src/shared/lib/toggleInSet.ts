/** 체크박스 선택처럼 여러 값을 한 번에 켜고 끈 새 Set을 돌려준다(원래 Set은 그대로) */
export function toggleInSet<T>(
  set: ReadonlySet<T>,
  values: readonly T[],
  on: boolean,
): Set<T> {
  const next = new Set(set)
  for (const value of values) {
    if (on) next.add(value)
    else next.delete(value)
  }
  return next
}
