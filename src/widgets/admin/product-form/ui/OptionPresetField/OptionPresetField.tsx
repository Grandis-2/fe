import {
  OPTION_PRESETS,
  type ProductOptionPreset,
} from '@entities/admin-product'
import { Dropdown } from '@shared/ui'
import type { DropdownOption } from '@shared/ui'

import * as styles from './OptionPresetField.css'

export type OptionPresetFieldProps = {
  /**
   * 지금 고른 종류. 태그 추천도 같이 보므로 폼이 들고 있다.
   * 아직 안 골랐으면 undefined지만 받기는 반드시 받는다 — 안 넘기면 고른 값이
   * 화면에 남지 않는다(Dropdown은 내부 상태가 없다).
   */
  value: ProductOptionPreset | undefined
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
 * 고른 값은 서버로 가지 않는다 — 입력을 덜어 주는 장치일 뿐이라, 깔린 옵션을 지우거나
 * 고르지 않고 직접 적어도 된다. 다만 검색 태그 추천(TagField)이 같은 값을 보기 때문에
 * 폼 쪽에 둔다.
 */
export function OptionPresetField({ value, onSelect }: OptionPresetFieldProps) {
  return (
    <div className={styles.root}>
      <Dropdown
        label="제품 카테고리 선택"
        width="220px"
        options={options}
        value={value?.name}
        onSelect={(name) => {
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
