/** 1·2·5 단위로 올린 눈금 최댓값 — 그래프 축 숫자가 읽기 쉬운 값이 되게 */
export function niceMax(value: number) {
  if (value <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 5, 10].find((n) => n * power >= value) ?? 10
  return step * power
}
