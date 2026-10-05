import { Plus, X } from 'lucide-react'

import {
  createColorOption,
  type ProductColorOption,
} from '@entities/admin-product'
import { Checkbox, ImageUploader, Input } from '@shared/ui'

import * as fields from '../fields.css'

import * as styles from './ColorOptionEditor.css'

export type ColorOptionEditorProps = {
  colors: ProductColorOption[]
  onChange: (colors: ProductColorOption[]) => void
}

export function ColorOptionEditor({
  colors,
  onChange,
}: ColorOptionEditorProps) {
  // '색상 없음'인 상품은 색상을 더 만들 수 없다.
  const hasNoColor = colors.some((colorOption) => colorOption.noColor)

  const patchColor = (id: string, partial: Partial<ProductColorOption>) =>
    onChange(
      colors.map((colorOption) =>
        colorOption.id === id ? { ...colorOption, ...partial } : colorOption,
      ),
    )

  return (
    <div className={styles.root}>
      {colors.map((colorOption) => (
        <div key={colorOption.id} className={styles.colorBlock}>
          {/* 제목과 삭제 버튼을 한 줄에 둔다. */}
          <div className={styles.blockHeader}>
            <span className={styles.sectionLabel}>색상</span>
            <button
              type="button"
              className={styles.removeButton}
              aria-label={`색상 ${colors.indexOf(colorOption) + 1} 삭제`}
              onClick={() =>
                onChange(colors.filter((item) => item.id !== colorOption.id))
              }
            >
              <X className={styles.removeIcon} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.colorRow}>
            <label
              className={colorOption.hex ? styles.swatch : styles.swatchEmpty}
              style={
                colorOption.hex ? { background: colorOption.hex } : undefined
              }
            >
              <span className={styles.srOnly}>색상 선택</span>
              <input
                type="color"
                className={styles.swatchInput}
                // input[type=color]는 빈 값을 못 받아서 미선택일 때 검정을 넘긴다.
                value={colorOption.hex || '#000000'}
                onChange={(event) =>
                  patchColor(colorOption.id, {
                    hex: event.target.value.toUpperCase(),
                  })
                }
              />
            </label>
            <Input
              className={fields.fixedField}
              size="small"
              label="색상 입력"
              value={colorOption.name}
              disabled={colorOption.noColor}
              onChange={(event) =>
                patchColor(colorOption.id, { name: event.target.value })
              }
            />
            <label className={styles.noColorLabel}>
              <Checkbox
                checked={colorOption.noColor}
                onChange={(event) =>
                  patchColor(colorOption.id, { noColor: event.target.checked })
                }
              />
              색상 없음
            </label>
          </div>

          <ImageUploader
            label="이미지"
            value={colorOption.images}
            onChange={(images) => patchColor(colorOption.id, { images })}
          />
        </div>
      ))}

      <button
        type="button"
        className={styles.addButton}
        disabled={hasNoColor}
        onClick={() => onChange([...colors, createColorOption()])}
      >
        <Plus className={styles.addIcon} aria-hidden="true" />
        색상 추가
      </button>
    </div>
  )
}
