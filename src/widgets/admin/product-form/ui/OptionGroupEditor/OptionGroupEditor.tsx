import { Plus, X } from 'lucide-react'

import {
  createOptionGroup,
  createOptionValue,
  type ProductOptionGroup,
  type ProductOptionValue,
} from '@entities/admin-product'
import { Input } from '@shared/ui'

import { ExtraPriceField } from '../ExtraPriceField'
import * as fields from '../fields.css'

import * as styles from './OptionGroupEditor.css'

export type OptionGroupEditorProps = {
  groups: ProductOptionGroup[]
  onChange: (groups: ProductOptionGroup[]) => void
  /**
   * 수정 화면에서 서버에 이미 있는 옵션 종류(축 키)·값 id. 넘기면 등록 뒤 규칙을 따른다 —
   * 축은 새로 만들거나 지우거나 이름을 바꿀 수 없고, 있던 값은 지울 수 없다(지우는 API가
   * 없다). 있던 값의 이름·추가금은 고칠 수 있고, 새 값은 더하거나 저장 전이면 지울 수 있다.
   */
  existingIds?: ReadonlySet<string>
}

export function OptionGroupEditor({
  groups,
  onChange,
  existingIds,
}: OptionGroupEditorProps) {
  const patchGroup = (id: string, partial: Partial<ProductOptionGroup>) =>
    onChange(
      groups.map((group) =>
        group.id === id ? { ...group, ...partial } : group,
      ),
    )

  const patchValue = (
    group: ProductOptionGroup,
    valueId: string,
    partial: Partial<ProductOptionValue>,
  ) =>
    patchGroup(group.id, {
      values: group.values.map((value) =>
        value.id === valueId ? { ...value, ...partial } : value,
      ),
    })

  return (
    <div className={styles.root}>
      {groups.map((group, groupIndex) => (
        <div key={group.id} className={styles.group}>
          {/* 삭제 버튼만 있는 줄을 따로 두면 위쪽에 빈 공간이 생겨서 같은 줄에 둔다. */}
          <div className={styles.groupNameRow}>
            <Input
              className={fields.fixedField}
              size="small"
              label="옵션 이름"
              value={group.name}
              disabled={existingIds?.has(group.id)}
              onChange={(event) =>
                patchGroup(group.id, { name: event.target.value })
              }
            />
            {!existingIds?.has(group.id) && (
              <button
                type="button"
                className={styles.iconButton}
                aria-label={`옵션 ${groupIndex + 1} 삭제`}
                onClick={() =>
                  onChange(groups.filter((item) => item.id !== group.id))
                }
              >
                <X className={styles.icon} aria-hidden="true" />
              </button>
            )}
          </div>

          {group.values.map((value, valueIndex) => (
            <div key={value.id} className={styles.valueRow}>
              <Input
                className={fields.growField}
                size="small"
                label={`${group.name || '옵션'} 값`}
                value={value.label}
                onChange={(event) =>
                  patchValue(group, value.id, { label: event.target.value })
                }
              />
              <div className={styles.extraPriceField}>
                <ExtraPriceField
                  label={`${value.label || '옵션 값'} 추가금`}
                  value={value.extraPrice}
                  onChange={(extraPrice) =>
                    patchValue(group, value.id, { extraPrice })
                  }
                />
              </div>
              {!existingIds?.has(value.id) && (
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`${group.name || '옵션'} 값 ${valueIndex + 1} 삭제`}
                  onClick={() =>
                    patchGroup(group.id, {
                      values: group.values.filter(
                        (item) => item.id !== value.id,
                      ),
                    })
                  }
                >
                  <X className={styles.icon} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className={styles.addValueRow}
            onClick={() =>
              patchGroup(group.id, {
                values: [...group.values, createOptionValue()],
              })
            }
          >
            <span>옵션 타입 추가</span>
            <Plus className={styles.icon} aria-hidden="true" />
          </button>
        </div>
      ))}

      {/* 등록 뒤에는 옵션 종류(축)를 새로 만들 수 없다 — 값만 더할 수 있다. */}
      {!existingIds && (
        <button
          type="button"
          className={styles.addGroupButton}
          onClick={() => onChange([...groups, createOptionGroup()])}
        >
          <Plus className={styles.icon} aria-hidden="true" />
          옵션 추가
        </button>
      )}
    </div>
  )
}
