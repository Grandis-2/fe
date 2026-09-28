import { useRef } from 'react'

import { ImagePlus } from 'lucide-react'

import { Button } from '@/shared/ui'
import type { UploadedImage } from '@/shared/ui'

import * as styles from './PromotionThumbnailField.css'

export type PromotionThumbnailFieldProps = {
  value: UploadedImage | null
  onChange: (value: UploadedImage | null) => void
}

/**
 * 대표 이미지 한 장만 받는 자리. ImageUploader는 여러 장을 타일로 늘어놓는
 * 용도라 '큰 미리보기 + 변경/삭제 버튼'인 여기와는 모양이 다르다.
 */
export function PromotionThumbnailField({
  value,
  onChange,
}: PromotionThumbnailFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const pick = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    // 업로드 API가 아직 없어서 objectURL로 미리보기만 만든다.
    if (value?.url.startsWith('blob:')) URL.revokeObjectURL(value.url)
    onChange({
      id: `${file.name}-${file.lastModified}`,
      url: URL.createObjectURL(file),
      name: file.name,
    })
  }

  const remove = () => {
    if (value?.url.startsWith('blob:')) URL.revokeObjectURL(value.url)
    onChange(null)
  }

  return (
    <div className={styles.root}>
      {value ? (
        <img className={styles.preview} src={value.url} alt={value.name} />
      ) : (
        <button
          type="button"
          className={styles.emptyTile}
          aria-label="썸네일 이미지 추가"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className={styles.addIcon} aria-hidden="true" />
        </button>
      )}

      <div className={styles.side}>
        <span className={styles.guide}>1 : 1 정사각 1장 권장</span>
        <span className={styles.usage}>이벤트 목록 썸네일에 쓰입니다.</span>
        <div className={styles.actions}>
          <Button
            size="small"
            variant="subtle"
            onClick={() => inputRef.current?.click()}
          >
            이미지 변경
          </Button>
          <Button
            size="small"
            variant="outline"
            color="cancel"
            disabled={!value}
            onClick={remove}
          >
            삭제
          </Button>
        </div>
      </div>

      <input
        ref={inputRef}
        className={styles.fileInput}
        type="file"
        accept="image/*"
        onChange={(event) => {
          pick(event.target.files)
          // 같은 파일을 다시 고를 수 있도록 비운다.
          event.target.value = ''
        }}
      />
    </div>
  )
}
