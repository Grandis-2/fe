import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

import { EllipsisVertical } from 'lucide-react'

import * as styles from './ActionMenu.css'

export type ActionMenuItem = {
  label: string
  onSelect: () => void
  /** 지금 누를 수 없는 이유. 있으면 항목이 막히고 이유가 아래에 보인다 */
  disabledReason?: string
  /** 되돌리기 어려운 동작 — 글자를 위험 색으로 둔다 */
  danger?: boolean
}

export type ActionMenuProps = {
  /** ⋮ 버튼의 접근 가능한 이름. 아이콘뿐이라 없으면 무슨 버튼인지 읽히지 않는다 */
  label: string
  items: readonly ActionMenuItem[]
  /** 요청이 도는 중 — 같은 동작을 두 번 보내지 않게 버튼을 막는다 */
  disabled?: boolean
  className?: string
}

/**
 * ⋮ 버튼으로 여는 동작 메뉴. 값을 고르는 Dropdown과 달리 고르면 바로 동작이 실행되고
 * 선택 상태가 남지 않는다.
 *
 * 키보드는 메뉴 버튼 패턴을 따른다 — 열면 첫 항목으로 포커스가 가고, 위/아래·Home·End로
 * 옮기고, Esc·Tab·바깥 클릭으로 닫는다. 닫힐 때 포커스는 ⋮ 버튼으로 돌아온다.
 */
export function ActionMenu({
  label,
  items,
  disabled = false,
  className,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  // 열린 다음 렌더에야 항목이 생긴다 — 어느 끝으로 갈지 적어 두고 이펙트에서 옮긴다.
  const pendingFocus = useRef<'first' | 'last' | null>(null)

  const menuItems = () => [
    ...(menuRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]',
    ) ?? []),
  ]

  const close = (restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  const handlePointerDown = useEffectEvent((event: PointerEvent) => {
    if (rootRef.current?.contains(event.target as Node)) return
    close(false)
  })

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => handlePointerDown(event)
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open || !pendingFocus.current) return
    const list = menuItems()
    const target = pendingFocus.current === 'first' ? list[0] : list.at(-1)
    pendingFocus.current = null
    target?.focus()
  }, [open])

  const openAt = (edge: 'first' | 'last') => {
    pendingFocus.current = edge
    setOpen(true)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      close(true)
      return
    }
    // Tab은 막지 않는다 — 메뉴를 닫고 다음 요소로 넘어가게 둔다.
    if (event.key === 'Tab' && open) {
      close(false)
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()

    if (!open) {
      openAt(event.key === 'ArrowUp' || event.key === 'End' ? 'last' : 'first')
      return
    }
    const list = menuItems()
    if (list.length === 0) return
    const current = list.indexOf(document.activeElement as HTMLButtonElement)
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? list.length - 1
          : event.key === 'ArrowDown'
            ? (current + 1) % list.length
            : current <= 0
              ? list.length - 1
              : current - 1
    list[next].focus()
  }

  const select = (item: ActionMenuItem) => {
    if (item.disabledReason) return
    close(true)
    item.onSelect()
  }

  return (
    <div
      ref={rootRef}
      className={[styles.root, className].filter(Boolean).join(' ')}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? close(false) : openAt('first'))}
      >
        <EllipsisVertical className={styles.triggerIcon} aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          className={styles.menu}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              // disabled 대신 aria-disabled — 막힌 항목도 포커스를 받아야 이유를 읽을 수 있다.
              aria-disabled={item.disabledReason ? true : undefined}
              className={[
                styles.item,
                item.danger && styles.itemDanger,
                item.disabledReason && styles.itemDisabled,
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => select(item)}
            >
              <span>{item.label}</span>
              {item.disabledReason && (
                <span className={styles.reason}>{item.disabledReason}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
