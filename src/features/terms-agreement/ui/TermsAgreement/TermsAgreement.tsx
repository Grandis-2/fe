import { useState } from 'react'

import { ChevronDown } from 'lucide-react'

import { Checkbox } from '@shared/ui'

import { terms } from '../../model/terms'

import * as styles from './TermsAgreement.css'

export type TermsAgreementProps = {
  agreedIds: Set<string>
  onToggle: (id: string, checked: boolean) => void
  onToggleAll: (checked: boolean) => void
}

// 약관보기 펼침 상태는 바깥에서 쓸 일이 없어서 여기서만 들고 있는다.
export function TermsAgreement({
  agreedIds,
  onToggle,
  onToggleAll,
}: TermsAgreementProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const toggleDetail = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className={styles.terms}>
      <div className={styles.termsTitle}>약관 동의</div>

      <label className={styles.agreeAll}>
        <Checkbox
          className={styles.checkbox}
          checked={agreedIds.size === terms.length}
          onChange={(event) => onToggleAll(event.target.checked)}
        />
        아래 내용에 모두 동의합니다.
      </label>

      <div className={styles.termList}>
        {terms.map((term) => {
          const open = openIds.has(term.id)

          return (
            <div key={term.id}>
              <div className={styles.termRow}>
                <label className={styles.termMain}>
                  <Checkbox
                    className={styles.checkbox}
                    checked={agreedIds.has(term.id)}
                    onChange={(event) =>
                      onToggle(term.id, event.target.checked)
                    }
                  />
                  <span className={styles.termLabel}>{term.label}</span>
                </label>
                {term.detail && (
                  <button
                    type="button"
                    className={styles.detailToggle}
                    aria-expanded={open}
                    onClick={() => toggleDetail(term.id)}
                  >
                    약관보기
                    <ChevronDown
                      aria-hidden="true"
                      className={[
                        styles.detailIcon,
                        open && styles.detailIconOpen,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    />
                  </button>
                )}
              </div>

              {term.detail && open && (
                <div className={styles.detailPanel}>
                  {term.detail.map((section) => (
                    <div key={section.heading} className={styles.detailGroup}>
                      <div className={styles.detailHeading}>
                        {section.heading}
                      </div>
                      <div className={styles.detailBody}>{section.body}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
