import { useRef } from 'react'

import { ImagePlus } from 'lucide-react'

import { useObjectUrls } from '@shared/lib/useObjectUrls'
import { Button, FieldError } from '@shared/ui'
import type { UploadedImage } from '@shared/ui'

import * as styles from './PromotionThumbnailField.css'

export type PromotionThumbnailFieldProps = {
  value: UploadedImage | null
  onChange: (value: UploadedImage | null) => void
  /** 고른 파일을 바로 올리고 서버 주소를 돌려준다. 실패하면 메시지를 담아 던진다 */
  upload: (file: File) => Promise<string>
}

/**
 * 대표 이미지 한 장만 받는 자리. ImageUploader는 여러 장을 타일로 늘어놓는
 * 용도라 '큰 미리보기 + 변경/삭제 버튼'인 여기와는 모양이 다르다.
 */
export function PromotionThumbnailField({
  value,
  onChange,
  upload,
}: PromotionThumbnailFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { create, release } = useObjectUrls()
  // 올리는 사이 다른 사진으로 바꾸거나 지우면 늦게 끝난 결과가 덮어쓰지 않게 한다.
  const currentIdRef = useRef<string | null>(null)

  const pick = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    release(value?.previewUrl)
    const previewUrl = create(file)
    const picked: UploadedImage = {
      id: `${file.name}-${file.lastModified}`,
      url: previewUrl,
      previewUrl,
      name: file.name,
      status: 'uploading',
    }
    currentIdRef.current = picked.id
    onChange(picked)

    upload(file)
      .then((url) => ({ ...picked, url, status: undefined }))
      .catch((caught: unknown) => ({
        ...picked,
        status: 'error' as const,
        error:
          caught instanceof Error
            ? caught.message
            : '사진을 올리지 못했습니다.',
      }))
      .then((settled) => {
        if (currentIdRef.current === picked.id) onChange(settled)
      })
  }

  const remove = () => {
    release(value?.previewUrl)
    currentIdRef.current = null
    onChange(null)
  }

  return (
    <div className={styles.root}>
      {value ? (
        <img
          className={styles.preview}
          src={value.previewUrl ?? value.url}
          alt={value.name}
        />
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
        <span className={styles.usage}>
          {value?.status === 'uploading'
            ? '사진을 올리는 중입니다.'
            : '이벤트 목록 썸네일에 쓰입니다.'}
        </span>
        <FieldError
          message={value?.status === 'error' ? value.error : undefined}
        />
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
        accept="image/jpeg,image/png"
        onChange={(event) => {
          pick(event.target.files)
          // 같은 파일을 다시 고를 수 있도록 비운다.
          event.target.value = ''
        }}
      />
    </div>
  )
}
