import { useEffect, useId, useLayoutEffect, useRef } from 'react'

import { AlertCircle, Loader2, Plus, RotateCw, X } from 'lucide-react'

import { useObjectUrls } from '@shared/lib/useObjectUrls'

import * as styles from './ImageUploader.css'

export type UploadedImage = {
  id: string
  /** 저장·전송할 주소. upload가 있으면 올리기가 끝난 뒤 서버 주소로 바뀐다 */
  url: string
  name: string
  /**
   * 화면에만 쓰는 미리보기(objectURL). 올리기가 끝나도 남겨 둬서 서버 주소로 바꿀 때
   * 사진이 깜빡이지 않는다. 서버에서 받아 온 사진에는 없다.
   */
  previewUrl?: string
  /** 'uploading'·'error'면 아직 url이 서버 주소가 아니다 — 보내면 안 된다 */
  status?: 'uploading' | 'error'
  /** status가 'error'일 때 보여줄 이유 */
  error?: string
}

export type ImageUploaderProps = {
  value: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  /**
   * 고른 파일을 바로 올리고 서버 주소를 돌려준다. 실패하면 메시지를 담아 던진다 — 그
   * 사진 칸에 보여주고 다시 시도할 수 있게 한다. 없으면 미리보기만 만든다.
   */
  upload?: (file: File) => Promise<string>
  /** 파일 선택 창에서 고를 수 있는 형식 */
  accept?: string
  /** 담을 수 있는 최대 장수 */
  max?: number
  /** 타일 비율 — 옵션 이미지는 square, 상세/사양 이미지는 portrait */
  ratio?: 'square' | 'portrait'
  label?: string
  /** 라벨 줄 오른쪽에 `4 / 10` 카운터를 보여줄지 */
  showCount?: boolean
  /**
   * 추가·삭제를 모두 막는다. 흐리게만 처리하면(opacity·pointerEvents) Tab으로
   * 버튼에 닿아 키보드로는 그대로 조작된다 — 막아야 할 땐 이걸 쓴다.
   */
  disabled?: boolean
  className?: string
}

const FALLBACK_ERROR = '사진을 올리지 못했습니다.'

/**
 * 이미지 여러 장을 담는 업로더. upload를 주면 고르는 즉시 한 장씩 올리고, 칸마다
 * 올리는 중·실패를 보여준다.
 *
 * 올리기는 비동기라 끝나는 시점의 목록에 반영해야 한다. 렌더 때의 value로 계산하면 여러
 * 장이 거의 동시에 끝날 때 앞서 끝난 결과를 덮어쓴다 — 그래서 마지막으로 내보낸 목록을
 * ref에 들고, 내보낼 때마다 바로 갱신한다.
 */
export function ImageUploader({
  value,
  onChange,
  upload,
  accept = 'image/*',
  max = 10,
  ratio = 'square',
  label,
  showCount = true,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const { create, release } = useObjectUrls()
  const isFull = value.length >= max

  const latestRef = useRef(value)
  useLayoutEffect(() => {
    latestRef.current = value
  }, [value])
  // 다시 시도할 때 쓸 원본 파일. 다 올라가면 버린다.
  const filesRef = useRef(new Map<string, File>())
  // 언마운트 뒤 끝난 올리기는 반영하지 않는다(색상 칸을 지운 경우 등).
  const mountedRef = useRef(false)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const commit = (next: UploadedImage[]) => {
    latestRef.current = next
    onChange(next)
  }

  const patchImage = (id: string, partial: Partial<UploadedImage>) => {
    if (!mountedRef.current) return
    // 올리는 중에 지운 사진이면 반영할 곳이 없다.
    if (!latestRef.current.some((image) => image.id === id)) return
    commit(
      latestRef.current.map((image) =>
        image.id === id ? { ...image, ...partial } : image,
      ),
    )
  }

  const startUpload = (id: string, file: File) => {
    if (!upload) return
    upload(file).then(
      (url) => {
        filesRef.current.delete(id)
        patchImage(id, { url, status: undefined, error: undefined })
      },
      (caught: unknown) =>
        patchImage(id, {
          status: 'error',
          error: caught instanceof Error ? caught.message : FALLBACK_ERROR,
        }),
    )
  }

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const room = max - latestRef.current.length
    const added = Array.from(files)
      .slice(0, room)
      .map((file) => {
        const preview = create(file)
        const image: UploadedImage = {
          id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
          url: preview,
          name: file.name,
          ...(upload && { previewUrl: preview, status: 'uploading' as const }),
        }
        return { image, file }
      })
    commit([...latestRef.current, ...added.map(({ image }) => image)])
    for (const { image, file } of added) {
      filesRef.current.set(image.id, file)
      startUpload(image.id, file)
    }
  }

  const retry = (target: UploadedImage) => {
    const file = filesRef.current.get(target.id)
    if (!file) return
    patchImage(target.id, { status: 'uploading', error: undefined })
    startUpload(target.id, file)
  }

  const removeImage = (target: UploadedImage) => {
    // 목록에서 빠지면 다시 참조할 일이 없으니 여기서 해제해야 샌다.
    release(target.previewUrl ?? target.url)
    filesRef.current.delete(target.id)
    commit(latestRef.current.filter((image) => image.id !== target.id))
  }

  const firstError = value.find((image) => image.status === 'error')?.error

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
              src={image.previewUrl ?? image.url}
              alt={image.name}
            />
            {image.status === 'uploading' && (
              <div className={styles.overlay} role="status">
                <Loader2 className={styles.spinner} aria-hidden="true" />
                <span className={styles.srOnly}>{image.name} 올리는 중</span>
              </div>
            )}
            {image.status === 'error' && (
              <div
                className={[styles.overlay, styles.overlayError].join(' ')}
                title={image.error}
              >
                <button
                  type="button"
                  className={styles.retryButton}
                  aria-label={`${image.name} 다시 올리기`}
                  disabled={disabled}
                  onClick={() => retry(image)}
                >
                  <RotateCw className={styles.retryIcon} aria-hidden="true" />
                </button>
              </div>
            )}
            <button
              type="button"
              className={styles.removeButton}
              aria-label={`${image.name} 삭제`}
              disabled={disabled}
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
            disabled={disabled}
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
          accept={accept}
          multiple
          disabled={disabled}
          onChange={(event) => {
            addFiles(event.target.files)
            // 같은 파일을 연속으로 고를 수 있도록 비운다.
            event.target.value = ''
          }}
        />
      </div>

      {firstError && (
        <div className={styles.errorText} role="alert">
          <AlertCircle className={styles.errorIcon} aria-hidden="true" />
          {firstError} 실패한 사진의 ↻ 버튼으로 다시 올릴 수 있습니다.
        </div>
      )}
    </div>
  )
}
