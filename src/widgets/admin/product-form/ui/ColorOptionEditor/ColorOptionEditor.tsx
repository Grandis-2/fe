import { useLayoutEffect, useRef } from 'react'

import { Plus, X } from 'lucide-react'

import {
  createColorOption,
  type ProductColorOption,
} from '@entities/admin-product'
import { Checkbox, ImageUploader, Input } from '@shared/ui'
import type { UploadedImage } from '@shared/ui'

import * as fields from '../fields.css'

import * as styles from './ColorOptionEditor.css'

export type ColorOptionEditorProps = {
  colors: ProductColorOption[]
  onChange: (colors: ProductColorOption[]) => void
  /**
   * 수정 화면에서 서버에 이미 있는 색상 id. 넘기면 등록 뒤 규칙을 따른다 — 서버에 값을
   * 지우는 API가 없어 이 색상들은 지울 수 없고, '색상 없음'(축 자체)은 바꿀 수 없다.
   * 이번에 더한 색상은 아직 저장 전이라 지울 수 있다.
   */
  existingIds?: ReadonlySet<string>
  /**
   * '색상 없음' 상품의 상품 사진. 색상 축이 없으면 갤러리가 색상 없는 묶음 하나라
   * 색상 칸이 아니라 따로 받는다.
   */
  noColorImages: UploadedImage[]
  onNoColorImagesChange: (images: UploadedImage[]) => void
  /** 사진을 고르는 즉시 올린다(ImageUploader.upload) */
  upload?: (file: File) => Promise<string>
  /** 고를 수 있는 사진 형식 */
  accept?: string
  /** 색상(묶음)마다 담을 수 있는 사진 수 */
  maxImages?: number
}

/**
 * 색상 옵션 편집. '색상 없음'은 칸 하나가 아니라 상품 전체의 성격이라 모든 칸에
 * 함께 걸린다 — 한쪽만 켜지면 조합 계산과 화면이 어긋난다.
 */
export function ColorOptionEditor({
  colors,
  onChange,
  existingIds,
  noColorImages,
  onNoColorImagesChange,
  upload,
  accept,
  maxImages,
}: ColorOptionEditorProps) {
  const editing = existingIds !== undefined
  // '색상 없음'인 상품은 색상을 더 만들 수 없다.
  const hasNoColor = colors.some((colorOption) => colorOption.noColor)

  // 색상이 없다는 건 칸 하나가 아니라 상품 전체의 성격이다 — 하나를 켜면 이미 만들어
  // 둔 칸까지 모두 켜고, 풀면 모두 푼다. 한쪽만 켜져 있으면 조합 계산(getProductVariants)은
  // 색상을 빼는데 화면은 색상이 살아 있는 것처럼 보여서 어긋난다.
  const toggleNoColor = (noColor: boolean) =>
    onChange(colors.map((colorOption) => ({ ...colorOption, noColor })))

  // 색상마다 사진이 따로 올라가다 거의 동시에 끝나면, 렌더 때의 colors로 계산한 두 결과가
  // 서로를 덮는다(한 색상 사진이 사라진다). 마지막으로 내보낸 목록을 들고 그 위에 고친다.
  const latestRef = useRef(colors)
  useLayoutEffect(() => {
    latestRef.current = colors
  }, [colors])

  const patchColor = (id: string, partial: Partial<ProductColorOption>) => {
    const next = latestRef.current.map((colorOption) =>
      colorOption.id === id ? { ...colorOption, ...partial } : colorOption,
    )
    latestRef.current = next
    onChange(next)
  }

  return (
    <div className={styles.root}>
      {colors.map((colorOption, index) => (
        <div key={colorOption.id} className={styles.colorBlock}>
          {/* 제목과 삭제 버튼을 한 줄에 둔다. */}
          <div className={styles.blockHeader}>
            <span className={styles.sectionLabel}>색상</span>
            {!existingIds?.has(colorOption.id) && (
              <button
                type="button"
                className={styles.removeButton}
                aria-label={`색상 ${index + 1} 삭제`}
                onClick={() =>
                  onChange(colors.filter((item) => item.id !== colorOption.id))
                }
              >
                <X className={styles.removeIcon} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className={styles.colorRow}>
            <label
              className={[
                colorOption.hex ? styles.swatch : styles.swatchEmpty,
                hasNoColor && styles.mutedArea,
              ]
                .filter(Boolean)
                .join(' ')}
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
                disabled={hasNoColor}
                onChange={(event) =>
                  patchColor(colorOption.id, {
                    hex: event.target.value.toUpperCase(),
                  })
                }
              />
            </label>
            <Input
              className={[fields.fixedField, hasNoColor && styles.mutedArea]
                .filter(Boolean)
                .join(' ')}
              size="small"
              label="색상 입력"
              value={colorOption.name}
              disabled={hasNoColor}
              onChange={(event) =>
                patchColor(colorOption.id, { name: event.target.value })
              }
            />
            <label className={styles.noColorLabel}>
              <Checkbox
                checked={hasNoColor}
                // 색상 축을 만들거나 없애는 일이라 등록 뒤에는 바꿀 수 없다.
                disabled={editing}
                onChange={(event) => toggleNoColor(event.target.checked)}
              />
              색상 없음
            </label>
          </div>

          <div className={hasNoColor ? styles.mutedArea : undefined}>
            <ImageUploader
              label="이미지"
              disabled={hasNoColor}
              upload={upload}
              accept={accept}
              max={maxImages}
              value={colorOption.images}
              onChange={(images) => patchColor(colorOption.id, { images })}
            />
          </div>
        </div>
      ))}

      {/* 색상이 없는 상품은 상품 사진을 색상 칸이 아니라 여기 한 묶음으로 받는다. */}
      {hasNoColor && (
        <div className={styles.colorBlock}>
          <ImageUploader
            label="상품 사진"
            upload={upload}
            accept={accept}
            max={maxImages}
            value={noColorImages}
            onChange={onNoColorImagesChange}
          />
        </div>
      )}

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
