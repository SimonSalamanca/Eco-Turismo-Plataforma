<template>
  <div class="admin-layout">
    <header class="app-header">
      <div class="header-content">
        <h1 class="logo">Eco Turismo Admin</h1>
        <div class="header-actions">
          <button class="icon-button" @click="goToNotifications">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
          <div class="avatar" @click="goToProfile">
            {{ userInitials }}
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <nav class="bottom-nav">
      <router-link
        v-for="item in navItems"
        :key="item.route"
        :to="item.route"
        class="nav-item"
        :class="{ active: isActive(item.route) }"
      >
        <component :is="item.icon" class="nav-icon" />
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const userInitials = computed(() => {
  if (authStore.user?.name) {
    return authStore.user.name.split(' ').map(n => n[0]).join('').toUpperCase()
  }
  return 'A'
})

const DashboardIcon = {
  render() {
    return h('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('rect', { x: 3, y: 3, width: 7, height: 9 }),
      h('rect', { x: 14, y: 3, width: 7, height: 5 }),
      h('rect', { x: 14, y: 12, width: 7, height: 9 }),
      h('rect', { x: 3, y: 16, width: 7, height: 5 })
    ])
  }
}

const UsersIcon = {
  render() {
    return h('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
      h('circle', { cx: 9, cy: 7, r: 4 }),
      h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
      h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
    ])
  }
}

const ShieldIcon = {
  render() {
    return h('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' })
    ])
  }
}

const ChartIcon = {
  render() {
    return h('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('line', { x1: 18, y1: 20, x2: 18, y2: 10 }),
      h('line', { x1: 12, y1: 20, x2: 12, y2: 4 }),
      h('line', { x1: 6, y1: 20, x2: 6, y2: 14 })
    ])
  }
}

const navItems = [
  { route: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { route: '/admin/users', label: 'Usuarios', icon: UsersIcon },
  { route: '/admin/moderation', label: 'Moderación', icon: ShieldIcon },
  { route: '/admin/metrics', label: 'Métricas', icon: ChartIcon }
]

function isActive(path) {
  return route.path.startsWith(path)
}

function goToNotifications() {
  router.push('/admin/notifications')
}

function goToProfile() {
  router.push('/admin/profile')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  height: var(--header-height);
  background: var(--color-primary);
  box-shadow: var(--shadow-header);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
}

.logo {
  font-family: var(--font-secondary);
  font-size: 16px;
  font-weight: 500;
  color: var(--color-white);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.icon-button {
  background: transparent;
  padding: var(--spacing-xs);
  color: var(--color-white);
  display: flex;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.main-content {
  flex: 1;
  margin-top: var(--header-height);
  margin-bottom: var(--bottom-nav-height);
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottom-nav-height);
  background: var(--color-white);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-xs);
  color: var(--color-text-secondary);
  text-decoration: none;
}

.nav-item.active {
  color: var(--color-primary);
}

.nav-icon {
  width: 24px;
  height: 24px;
}

.nav-label {
  font-size: 11px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>