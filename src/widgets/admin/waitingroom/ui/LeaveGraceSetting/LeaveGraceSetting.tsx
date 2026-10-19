import {
  WAITINGROOM_DEFAULTS,
  type WaitingroomSetting,
} from '@entities/admin-waitingroom'
import { SegmentedTabs, Skeleton } from '@shared/ui'

import { formatSeconds } from '../../lib/duration'

import * as styles from './LeaveGraceSetting.css'

import type { AdmissionChange } from '../../lib/useAdmissionChange'

export type LeaveGraceSettingProps = {
  /** 이탈 유예 운영값. 못 받았으면 undefined */
  setting: WaitingroomSetting | undefined
  loading: boolean
  admission: AdmissionChange
}

/** 고를 수 있는 이탈 유예(초) — 서버 범위가 250~1800이라 직접 입력 대신 고른다 */
const CHOICES = [250, 300, 600, 1800]
const DEFAULT = WAITINGROOM_DEFAULTS.leaveGraceSeconds

/**
 * 자리 지켜 주기(이탈 유예) — 앱을 잠깐 나간 사람의 순번을 몇 초까지 지켜 줄지. 조회가 그만큼
 * 끊기면 줄에서 빠지고 다시 오면 맨 뒤에 선다(모두 받으니 예약은 되지만 차수가 밀린다).
 * 늘리면 정말 떠난 사람도 그만큼 남아 대기 인원이 부풀어, 고르면 대가를 묻고 바꾼다.
 */
export function LeaveGraceSetting({
  setting,
  loading,
  admission,
}: LeaveGraceSettingProps) {
  const current = setting?.value ?? DEFAULT
  // 지금 값이 선택지에 없으면(서버에 직접 정한 값) 그 값도 보인다.
  const items = [...new Set([...CHOICES, current])]
    .toSorted((a, b) => a - b)
    .map((seconds) => ({
      value: String(seconds),
      label: `${formatSeconds(seconds)}${seconds === DEFAULT ? ' · 기본' : ''}`,
    }))

  const pick = (value: string) => {
    const seconds = Number(value)
    if (seconds === current || admission.isPending) return
    admission.confirm(
      `이탈 유예를 ${formatSeconds(seconds)}(으)로 바꿀까요?`,
      seconds > current
        ? '늘리면 정말 떠난 사람도 그만큼 줄에 남아 대기 인원·예상 시간이 늘어 보여요.'
        : '줄이면 잠깐 나간 사람이 더 빨리 자리를 잃고, 다시 오면 맨 뒤에 서요.',
      '바꾸기',
      () =>
        admission.apply(
          // 기본값은 운영값을 지워 되돌린다.
          { kind: 'leaveGrace', value: seconds === DEFAULT ? null : seconds },
          '이탈 유예를 바꿨습니다.',
        ),
    )
  }

  const extended = current > DEFAULT

  return (
    <div className={styles.card}>
      <span className={styles.lead}>
        앱을 잠깐 나간 사람의 순번을 지켜 주는 시간
      </span>
      {loading ? (
        <Skeleton height={44} />
      ) : (
        <SegmentedTabs items={items} value={String(current)} onChange={pick} />
      )}
      <span className={extended ? styles.noteWarn : styles.note}>
        {extended
          ? '늘려 둔 만큼 정말 떠난 사람도 줄에 남아 대기 인원·예상 시간이 늘어 보여요'
          : `조회가 ${formatSeconds(current)} 끊기면 줄에서 빠지고, 다시 오면 맨 뒤에 서요`}
      </span>
    </div>
  )
}
