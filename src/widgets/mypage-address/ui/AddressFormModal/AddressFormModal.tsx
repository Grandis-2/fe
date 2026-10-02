import { useState } from 'react'

import {
  useDefaultAddress,
  useSaveDefaultAddress,
  type DefaultAddress,
} from '@entities/address'
import { getProfile } from '@entities/profile'
import {
  AddressFields,
  DaumPostcodeSearch,
  type DaumPostcodeAddress,
} from '@features/daum-postcode'
import { getErrorMessage } from '@shared/api/client'
import { useFormFields } from '@shared/lib/useFormFields'
import { Button, InlineAlert, Modal, ModalTitle } from '@shared/ui'

import * as styles from './AddressFormModal.css'

const GENERIC_ERROR = '배송지를 저장하지 못했습니다. 다시 시도해 주세요.'

const emptyForm = {
  postcode: '',
  address: '',
  addressDetail: '',
}

const REQUIRED_KEYS = ['postcode', 'address'] as const

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

// 배송지가 기본 배송지 하나뿐이라 추가/수정이 같은 폼이다 — 저장된 배송지가
// 있으면 채우고(수정) 없으면 빈 폼으로 시작한다(추가).
export function AddressFormModal({
  open,
  onOpenChange,
}: AddressFormModalProps) {
  const { data: saved } = useDefaultAddress()
  const { mutateAsync: saveAddress } = useSaveDefaultAddress()
  const form = useFormFields(toForm(saved), REQUIRED_KEYS)
  const [addressSearchOpen, setAddressSearchOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 열릴 때마다 입력하던 값과 에러를 비우고 저장된 배송지로 되돌린다. 렌더 중에 바로
  // 초기화한다 — 이펙트에서 setState하면 react-hooks/set-state-in-effect에 걸린다.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      form.reset()
      setError(null)
    }
  }

  const isEditing = !!saved

  // 상세 주소는 이전 주소 기준 값이라 새로 찾은 주소와 안 맞을 수 있어 같이 비운다.
  const handleAddressComplete = ({
    postcode,
    address,
  }: DaumPostcodeAddress) => {
    form.setValues({ postcode, address, addressDetail: '' })
    setAddressSearchOpen(false)
  }

  const handleSubmit = async () => {
    form.markSubmitted()
    setError(null)
    if (!form.requiredFilled) return

    setSaving(true)
    try {
      // 배송지는 주소만 물어본다 — 수령인은 항상 로그인한 회원 본인이라 그
      // 이름/전화번호를 그대로 가져다 쓴다(폼에 다시 입력받지 않는다).
      const profile = await getProfile()
      await saveAddress({
        name: profile.name ?? '',
        phone: profile.phoneNumber ?? '',
        postalCode: form.values.postcode,
        line1: form.values.address,
        line2: form.values.addressDetail || null,
      })
      onOpenChange(false)
    } catch (caught) {
      setError(getErrorMessage(caught, GENERIC_ERROR))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Modal open={open} onClose={() => onOpenChange(false)}>
        <div className={styles.content}>
          <ModalTitle className={styles.title}>
            {isEditing ? '배송지 수정' : '배송지 추가'}
          </ModalTitle>

          {error && <InlineAlert status="error">{error}</InlineAlert>}

          <AddressFields
            field={form.field}
            onSearchClick={() => setAddressSearchOpen(true)}
          />

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
