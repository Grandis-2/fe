import type { ReactNode } from 'react'

import { Link } from 'react-router'

import { Tag } from '@shared/ui'

import * as styles from './OpsTaskCard.css'

/** 급한 정도. 카드 순서도 이 순서다 — 실패 → 멈춤 → 기한·일상 */
export type OpsTaskLevel = 'urgent' | 'check' | 'todo'

const levelLabel: Record<OpsTaskLevel, string> = {
  urgent: '긴급',
  check: '확인',
  todo: '할 일',
}

// 색만으로 구분하지 않게 글자(긴급·확인·할 일)를 함께 단다.
const levelColor: Record<OpsTaskLevel, 'red' | 'yellow' | 'primary'> = {
  urgent: 'red',
  check: 'yellow',
  todo: 'primary',
}

export type OpsTaskCardProps = {
  level: OpsTaskLevel
  title: ReactNode
  description: ReactNode
  /**
   * 이 일을 처리하는 화면. 없으면 운영자가 화면에서 풀 수 없는 일이라 '개발팀 문의'를
   * 보인다 — 운영 홈에서 개발자 기능 화면으로 보내지 않는다.
   */
  action?: { label: string; to: string }
  /**
   * 화면이 사전예약 하나를 보고 있는데 이 카드는 그렇게 거를 수 없을 때(예: '전체 기준')
   * 제목 옆에 붙인다 — 숫자가 고른 사전예약 것으로 읽히지 않게.
   */
  scope?: string
}

/** 운영 홈 '지금 처리할 일' 한 줄 — 무엇이 몇 건인지와 처리할 화면으로 가는 버튼 */
export function OpsTaskCard({
  level,
  title,
  description,
  action,
  scope,
}: OpsTaskCardProps) {
  return (
    <article className={[styles.root, styles.tone[level]].join(' ')}>
      <Tag
        variant="subtle"
        size="medium"
        rounded={false}
        color={levelColor[level]}
        widthOptions={Object.values(levelLabel)}
      >
        {levelLabel[level]}
      </Tag>
      <div className={styles.text}>
        <div className={styles.title}>
          {title}
          {scope && <span className={styles.scope}>{scope}</span>}
        </div>
        <div className={styles.description}>{description}</div>
      </div>
      {action ? (
        <Link
          to={action.to}
          className={[
            styles.action,
            level === 'urgent' ? styles.actionPrimary : styles.actionOutline,
          ].join(' ')}
        >
          {action.label}
        </Link>
      ) : (
        <span className={styles.handoff}>개발팀 문의</span>
      )}
    </article>
  )
}
