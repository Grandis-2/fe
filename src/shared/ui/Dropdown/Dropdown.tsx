import { useState } from 'react'

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
  const isOpen = open ?? uncontrolledOpen

  const toggle = () => {
    if (onToggle) onToggle()
    if (open === undefined) setUncontrolledOpen((prev) => !prev)
  }

  const select = (option: DropdownOption<TValue>) => {
    onSelect?.(option.value)
    // 밖에서 쥐고 있으면 닫는 것도 그쪽 몫이다 — 여기서 닫으면 두 번 닫힌다.
    if (open === undefined) setUncontrolledOpen(false)
  }

  const selectedLabel = options.find((option) => option.value === value)?.label

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={width ? { width } : undefined}
    >
      <div
        className={[styles.box, styles.size[size], isOpen && styles.boxOpen]
          .filter(Boolean)
          .join(' ')}
      >
        <button
          type="button"
          className={styles.trigger[size]}
          onClick={toggle}
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
        <div className={[styles.menu, styles.menuSize[size]].join(' ')}>
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
