import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

import { ChevronDown, ChevronUp } from 'lucide-react'

import * as styles from './Dropdown.css'

/**
 * 화면에 찍을 글자와 호출부가 실제로 다루는 값을 함께 들고 다닌다.
 * 글자만 받으면 호출부가 문자열이나 인덱스로 값을 되짚어야 해서, 라벨을 바꾸는
 * 순간 조용히 깨진다.
 */
export type DropdownOption<TValue> = {
  label: string
  value: TValue
}

export type DropdownProps<TValue> = {
  /** 고른 게 없을 때 트리거에 보이는 문구 */
  label: string
  options: readonly DropdownOption<TValue>[]
  value?: TValue
  size?: 'medium' | 'small'
  width?: string
  /** 열림 상태를 밖에서 쥘 때만 준다. 안 주면 컴포넌트가 직접 들고 여닫는다 */
  open?: boolean
  onToggle?: () => void
  onSelect?: (value: TValue) => void
  className?: string
}

/**
 * 열림 상태를 두 가지로 쓸 수 있다.
 * - `open`을 안 주면 컴포넌트가 직접 들고 여닫는다(바깥 클릭·Esc 포함).
 * - `open`을 주면 그 상태는 호출부 것이다. 닫아야 할 때 `onToggle`로 알리기만 하고
 *   여기서 바꾸지 않는다 — 양쪽이 같이 바꾸면 두 번 닫힌다.
 */
export function Dropdown<TValue>({
  label,
  options,
  value,
  size = 'medium',
  width,
  open,
  onToggle,
  onSelect,
  className,
}: DropdownProps<TValue>) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const isControlled = open !== undefined
  const isOpen = open ?? uncontrolledOpen

  const optionButtons = () => [
    ...(menuRef.current?.querySelectorAll('button') ?? []),
  ]

  // 방향키로 열면 메뉴는 다음 렌더에 그려진다 — 지금 focus()를 불러도 닿을 요소가
  // 없어서, 어느 끝으로 갈지만 적어 두고 아래 이펙트에서 옮긴다.
  const pendingFocus = useRef<'first' | 'last' | null>(null)

  // 밖에서 쥐고 있으면 상태는 그쪽 것이다 — 바꿔 달라고 알리기만 한다.
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next)
    else if (next !== open) onToggle?.()
  }

  // setOpen은 매 렌더 새로 만들어진다 — Effect Event로 감싸야 이펙트가 [isOpen]에만
  // 반응한다. 안 그러면 메뉴가 열려 있는 동안 리렌더마다 리스너를 떼었다 붙인다.
  const handlePointerDown = useEffectEvent((event: PointerEvent) => {
    if (rootRef.current?.contains(event.target as Node)) return
    setOpen(false)
  })
  const handleEscape = useEffectEvent((event: globalThis.KeyboardEvent) => {
    if (event.key !== 'Escape') return
    setOpen(false)
    // 닫고 나면 포커스가 사라진 메뉴에 남는다 — 트리거로 되돌린다.
    triggerRef.current?.focus()
  })

  // 열려 있는 동안만 문서를 듣는다. 메뉴 밖을 누르거나 Esc를 누르면 닫는다 —
  // 둘 다 없으면 메뉴를 열어둔 채 다른 곳을 눌러도 계속 떠 있다.
  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (event: PointerEvent) => handlePointerDown(event)
    const onKeyDown = (event: globalThis.KeyboardEvent) => handleEscape(event)

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  // 방향키로 열었으면 그 끝 항목으로 포커스를 옮긴다. 트리거에 남겨 두면 이어서
  // 누른 Enter가 항목을 고르지 않고 메뉴만 닫는다.
  useEffect(() => {
    if (!isOpen || !pendingFocus.current) return
    const items = optionButtons()
    const target = pendingFocus.current === 'first' ? items[0] : items.at(-1)
    pendingFocus.current = null
    target?.focus()
  }, [isOpen])

  /**
   * 위/아래 키로 항목 사이를 옮긴다. 트리거와 항목을 다 감싸는 루트에서 받아야
   * 닫힌 상태(포커스가 트리거)에서도 같은 키로 열 수 있다.
   */
  const handleArrowKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()

    if (!isOpen) {
      pendingFocus.current = event.key === 'ArrowDown' ? 'first' : 'last'
      setOpen(true)
      return
    }

    const items = optionButtons()
    if (items.length === 0) return

    // 트리거에 포커스가 있으면 -1이라, 아래 키는 첫 항목부터 시작한다.
    const current = items.indexOf(document.activeElement as HTMLButtonElement)
    const next =
      event.key === 'ArrowDown'
        ? (current + 1) % items.length
        : current <= 0
          ? items.length - 1
          : current - 1
    items[next].focus()
  }

  const select = (option: DropdownOption<TValue>) => {
    onSelect?.(option.value)
    setOpen(false)
    // 고른 항목 버튼은 메뉴가 닫히면서 사라진다 — 포커스가 갈 곳을 잃지 않게
    // 트리거로 되돌린다(Esc로 닫을 때와 같은 자리).
    triggerRef.current?.focus()
  }

  const selectedLabel = options.find((option) => option.value === value)?.label

  return (
    <div
      ref={rootRef}
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={width ? { width } : undefined}
      onKeyDown={handleArrowKey}
    >
      <div
        className={[styles.box, styles.size[size], isOpen && styles.boxOpen]
          .filter(Boolean)
          .join(' ')}
      >
        <button
          ref={triggerRef}
          type="button"
          className={styles.trigger[size]}
          onClick={() => setOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          <span className={styles.triggerLabel}>{selectedLabel ?? label}</span>
          {isOpen ? (
            <ChevronUp
              className={styles.triggerIcon[size]}
              aria-hidden="true"
            />
          ) : (
            <ChevronDown
              className={styles.triggerIcon[size]}
              aria-hidden="true"
            />
          )}
        </button>
      </div>
      {isOpen && (
        <div
          ref={menuRef}
          className={[styles.menu, styles.menuSize[size]].join(' ')}
        >
          {options.map((option, index) => (
            // 라벨이 겹칠 수 있다(이름이 같은 상품 등). 문자열을 key로 쓰면
            // React가 항목을 건너뛰거나 겹쳐 그린다 — 위치로 구분한다.
            <button
              key={`${index}-${option.label}`}
              type="button"
              className={[
                styles.option[size],
                // 값으로 비교한다 — 라벨로 비교하면 이름이 같은 항목이 같이 켜진다.
                option.value === value && styles.optionSelected,
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => select(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
