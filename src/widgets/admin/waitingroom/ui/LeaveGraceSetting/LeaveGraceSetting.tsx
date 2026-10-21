import {
  WAITINGROOM_DEFAULTS,
  type WaitingroomSetting,
} from '@entities/admin-waitingroom'
import { formatNumber } from '@shared/lib/formatNumber'
import { Chip, InlineAlert, Skeleton } from '@shared/ui'

import { formatSeconds } from '../../lib/duration'

import * as styles from './LeaveGraceSetting.css'

import type { AdmissionChange } from '../../lib/useAdmissionChange'

export type LeaveGraceSettingProps = {
  /** 이탈 유예 운영값. 못 받았으면 undefined */
  setting: WaitingroomSetting | undefined
  loading: boolean
  /**
   * 모든 상품의 대기 인원 합. 현황을 못 받았거나 오래됐으면 null — 모르면 줄이 있다고 본다.
   */
  waiting: number | null
  admission: AdmissionChange
}

/** 고를 수 있는 이탈 유예(초) — 서버 범위가 250~1800이라 직접 입력 대신 고른다 */
const CHOICES = [250, 300, 600, 900, 1800]
const DEFAULT = WAITINGROOM_DEFAULTS.leaveGraceSeconds

/**
 * 모달 문장에 넣는 시간 — '4분 10초'가 '4분 / 10초'로 갈려 줄이 바뀌지 않게 값 안의 공백을
 * 줄바꿈 없는 공백으로 바꾼다(모달은 어절 단위로만 끊는다).
 */
const inSentence = (seconds: number) =>
  formatSeconds(seconds).replaceAll(' ', String.fromCharCode(0xa0))

/** '로/으로' — 받침이 있으면(ㄹ 받침 빼고) '으로'. 시간 값은 '분'·'초'로 끝난다 */
const ro = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  const final = code >= 0 && code < 11172 ? code % 28 : 0
  return final === 0 || final === 8 ? `${word}로` : `${word}으로`
}

/**
 * 자리 지켜 주기(이탈 유예) — 앱을 잠깐 나간 사람의 순번을 몇 초까지 지켜 줄지. 조회가 그만큼
 * 끊기면 줄에서 빠지고 다시 오면 맨 뒤에 선다(모두 받으니 예약은 되지만 차수가 밀린다).
 * 늘리면 정말 떠난 사람도 그만큼 남아 대기 인원이 부풀어, 고르면 대가를 묻고 바꾼다.
 * 줄이면 이미 그보다 오래 자리를 비운 사람이 바로 빠지므로, 줄에 누가 있으면 줄이기를 막는다.
 */
export function LeaveGraceSetting({
  setting,
  loading,
  waiting,
  admission,
}: LeaveGraceSettingProps) {
  const current = setting?.value ?? DEFAULT
  const occupied = waiting === null || waiting > 0
  // 기본값으로 되돌리기도 줄이기다.
  const lockedLower = occupied && current > Math.min(...CHOICES)
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
    const lower = seconds < current
    if (lower && occupied) return
    const length = inSentence(seconds)
    admission.confirm(
      `자리 지켜 주는 시간을 ${ro(length)} ${lower ? '줄일' : '늘릴'}까요?`,
      lower
        ? `지금은 줄 서 있는 사람이 없어 빠지는 사람은 없어요. 앞으로 ${length} 넘게 자리를 비우면 줄에서 빠져요.`
        : `잠깐 나간 사람이 순번을 덜 잃어요. 대신 정말 떠난 사람도 ${length} 동안 줄에 남아 대기 인원과 예상 시간이 늘어 보여요. 줄이 있는 동안엔 다시 줄일 수 없어요.`,
      lower ? '줄이기' : '늘리기',
      () =>
        admission.apply(
          // 기본값은 운영값을 지워 되돌린다.
          { kind: 'leaveGrace', value: seconds === DEFAULT ? null : seconds },
          '자리 지켜 주는 시간을 바꿨습니다.',
        ),
    )
  }

  const extended = current > DEFAULT

  return (
    <section className={styles.card} aria-labelledby="wr-grace">
      <div className={styles.head}>
        <h2 id="wr-grace" className={styles.title}>
          자리 지켜 주기
        </h2>
      </div>
      <span className={styles.lead}>
        앱을 잠깐 나가도 순번을 지켜 주는 시간
      </span>
      {loading ? (
        <Skeleton height={84} />
      ) : !setting ? (
        // 못 받았으면 기본값을 지금 값처럼 보이지 않는다.
        <span className={styles.noteWarn}>
          운영값을 받지 못해 지금 값을 알 수 없어요.
        </span>
      ) : (
        <div
          className={styles.choices}
          role="group"
          aria-label="자리 지켜 주는 시간"
        >
          {items.map((item) => (
            <Chip
              key={item.value}
              className={styles.choice}
              selected={item.value === String(current)}
              disabled={
                admission.isPending ||
                (occupied && Number(item.value) < current)
              }
              onClick={() => pick(item.value)}
            >
              {item.label}
            </Chip>
          ))}
        </div>
      )}
      {setting && lockedLower && (
        <InlineAlert status="warning">
          <b>
            {waiting === null
              ? '대기열 현황을 확인할 수 없어 지금은 줄일 수 없어요.'
              : `줄에 ${formatNumber(waiting)}명이 기다리는 동안은 줄일 수 없어요.`}
          </b>
          {/* 문장마다 줄을 바꿔 이유·대가·할 일이 따로 읽히게 한다. */}
          <br />
          줄이면 그 시간보다 오래 자리를 비운 사람이 바로 줄에서 빠져요.
          <br />
          줄이 빈 뒤에 줄여 주세요.
        </InlineAlert>
      )}
      {setting && (
        <span className={extended ? styles.noteWarn : styles.note}>
          {extended
            ? '늘려 둔 만큼 정말 떠난 사람도 줄에 남아 대기 인원·예상 시간이 늘어 보여요'
            : `조회가 ${formatSeconds(current)} 끊기면 줄에서 빠지고, 다시 오면 맨 뒤에 서요`}
        </span>
      )}
    </section>
  )
}
