import { useAuthStore } from '@/stores/auth.store'

export function requireAuth(to, from, next) {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.role && authStore.user?.role !== to.meta.role) {
    if (authStore.user?.role === 'host') {
      next({ name: 'HostDashboard' })
    } else if (authStore.user?.role === 'admin') {
      next({ name: 'AdminDashboard' })
    } else {
      next({ name: 'TouristHome' })
    }
    return
  }

  next()
}

export function requireGuest(to, from, next) {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    if (authStore.user?.role === 'host') {
      next({ name: 'HostDashboard' })
    } else if (authStore.user?.role === 'admin') {
      next({ name: 'AdminDashboard' })
    } else {
      next({ name: 'TouristHome' })
    }
    return
  }

  next()
}

export function requireRole(to, from, next) {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (authStore.user?.role !== to.meta.role) {
    next({ name: 'TouristHome' })
    return
  }

  next()
}