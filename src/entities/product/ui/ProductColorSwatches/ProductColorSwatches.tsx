import { typography } from '@shared/config/theme'

import * as styles from './ProductColorSwatches.css'

// shared/ui의 Button은 "행동을 실행"하는 CTA(확인, 제출 등)용이라 라벨/색상 팔레트 API를 갖는다.
// 반면 이 컴포넌트는 여러 옵션 중 하나를 고르는 선택 상태(라디오에 가까움)라 성격이 달라서
// Button을 재사용하지 않고 분리했다 — 그래서 선택 여부를 aria-pressed로 표현한다.

const colorNameTypography = {
  small: typography.body.caption,
  medium: typography.body.subMedium,
}

export type ProductColorSwatchItem = {
  hex: string
  label?: string
  selected?: boolean
}

export type ProductColorSwatchesProps = {
  colorName: string
  colors: ProductColorSwatchItem[]
  size?: 'small' | 'medium'
  onSelect?: (index: number) => void
  className?: string
}

export function ProductColorSwatches({
  colorName,
  colors,
  size = 'small',
  onSelect,
  className,
}: ProductColorSwatchesProps) {
  const selectedLabel = colors.find((item) => item.selected)?.label ?? colorName

  return (
    <div className={[styles.root[size], className].filter(Boolean).join(' ')}>
      {size === 'medium' && (
        <div className={[typography.title.mdSemibold, styles.label].join(' ')}>
          색상
        </div>
      )}
      {/* medium은 선택 색 이름 한 줄 대신 모든 색 이름을 동그라미 아래에 보여준다. */}
      {size === 'small' && (
        <div
          className={[colorNameTypography.small, styles.colorName].join(' ')}
        >
          {selectedLabel}
        </div>
      )}
      <div className={styles.swatchRow[size]}>
        {colors.map((item, index) => (
          <button
            key={`${item.hex}-${index}`}
            type="button"
            title={item.label}
            disabled={!onSelect}
            aria-pressed={onSelect ? item.selected : undefined}
            className={[
              styles.swatchButton,
              onSelect && styles.swatchInteractive,
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onSelect?.(index)}
          >
            <span
              className={[
                styles.swatch[size],
                item.selected && styles.swatchSelected,
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                background: item.hex,
                // small(카드)은 선택 테두리를 그 색으로 — medium은 swatchSelected의 강조색 링.
                ...(item.selected && size === 'small'
                  ? { outline: `1.5px solid ${item.hex}` }
                  : {}),
              }}
            />
            {size === 'medium' && item.label && (
              <span
                className={[
                  typography.body.sub,
                  styles.swatchLabel,
                  item.selected && styles.swatchLabelSelected,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {item.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
