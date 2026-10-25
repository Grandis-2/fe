import {
  admissionRateRefusal,
  useChangeAdmissionRate,
  type AdmissionRateChange,
  type AdmissionRateRefusal,
} from '@entities/admin-waitingroom'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'

/**
 * 대기열 운영값 바꾸기 — 한 화면의 모든 변경이 같은 요청 상태(진행 중·오류)를 보게 한
 * 곳에서 만든다. 바꾸면 1초 안에 실제 회원에게 반영되므로, 되돌리기·멈춤 같은 변경은
 * confirm으로 한 번 더 묻는다.
 *
 * 전역 속도를 서버가 용량 때문에 거절하면(409 확인 필요 · 400 위험선 넘음) onRefused로 넘긴다.
 * 넘긴 거절은 화면이 따로 다루므로 공통 오류 문구로 띄우지 않는다.
 */
export function useAdmissionChange() {
  const change = useChangeAdmissionRate()

  const apply = (
    next: AdmissionRateChange,
    done: string,
    onDone?: () => void,
    onRefused?: (refusal: AdmissionRateRefusal) => void,
  ) => {
    change.reset()
    change.mutate(next, {
      onSuccess: () => {
        showToast(done)
        onDone?.()
      },
      onError: (caught) => {
        const refusal = admissionRateRefusal(caught)
        if (!refusal || !onRefused) return
        change.reset()
        onRefused(refusal)
      },
    })
  }

  const confirm = (
    title: string,
    description: string,
    confirmLabel: string,
    run: () => void,
  ) =>
    openModal({
      theme: 'light',
      title,
      description,
      confirmLabel,
      onConfirm: () => {
        closeModal()
        run()
      },
    })

  return {
    apply,
    confirm,
    isPending: change.isPending,
    error: change.isError ? change.error : null,
  }
}

export type AdmissionChange = ReturnType<typeof useAdmissionChange>
