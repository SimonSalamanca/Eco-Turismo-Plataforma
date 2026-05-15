<template>
  <div class="tourist-layout">
    <header class="app-header">
      <div class="header-content">
        <h1 class="logo">Eco Turismo</h1>
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
        <transition name="slide" mode="out-in">
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
  return 'U'
})

const HomeIcon = {
  render() {
    return h('svg', {
      width: 24, height: 24, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', 'stroke-width': 2
    }, [
      h('path', { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }),
      h('polyline', { points: '9 22 9 12 15 12 15 22' })
    ])
  }
}

const SearchIcon = {
  render() {
    return h('svg', {
      width: 24, height: 24, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', 'stroke-width': 2
    }, [
      h('circle', { cx: 11, cy: 11, r: 8 }),
      h('line', { x1: 21, y1: 21, x2: 16.65, y2: 16.65 })
    ])
  }
}

const CalendarIcon = {
  render() {
    return h('svg', {
      width: 24, height: 24, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', 'stroke-width': 2
    }, [
      h('rect', { x: 3, y: 4, width: 18, height: 18, rx: 2, ry: 2 }),
      h('line', { x1: 16, y1: 2, x2: 16, y2: 6 }),
      h('line', { x1: 8, y1: 2, x2: 8, y2: 6 }),
      h('line', { x1: 3, y1: 10, x2: 21, y2: 10 })
    ])
  }
}

const UserIcon = {
  render() {
    return h('svg', {
      width: 24, height: 24, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', 'stroke-width': 2
    }, [
      h('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }),
      h('circle', { cx: 12, cy: 7, r: 4 })
    ])
  }
}

const navItems = [
  { route: '/tourist/home', label: 'Inicio', icon: HomeIcon },
  { route: '/tourist/search', label: 'Buscar', icon: SearchIcon },
  { route: '/tourist/bookings', label: 'Reservas', icon: CalendarIcon },
  { route: '/tourist/profile', label: 'Perfil', icon: UserIcon }
]

function isActive(path) {
  return route.path.startsWith(path)
}

function goToNotifications() {
  router.push('/tourist/notifications')
}

function goToProfile() {
  router.push('/tourist/profile')
}
</script>

<style scoped>
.tourist-layout {
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
  font-size: 18px;
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
  align-items: center;
  justify-content: center;
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
  padding-bottom: var(--spacing-lg);
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottom-nav-height);
  background: var(--color-white);
  border-top: 1px solid var(--color-border);
  box-shadow: 0px -4px 3px rgba(0, 0, 0, 0.1);
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
  padding: var(--spacing-xs) var(--spacing-md);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

.nav-item.active {
  color: var(--color-primary);
}

.nav-icon {
  width: 24px;
  height: 24px;
}

.nav-label {
  font-size: 12px;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>