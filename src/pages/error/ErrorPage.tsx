import { useEffect } from 'react'

import { faro } from '@grafana/faro-react'
import { RotateCw } from 'lucide-react'
import { useNavigate, useRouteError } from 'react-router'

import { getTraceId } from '@shared/api/client'
import { HOME_PATH } from '@shared/config/routes'
import { Button } from '@shared/ui'
import { BlackHoleScene, ErrorScreen } from '@widgets/error-screen'

import * as styles from './ErrorPage.css'

type ErrorPageProps = {
  // 어디에 그려지는지 — 라우터에서 errorElement마다 정한다.
  // page: 사용자 헤더 아래(헤더 뒤까지 끌어올린다) / standalone: 헤더 없이(레이아웃째 깨짐·온보딩)
  // inset: 관리자 로그인(밝은 헤더라 끌어올리지 않고 헤더 아래만 채운다) / panel: 관리자 본문 칸
  placement?: 'page' | 'standalone' | 'inset' | 'panel'
}

// 라우터 에러 경계(errorElement). 화면을 그리다 예외가 나면 흰 화면 대신 이 안내가 뜬다.
// API 실패가 원인이면 문의 코드(traceId)를 보여 준다 — 사용자가 알려 주면 서버 로그를 찾을 수 있다.
export function ErrorPage({ placement = 'page' }: ErrorPageProps) {
  const error = useRouteError()
  const navigate = useNavigate()
  const traceId = getTraceId(error)

  // errorElement가 잡은 렌더 오류는 전역 오류로 올라가지 않아 Faro가 못 본다 — 직접 보낸다.
  useEffect(() => {
    if (error instanceof Error) faro.api?.pushError(error) // Faro가 꺼져 있으면 api가 없다
  }, [error])

  return (
    <div
      className={styles.placement[placement]}
      data-header-theme={placement === 'page' ? 'dark' : undefined}
    >
      <ErrorScreen
        scene={<BlackHoleScene />}
        code="500"
        label="SERVER ERROR"
        tone="danger"
        title="잠시 신호가 끊겼어요"
        description={
          <>
            서버에 일시적인 문제가 생겼어요. 잠시 후 다시 시도해 주세요.
            {traceId && ' 계속되면 아래 문의 코드를 알려 주세요.'}
          </>
        }
        showLogo={placement === 'standalone'}
        compact={placement === 'inset' || placement === 'panel'}
        actions={
          <>
            {/* 경계는 렌더링이 다시 성공해야 풀린다 — 같은 주소를 새로 불러온다. */}
            <Button
              rounded
              icon={RotateCw}
              onClick={() => window.location.reload()}
            >
              다시 시도
            </Button>
            <Button
              rounded
              variant="outline"
              color="close"
              onClick={() => void navigate(HOME_PATH)}
            >
              홈으로
            </Button>
          </>
        }
      >
        {traceId && (
          <div className={styles.trace}>
            문의 코드 <span className={styles.traceId}>{traceId}</span>
          </div>
        )}
      </ErrorScreen>
    </div>
  )
}
