<template>
  <div class="host-layout">
    <header class="app-header">
      <div class="header-content">
        <button class="hamburger-btn" @click="toggleSidebar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <h1 class="logo">Eco Turismo</h1>
        <div class="header-actions">
          <button class="icon-button desktop-only" @click="goToNotifications">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
          <div class="profile-dropdown" @click="toggleProfileDropdown">
            <div class="avatar">{{ userInitials }}</div>
            <div v-if="showProfileDropdown" class="dropdown-menu">
              <router-link to="/host/profile" class="dropdown-item" @click="showProfileDropdown = false">
                Mi Perfil
              </router-link>
              <button class="dropdown-item" @click="logout">Cerrar Sesión</button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-overlay" @click="closeSidebar"></div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.route"
          :to="item.route"
          class="sidebar-item"
          :class="{ active: isActive(item.route) }"
          @click="closeSidebar"
        >
          <component :is="item.icon" class="sidebar-icon" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <nav class="bottom-nav mobile-only">
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
import { ref, computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const sidebarOpen = ref(false)
const showProfileDropdown = ref(false)

const userInitials = computed(() => {
  if (authStore.user?.name) {
    return authStore.user.name.split(' ').map(n => n[0]).join('').toUpperCase()
  }
  return 'H'
})

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

function toggleProfileDropdown() {
  showProfileDropdown.value = !showProfileDropdown.value
}

async function logout() {
  showProfileDropdown.value = false
  await authStore.logout()
  router.push('/login')
}

const DashboardIcon = {
  render() {
    return h('svg', {
      width: 24, height: 24, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', 'stroke-width': 2
    }, [
      h('rect', { x: 3, y: 3, width: 7, height: 9 }),
      h('rect', { x: 14, y: 3, width: 7, height: 5 }),
      h('rect', { x: 14, y: 12, width: 7, height: 9 }),
      h('rect', { x: 3, y: 16, width: 7, height: 5 })
    ])
  }
}

const ListingsIcon = {
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

const ReservationsIcon = {
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

const CalendarIcon = {
  render() {
    return h('svg', {
      width: 24, height: 24, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', 'stroke-width': 2
    }, [
      h('rect', { x: 3, y: 4, width: 18, height: 18, rx: 2, ry: 2 }),
      h('line', { x1: 16, y1: 2, x2: 16, y2: 6 }),
      h('line', { x1: 8, y1: 2, x2: 8, y2: 6 }),
      h('line', { x1: 3, y1: 10, x2: 21, y2: 10 }),
      h('path', { d: 'M8 14h.01' }),
      h('path', { d: 'M12 14h.01' }),
      h('path', { d: 'M16 14h.01' }),
      h('path', { d: 'M8 18h.01' }),
      h('path', { d: 'M12 18h.01' })
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

const ReviewsIcon = {
  render() {
    return h('svg', {
      width: 24, height: 24, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', 'stroke-width': 2
    }, [
      h('path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }),
      h('path', { d: 'M8 10h.01' }),
      h('path', { d: 'M12 10h.01' }),
      h('path', { d: 'M16 10h.01' })
    ])
  }
}

const navItems = [
  { route: '/host/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { route: '/host/listings', label: 'Publicaciones', icon: ListingsIcon },
  { route: '/host/reservations', label: 'Reservas', icon: ReservationsIcon },
  { route: '/host/calendar', label: 'Calendario', icon: CalendarIcon },
  { route: '/host/reviews', label: 'Reseñas', icon: ReviewsIcon },
  { route: '/host/profile', label: 'Perfil', icon: UserIcon }
]

function isActive(path) {
  return route.path.startsWith(path)
}

function goToNotifications() {
  router.push('/host/notifications')
}

function goToProfile() {
  router.push('/host/profile')
}
</script>

<style scoped>
.host-layout {
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
  padding: var(--spacing-xs) var(--spacing-sm);
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
  font-size: 11px;
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

.hamburger-btn {
  display: none;
  background: transparent;
  padding: var(--spacing-xs);
  color: var(--color-white);
}

.profile-dropdown {
  position: relative;
  cursor: pointer;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--color-white);
  border-radius: var(--radius-small);
  box-shadow: var(--shadow-card);
  min-width: 150px;
  z-index: 200;
  overflow: hidden;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: var(--spacing-md);
  text-align: left;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 14px;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.dropdown-item:hover {
  background: var(--color-surface);
}

.sidebar {
  display: none;
}

@media (min-width: 1024px) {
  .hamburger-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .desktop-only {
    display: flex;
  }

  .mobile-only {
    display: none;
  }

  .logo {
    margin-left: var(--spacing-sm);
  }

  .header-content {
    max-width: var(--container-max-width);
    margin: 0 auto;
  }

  .sidebar {
    display: block;
    position: fixed;
    top: var(--header-height);
    left: 0;
    bottom: 0;
    width: var(--sidebar-width);
    background: var(--color-white);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    z-index: 150;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: none;
  }

  .sidebar.open .sidebar-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: var(--sidebar-width);
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: -1;
  }

  .sidebar-nav {
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    color: var(--color-text-secondary);
    text-decoration: none;
    border-radius: var(--radius-small);
    transition: all 0.2s;
  }

  .sidebar-item:hover {
    background: var(--color-surface);
    color: var(--color-text-primary);
  }

  .sidebar-item.active {
    background: var(--color-primary);
    color: var(--color-white);
  }

  .sidebar-icon {
    width: 20px;
    height: 20px;
  }

  .main-content {
    margin-left: auto;
    margin-right: auto;
    padding: var(--spacing-xl);
    width: 100%;
    max-width: var(--container-max-width);
  }
}
</style>