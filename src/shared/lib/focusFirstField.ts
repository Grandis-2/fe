/**
 * 화면 순서상 첫 오류 칸으로 스크롤하고 그 안의 입력에 포커스를 둔다. 칸은 감싼 요소의
 * `data-field`로 찾고, 순서는 DOM으로 정한다 — 검사 순서와 화면 순서가 달라도 위에서부터
 * 고치게 된다.
 */
export function focusFirstField(
  form: HTMLElement | null,
  fields: ReadonlySet<string>,
) {
  const target = [
    ...(form?.querySelectorAll<HTMLElement>('[data-field]') ?? []),
  ].find((element) => fields.has(element.dataset.field ?? ''))
  if (!target) return
  target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const focusable = target.matches('input, button, textarea')
    ? target
    : target.querySelector<HTMLElement>(
        'input:not(:disabled), button:not(:disabled), textarea:not(:disabled)',
      )
  // 스크롤은 위에서 부드럽게 한다 — 포커스가 다시 튀어 스크롤하지 않게 막는다.
  focusable?.focus({ preventScroll: true })
}
