import { useState, type ChangeEvent, type ReactNode } from 'react'

import {
  useDefaultAddress,
  useSaveDefaultAddress,
  type DefaultAddress,
} from '@/entities/address'
import { getProfile } from '@/entities/profile'
import {
  DaumPostcodeSearch,
  type DaumPostcodeAddress,
} from '@/features/daum-postcode'
import { ApiRequestError } from '@/shared/api/client'
import { Button, InlineAlert, Input, Modal, useModalTitleId } from '@/shared/ui'

import * as styles from './AddressFormModal.css'

const GENERIC_ERROR = '배송지를 저장하지 못했습니다. 다시 시도해 주세요.'

const emptyForm = {
  postcode: '',
  address: '',
  addressDetail: '',
}

type FormKey = keyof typeof emptyForm

const requiredKeys: FormKey[] = ['postcode', 'address']

const toForm = (saved: DefaultAddress | null | undefined) =>
  saved
    ? {
        postcode: saved.postalCode,
        address: saved.line1,
        addressDetail: saved.line2 ?? '',
      }
    : emptyForm

export type AddressFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Modal 안에서만 useModalTitleId()가 값을 갖는다(daum-postcode의 ModalTitle과 같은 이유).
function FormTitle({ children }: { children: ReactNode }) {
  const titleId = useModalTitleId()
  return (
    <div id={titleId} className={styles.title}>
      {children}
    </div>
  )
}

// 배송지가 기본 배송지 하나뿐이라 추가/수정이 같은 폼이다 — 저장된 배송지가
// 있으면 채우고(수정) 없으면 빈 폼으로 시작한다(추가).
export function AddressFormModal({
  open,
  onOpenChange,
}: AddressFormModalProps) {
  const { data: saved } = useDefaultAddress()
  const { mutateAsync: saveAddress } = useSaveDefaultAddress()
  // 저장된 값 위에 사용자가 고친 칸만 얹는다 — 이펙트로 폼을 덮어쓰지 않는다.
  const [edits, setEdits] = useState<Partial<typeof emptyForm>>({})
  const [submitted, setSubmitted] = useState(false)
  const [addressSearchOpen, setAddressSearchOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 열릴 때마다 입력하던 값과 에러를 비우고 저장된 배송지로 되돌린다. 렌더 중에 바로
  // 초기화한다 — 이펙트에서 setState하면 react-hooks/set-state-in-effect에 걸린다.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setEdits({})
      setSubmitted(false)
      setError(null)
    }
  }

  const form = { ...toForm(saved), ...edits }
  const isEditing = !!saved

  // 필수 입력은 저장을 한 번 눌러 본 뒤에만 빨갛게 표시한다 — PaymentPage와 같은 패턴.
  const field = (key: FormKey, label: string, required?: boolean) => ({
    label,
    value: form[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      setEdits((prev) => ({ ...prev, [key]: event.target.value })),
    required,
    invalid: submitted && !form[key].trim(),
  })

  // 상세 주소는 이전 주소 기준 값이라 새로 찾은 주소와 안 맞을 수 있어 같이 비운다.
  const handleAddressComplete = ({
    postcode,
    address,
  }: DaumPostcodeAddress) => {
    setEdits((prev) => ({ ...prev, postcode, address, addressDetail: '' }))
    setAddressSearchOpen(false)
  }

  const requiredFilled = requiredKeys.every((key) => form[key].trim())

  const handleSubmit = async () => {
    setSubmitted(true)
    setError(null)
    if (!requiredFilled) return

    setSaving(true)
    try {
      // 배송지는 주소만 물어본다 — 수령인은 항상 로그인한 회원 본인이라 그
      // 이름/전화번호를 그대로 가져다 쓴다(폼에 다시 입력받지 않는다).
      const profile = await getProfile()
      await saveAddress({
        name: profile.name ?? '',
        phone: profile.phoneNumber ?? '',
        postalCode: form.postcode,
        line1: form.address,
        line2: form.addressDetail || null,
      })
      onOpenChange(false)
    } catch (caught) {
      setError(
        caught instanceof ApiRequestError
          ? caught.error.message
          : GENERIC_ERROR,
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Modal open={open} onClose={() => onOpenChange(false)}>
        <div className={styles.content}>
          <FormTitle>{isEditing ? '배송지 수정' : '배송지 추가'}</FormTitle>

          {error && <InlineAlert status="error">{error}</InlineAlert>}

          <div className={styles.postcodeRow}>
            <Input
              {...field('postcode', '우편 번호', true)}
              inputMode="numeric"
            />
            <Button
              className={styles.postcodeAction}
              onClick={() => setAddressSearchOpen(true)}
            >
              주소 찾기
            </Button>
          </div>
          <Input {...field('address', '기본 주소', true)} />
          <Input {...field('addressDetail', '상세 주소')} />

          <Button
            className={styles.submitButton}
            onClick={() => void handleSubmit()}
            disabled={saving}
          >
            저장
          </Button>
        </div>
      </Modal>

      <DaumPostcodeSearch
        open={addressSearchOpen}
        onOpenChange={setAddressSearchOpen}
        onComplete={handleAddressComplete}
      />
    </>
  )
}
