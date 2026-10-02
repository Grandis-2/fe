import { useId, useRef } from 'react'

import { Plus, X } from 'lucide-react'

import { useObjectUrls } from '@/shared/lib/useObjectUrls'

import * as styles from './ImageUploader.css'

export type UploadedImage = {
  id: string
  /** 미리보기용 URL */
  url: string
  name: string
}

export type ImageUploaderProps = {
  value: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  /** 담을 수 있는 최대 장수 */
  max?: number
  /** 타일 비율 — 옵션 이미지는 square, 상세/사양 이미지는 portrait */
  ratio?: 'square' | 'portrait'
  label?: string
  /** 라벨 줄 오른쪽에 `4 / 10` 카운터를 보여줄지 */
  showCount?: boolean
  className?: string
}

export function ImageUploader({
  value,
  onChange,
  max = 10,
  ratio = 'square',
  label,
  showCount = true,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  // 업로드 API가 아직 없어서 objectURL로 미리보기만 만든다.
  // 실제 API가 붙으면 여기서 업로드하고 응답 URL을 넣는다.
  const { create, release } = useObjectUrls()
  const isFull = value.length >= max

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const room = max - value.length
    const added = Array.from(files)
      .slice(0, room)
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        url: create(file),
        name: file.name,
      }))
    onChange([...value, ...added])
  }

  const removeImage = (target: UploadedImage) => {
    // 목록에서 빠지면 다시 참조할 일이 없으니 여기서 해제해야 샌다.
    release(target.url)
    onChange(value.filter((image) => image.id !== target.id))
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {(label || showCount) && (
        <div className={styles.header}>
          {label && (
            <label className={styles.label} htmlFor={inputId}>
              {label}
            </label>
          )}
          {showCount && (
            <span className={styles.count}>
              {value.length} / {max}
            </span>
          )}
        </div>
      )}

      <div className={styles.tiles}>
        {value.map((image) => (
          <div key={image.id} className={styles.tile[ratio]}>
            <img
              className={styles.thumbnail}
              src={image.url}
              alt={image.name}
            />
            <button
              type="button"
              className={styles.removeButton}
              aria-label={`${image.name} 삭제`}
              onClick={() => removeImage(image)}
            >
              <X className={styles.removeIcon} aria-hidden="true" />
            </button>
          </div>
        ))}

        {!isFull && (
          <button
            type="button"
            className={styles.addTile[ratio]}
            aria-label="이미지 추가"
            onClick={() => inputRef.current?.click()}
          >
            <Plus className={styles.addIcon} aria-hidden="true" />
          </button>
        )}

        <input
          id={inputId}
          ref={inputRef}
          className={styles.fileInput}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            addFiles(event.target.files)
            // 같은 파일을 연속으로 고를 수 있도록 비운다.
            event.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
