import { useState, type ImgHTMLAttributes } from 'react'

import * as styles from './ImageWithFallback.css'

export type ImageWithFallbackProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src'
> & {
  /** 비었거나 불러오지 못하면 망원경 대체 그림을 같은 자리(className)에 그린다. */
  src?: string | null
}

// 이미지가 없거나 깨졌을 때 빈 칸 대신 대체 그림을 보여 준다. 크기는 className이 정한 자리 폭을 따른다.
export function ImageWithFallback({
  src,
  alt = '',
  className,
  onError,
  ...props
}: ImageWithFallbackProps) {
  // 실패한 주소를 기억한다 — 다른 주소로 바뀌면 다시 불러 본다.
  const [failedSrc, setFailedSrc] = useState<string>()

  if (!src || src === failedSrc) {
    return <ImageFallback alt={alt} className={className} />
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(event) => {
        setFailedSrc(src)
        onError?.(event)
      }}
      {...props}
    />
  )
}

function ImageFallback({
  alt,
  className,
}: {
  alt: string
  className?: string
}) {
  // alt가 비면 꾸밈 이미지였으니 대체 그림도 읽지 않는다.
  const a11y = alt
    ? { role: 'img', 'aria-label': alt }
    : { 'aria-hidden': true }

  return (
    <div
      className={[className, styles.root].filter(Boolean).join(' ')}
      {...a11y}
    >
      <div className={styles.surface}>
        <HubbleIcon />
        <span className={styles.label}>이미지를 불러올 수 없어요</span>
      </div>
    </div>
  )
}

// 우주 망원경(허블) 그림 — 기울어진 몸통 양옆에 태양전지판, 위로 안테나.
function HubbleIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
      className={styles.icon}
    >
      <g transform="rotate(22 32 32)">
        <path
          d="M32 26V20M32 40V44M24 24L23 9M22.4 9.4l2.6-3.2"
          className={styles.frame}
        />
        <ellipse
          cx="23.6"
          cy="5.6"
          rx="3"
          ry="1.6"
          transform="rotate(-30 23.6 5.6)"
          className={[styles.raised, styles.frame].join(' ')}
        />
        <rect
          x="20"
          y="12"
          width="24"
          height="8"
          rx="0.8"
          className={[styles.raised, styles.frame].join(' ')}
        />
        <rect
          x="20"
          y="44"
          width="24"
          height="8"
          rx="0.8"
          className={[styles.raised, styles.frame].join(' ')}
        />
        <path
          d="M28 12v8M36 12v8M28 44v8M36 44v8M20 16h24M20 48h24"
          className={styles.seam}
        />
        <path
          d="M8.6 26 L4.4 17.6 Q3.4 14.4 6.4 13.8 L10.2 13.2 Q13 13 13.2 15.8 L13.4 26"
          className={[styles.recessed, styles.outline].join(' ')}
        />
        <rect
          x="8"
          y="26"
          width="23"
          height="12"
          rx="1.4"
          className={[styles.recessed, styles.outline].join(' ')}
        />
        <rect
          x="30"
          y="24"
          width="24"
          height="16"
          rx="2"
          className={[styles.recessed, styles.outline].join(' ')}
        />
        <path d="M17 26v12M38 24v16M46 24v16" className={styles.frame} />
        <path
          d="M54 29.5h2.2a1.6 1.6 0 0 1 0 5H54"
          className={[styles.recessed, styles.outline].join(' ')}
        />
      </g>
    </svg>
  )
}
