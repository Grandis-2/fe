import type { WaitingroomSetting } from '@entities/admin-waitingroom'
import { Skeleton, Tag } from '@shared/ui'

import { formatSeconds } from '../../lib/duration'

import * as styles from './MaxWaitSetting.css'

import type { AdmissionChange } from '../../lib/useAdmissionChange'

export type MaxWaitSettingProps = {
  /** 최대 대기 시간 운영값. 못 받았으면 undefined */
  setting: WaitingroomSetting | undefined
  loading: boolean
  admission: AdmissionChange
}

/**
 * 최대 대기 시간 — 사람을 거절하는 값이라 정하는 칸은 두지 않는다(사전예약은 모두 받는다).
 * 꺼져 있으면 그렇다고만 말하고, 걸려 있으면 빨갛게 알리고 해제 버튼을 둔다.
 */
export function MaxWaitSetting({
  setting,
  loading,
  admission,
}: MaxWaitSettingProps) {
  const seconds = setting?.value ?? null

  return (
    <section className={styles.card} aria-labelledby="wr-max-wait">
      <div className={styles.head}>
        <h2 id="wr-max-wait" className={styles.title}>
          최대 대기 시간
        </h2>
        {!loading && setting && (
          <Tag
            variant="subtle"
            size="medium"
            color={seconds === null ? 'green' : 'red'}
          >
            {seconds === null ? '꺼짐' : `켜짐 · ${formatSeconds(seconds)}`}
          </Tag>
        )}
      </div>
      {loading ? (
        <Skeleton height={20} />
      ) : seconds === null ? (
        <span className={styles.note}>
          사전예약은 모두 받아요. 줄이 길어도 거절하지 않아요.
        </span>
      ) : (
        <>
          <span className={styles.noteBad}>
            줄이 차면 새로 오는 사람이 거절돼요.
          </span>
          <button
            type="button"
            className={styles.release}
            disabled={admission.isPending}
            onClick={() =>
              admission.confirm(
                '최대 대기 시간 제한을 해제할까요?',
                '줄 길이 제한이 없어져 새로 오는 사람을 모두 줄에 세워요.',
                '해제',
                () =>
                  admission.apply(
                    { kind: 'maxWait', value: null },
                    '최대 대기 시간 제한을 해제했습니다.',
                  ),
              )
            }
          >
            제한 해제
          </button>
        </>
      )}
    </section>
  )
}
