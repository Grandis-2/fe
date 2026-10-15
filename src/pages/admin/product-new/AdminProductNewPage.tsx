import { useMemo } from 'react'

import { useNavigate } from 'react-router'

import {
  RegistrationUnconfirmedError,
  serverIssuesOf,
  useCreateAdminProduct,
  validateRegistration,
  type AdminProductFormValue,
} from '@entities/admin-product'
import { ApiRequestError, getErrorMessage } from '@shared/api/client'
import { ADMIN_PRODUCTS_PATH, adminProductPath } from '@shared/config/routes'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import { Breadcrumb } from '@shared/ui'
import { AdminProductForm } from '@widgets/admin/product-form'

import * as styles from './AdminProductNewPage.css'

/**
 * 새 상품 등록. 일반 상품은 등록 때 공개·숨김을 고른다(기본 숨김). 사전예약은 공개로
 * 들어가지만 접수 기간에만 구매자에게 보인다.
 *
 * 오류는 폼이 칸 아래와 버튼 줄에 보여준다 — 버튼이 화면 아래에 붙어 있어 맨 위 알림은
 * 누른 자리에서 보이지 않는다.
 */
export function AdminProductNewPage() {
  const navigate = useNavigate()
  const create = useCreateAdminProduct()

  // 서버 400의 칸별 오류는 그 칸에 붙이고, 짝이 없는 것과 다른 실패는 버튼 줄에 둔다.
  const failure = useMemo(() => {
    if (!create.error) return null
    const violations =
      create.error instanceof ApiRequestError
        ? (create.error.error.details?.violations ?? [])
        : []
    const { issues, rest } = serverIssuesOf(violations)
    return {
      issues,
      message:
        issues.length > 0 && rest.length === 0
          ? null
          : (rest[0] ??
            getErrorMessage(create.error, '상품을 등록하지 못했습니다.')),
    }
  }, [create.error])

  const submit = (value: AdminProductFormValue) =>
    create.mutate(value, {
      onSuccess: ({ productId, ready }) => {
        // 준비(회차·재고 생성)가 늦어지면 상세에서 '초안'으로 보인다 — 실패가
        // 아니라 아직 덜 된 것이라 알려 둔다. 다시 등록하면 상품이 둘이 된다.
        showToast(
          ready
            ? '상품을 등록했습니다.'
            : '상품을 등록했습니다. 판매 준비는 잠시 뒤 끝납니다.',
        )
        navigate(adminProductPath(productId))
      },
      onError: (caught) => {
        if (!(caught instanceof RegistrationUnconfirmedError)) return
        // 이전 등록이 반영됐을 수 있다 — 새로 보낼지는 관리자가 목록을 보고 정한다.
        openModal({
          theme: 'light',
          title: '새로 등록할까요?',
          description: `직전 등록 요청의 결과를 확인하지 못했습니다. 이미 등록됐을 수 있으니 상품 목록에서 먼저 확인해 주세요.
새로 등록하면 같은 상품이 둘이 될 수 있습니다.`,
          confirmLabel: '새로 등록',
          onConfirm: () => {
            closeModal()
            create.startOver()
            submit(value)
          },
        })
      },
    })

  return (
    <div className={styles.root}>
      <Breadcrumb
        items={[
          { label: '상품 관리', to: ADMIN_PRODUCTS_PATH },
          { label: '새 상품 등록' },
        ]}
      />

      <h1 className={styles.title}>새 상품 등록</h1>

      <AdminProductForm
        mode="create"
        // 등록 요청 중에는 제출을 막는다 — 연타하면 같은 상품이 여러 개 생긴다.
        submitting={create.isPending}
        // 서버가 400을 줄 값은 보내기 전에 걸러 고칠 칸을 바로 알린다.
        validate={validateRegistration}
        serverIssues={failure?.issues}
        submitError={failure?.message}
        // 오프라인이면 요청이 멈춰 기다린다 — 같은 등록 키로 이어서 보내 중복은 없다.
        waitingForNetwork={create.isPaused}
        onSubmit={submit}
        onCancel={() => navigate(ADMIN_PRODUCTS_PATH)}
        // 등록 전에는 볼 상세 페이지가 없어 목록으로만 돌려보낸다.
        onPreview={() => navigate(ADMIN_PRODUCTS_PATH)}
      />
    </div>
  )
}
