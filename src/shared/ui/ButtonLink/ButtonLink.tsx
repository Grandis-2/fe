import type { AnchorHTMLAttributes } from 'react'

import { Link } from 'react-router'

import * as buttonStyles from '../Button/Button.css'
import {
  iconSize,
  variantStyles,
  type ButtonColor,
  type ButtonSize,
  type ButtonVariant,
} from '../Button/buttonVariants'

import * as styles from './ButtonLink.css'

import type { LucideIcon } from 'lucide-react'

export type ButtonLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'color' | 'href'
> & {
  /** 앱 안 경로 — react-router Link로 간다 */
  to?: string
  /** 밖 주소 — 새 탭으로 연다 */
  href?: string
  color?: ButtonColor
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
}

/**
 * 버튼 모양의 링크 — 누르면 다른 화면·주소로 가는 것(Grafana, 다른 관리자 화면). 버튼에
 * navigate를 다는 대신 링크로 둬야 새 탭으로 열기·주소 복사가 된다. 모양은 Button과 같다.
 */
export function ButtonLink({
  to,
  href,
  color = 'primary',
  variant = 'solid',
  size = 'medium',
  icon: Icon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const classes = [
    buttonStyles.size[size],
    variantStyles[variant][color],
    styles.link,
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const content = (
    <>
      {Icon && <Icon size={iconSize[size]} className={buttonStyles.icon} />}
      {children}
    </>
  )
  if (to)
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={classes}
      {...rest}
    >
      {content}
    </a>
  )
}
