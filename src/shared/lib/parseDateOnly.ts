/**
 * 'YYYY-MM-DD'를 로컬 시간대의 그 날 자정으로 읽는다.
 *
 * `new Date('2026-09-20')`은 명세상 UTC 자정으로 해석되는데 Intl 포매터는
 * 로컬 시간대로 찍기 때문에, UTC보다 이른 시간대에서는 하루 전날이 보인다.
 * 날짜만 있는 값(배송일, 노출 기간)은 시간대 개념이 없으므로 로컬로 읽는다.
 */
export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    // 'YYYY-MM-DDTHH:mm' 처럼 시각이 붙은 값은 원래 의미대로 그냥 파싱한다.
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}
