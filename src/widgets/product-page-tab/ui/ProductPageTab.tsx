import * as styles from './ProductPageTab.css'

export type ProductPageTabKey = 'benefits' | 'info' | 'notice' | 'review'

export type ProductPageTabProps = {
  activeTab: ProductPageTabKey
  onTabChange?: (tab: ProductPageTabKey) => void
  className?: string
  excludeTabs?: ProductPageTabKey[]
}

const tabs: { key: ProductPageTabKey; label: string }[] = [
  { key: 'benefits', label: '구매 혜택' },
  { key: 'info', label: '모델 정보' },
  { key: 'notice', label: '유의 사항' },
  { key: 'review', label: '구매 후기' },
]

export function ProductPageTab({
  activeTab,
  onTabChange,
  className,
  excludeTabs,
}: ProductPageTabProps) {
  const visibleTabs = excludeTabs
    ? tabs.filter(({ key }) => !excludeTabs.includes(key))
    : tabs

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {visibleTabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={[styles.tab, key === activeTab && styles.tabActive]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onTabChange?.(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
