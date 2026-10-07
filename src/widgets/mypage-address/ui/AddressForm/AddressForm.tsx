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
} from '@features/address-search'
import { getErrorMessage } from '@shared/api/client'
import { useFormFields } from '@shared/lib/useFormFields'
import { ActionButton, Button, InlineAlert, Input } from '@shared/ui'

import * as styles from './AddressForm.css'

const GENERIC_ERROR = '배송지를 저장하지 못했습니다. 다시 시도해 주세요.'

const emptyForm = {
  label: '',
  postcode: '',
  address: '',
  addressDetail: '',
}

const REQUIRED_KEYS = ['label', 'postcode', 'address'] as const

const toForm = (saved: DefaultAddress | null | undefined) =>
  saved
    ? {
        label: saved.label ?? '',
        postcode: saved.postalCode,
        address: saved.line1,
        addressDetail: saved.line2 ?? '',
      }
    : emptyForm

export type AddressFormProps = {
  /** 저장했거나 취소해서 폼을 닫을 때 */
  onClose: () => void
}

// 배송지가 기본 배송지 하나뿐이라 추가/수정이 같은 폼이다 — 저장된 배송지가
// 있으면 채우고(수정) 없으면 빈 폼으로 시작한다(추가). 열 때마다 새로 마운트되므로
// 입력하던 값은 닫으면 버려진다.
export function AddressForm({ onClose }: AddressFormProps) {
  const { data: saved } = useDefaultAddress()
  const { mutateAsync: saveAddress } = useSaveDefaultAddress()
  const form = useFormFields(toForm(saved), REQUIRED_KEYS)
  const [addressSearchOpen, setAddressSearchOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
        label: form.values.label,
      })
      onClose()
    } catch (caught) {
      setError(getErrorMessage(caught, GENERIC_ERROR))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <article className={styles.root}>
        <header className={styles.header}>
          {saved ? '배송지 수정' : '배송지 추가'}
        </header>
        <div className={styles.body}>
          {error && <InlineAlert status="error">{error}</InlineAlert>}
          <Input
            {...form.field('label', '배송지명')}
            variant="stacked"
            placeholder="예: 집, 회사"
          />
          <AddressFields
            field={form.field}
            onSearchClick={() => setAddressSearchOpen(true)}
          />
        </div>
        <footer className={styles.footer}>
          <Button variant="subtle" color="cancel" onClick={onClose}>
            취소
          </Button>
          <ActionButton
            size="md"
            disabled={saving}
            onClick={() => void handleSubmit()}
          >
            저장하기
          </ActionButton>
        </footer>
      </article>

      <DaumPostcodeSearch
        open={addressSearchOpen}
        onOpenChange={setAddressSearchOpen}
        onComplete={handleAddressComplete}
      />
    </>
  )
}
