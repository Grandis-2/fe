import { Outlet } from 'react-router'

import { AdminSidebar } from '@/widgets/admin-sidebar'

import * as styles from './AdminLayout.css'

export function AdminLayout() {
  return (
    <div className={styles.root}>
      <AdminSidebar />
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
