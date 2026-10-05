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
}

export function OptionGroupEditor({
  groups,
  onChange,
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
              onChange={(event) =>
                patchGroup(group.id, { name: event.target.value })
              }
            />
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
              <button
                type="button"
                className={styles.iconButton}
                aria-label={`${group.name || '옵션'} 값 ${valueIndex + 1} 삭제`}
                onClick={() =>
                  patchGroup(group.id, {
                    values: group.values.filter((item) => item.id !== value.id),
                  })
                }
              >
                <X className={styles.icon} aria-hidden="true" />
              </button>
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

      <button
        type="button"
        className={styles.addGroupButton}
        onClick={() => onChange([...groups, createOptionGroup()])}
      >
        <Plus className={styles.icon} aria-hidden="true" />
        옵션 추가
      </button>
    </div>
  )
}
