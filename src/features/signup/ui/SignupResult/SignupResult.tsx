import { Link } from 'react-router'

import { HOME_PATH, PREORDER_PATH } from '@shared/config/routes'

// 기본 버튼 모양은 가입 폼의 완료 버튼과 같아야 해서 폼의 스타일을 그대로 쓴다.
import * as formStyles from '../SignupForm/SignupForm.css'

import * as styles from './SignupResult.css'

export type SignupResultProps =
  { status: 'success'; name: string } | { status: 'fail'; onRetry: () => void }

// 가입 결과 화면 — 가운데 정렬. 배경 궤도 중심 아래 자리는 페이지가 잡아 준다.
// 배경 연출이 자리를 잡은 뒤 아래에서 올라오며 나타난다.
export function SignupResult(props: SignupResultProps) {
  if (props.status === 'success') {
    return (
      <div className={styles.root.success}>
        <div className={styles.eyebrow.success}>WELCOME ABOARD</div>
        <h1 className={styles.title}>
          {props.name}님,
          <br />
          <span className={styles.highlight}>환영해요</span>
        </h1>
        <div className={styles.description}>가입이 완료되었어요.</div>
        <Link
          to={PREORDER_PATH}
          className={[formStyles.submit, styles.primary].join(' ')}
        >
          상품 보러가기
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.root.fail} role="alert">
      <div className={styles.eyebrow.fail}>SIGNAL LOST</div>
      <h1 className={styles.failTitle}>가입을 완료하지 못했어요</h1>
      <div className={styles.description}>
        일시적인 오류로 정보를 저장하지 못했어요.
        <br />
        잠시 후 다시 시도해 주세요.
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={[formStyles.submit, styles.primary].join(' ')}
          onClick={props.onRetry}
        >
          다시 시도
        </button>
        <Link to={HOME_PATH} className={styles.secondary}>
          홈으로
        </Link>
      </div>
    </div>
  )
}
