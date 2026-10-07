import { useState } from 'react'

import {
  OPTION_PRESETS,
  type ProductOptionPreset,
} from '@entities/admin-product'
import { Dropdown } from '@shared/ui'
import type { DropdownOption } from '@shared/ui'

import * as styles from './OptionPresetField.css'

export type OptionPresetFieldProps = {
  onSelect: (preset: ProductOptionPreset) => void
}

// 종류 이름이 11종 모두 겹치지 않아 그대로 값으로 쓴다. 대분류는 어느 묶음인지
// 알아보라고 라벨에만 붙인다.
const options: DropdownOption<string>[] = OPTION_PRESETS.map((preset) => ({
  label: `${preset.category} · ${preset.name}`,
  value: preset.name,
}))

/**
 * 제품 종류를 고르면 그 종류가 흔히 쓰는 옵션을 미리 깔아 준다.
 *
 * 고른 값은 저장되지 않는다 — 입력을 덜어 주는 장치일 뿐이라, 깔린 옵션을 지우거나
 * 고르지 않고 직접 적어도 된다. 그래서 값을 폼이 아니라 여기서 들고 있는다.
 */
export function OptionPresetField({ onSelect }: OptionPresetFieldProps) {
  const [picked, setPicked] = useState<string>()

  return (
    <div className={styles.root}>
      <Dropdown
        label="제품 카테고리 선택"
        width="220px"
        options={options}
        value={picked}
        onSelect={(name) => {
          setPicked(name)
          const preset = OPTION_PRESETS.find((item) => item.name === name)
          if (preset) onSelect(preset)
        }}
      />
      <span className={styles.hint}>
        고르면 자주 쓰는 옵션이 깔립니다. 값을 적지 않은 옵션은 종류를 다시 고를
        때 바뀝니다.
      </span>
    </div>
  )
}
