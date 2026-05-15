<template>
  <div class="host-profile-view">
    <div v-if="loading" class="loading">Cargando...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else>
      <header class="profile-header">
        <div class="avatar-large">{{ initials }}</div>
        <h1>{{ user?.full_name || user?.name || 'Anfitrión' }}</h1>
        <div class="verified-badge" v-if="user?.email_verified_at">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="var(--color-primary)" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          Anfitrión verificado
        </div>
      </header>

      <section class="stats-section">
        <div class="stat-item">
          <span class="stat-value">{{ stats.properties }}</span>
          <span class="stat-label">Propiedades</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.totalReservations }}</span>
          <span class="stat-label">Reservas totales</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.rating }}</span>
          <span class="stat-label">Calificación</span>
        </div>
      </section>

      <section class="menu-section">
        <router-link to="/host/listings" class="menu-item">
          <span>Mis Publicaciones</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </router-link>
        <router-link to="/host/reservations" class="menu-item">
          <span>Mis Reservas</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </router-link>
        <router-link to="/host/subscription" class="menu-item">
          <span>Planes de Suscripción</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </router-link>
        <router-link to="/host/calendar" class="menu-item">
          <span>Calendarios</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </router-link>
      </section>

      <button class="logout-btn" @click="logout">Cerrar Sesión</button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import listingsService from '@/services/listings.service'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const initials = computed(() => {
  const name = user.value?.full_name || user.value?.name || ''
  return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'H'
})

const loading = ref(true)
const error = ref(null)
const stats = ref({
  properties: 0,
  totalReservations: 0,
  rating: 0
})

async function loadStats() {
  try {
    loading.value = true
    const response = await listingsService.getHostDashboardStats()
    stats.value = response.data
  } catch (err) {
    console.error('Error loading stats:', err)
    error.value = 'Error al cargar las estadísticas'
  } finally {
    loading.value = false
  }
}

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(loadStats)
</script>

<style scoped>
.host-profile-view { padding: var(--spacing-lg); }
.profile-header { display: flex; flex-direction: column; align-items: center; padding: var(--spacing-xl) 0; }
.avatar-large { width: 80px; height: 80px; border-radius: 50%; background: var(--color-primary); display: flex; align-items: center; justify-content: center; color: var(--color-white); font-size: 28px; font-weight: 600; margin-bottom: var(--spacing-md); }
.profile-header h1 { font-size: 20px; margin-bottom: var(--spacing-sm); }
.verified-badge { display: flex; align-items: center; gap: 4px; color: var(--color-primary); font-size: 14px; }
.stats-section { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); padding: var(--spacing-lg); background: var(--color-surface); border-radius: var(--radius-small); margin-bottom: var(--spacing-xl); }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-value { font-size: 20px; font-weight: 600; color: var(--color-text-primary); }
.stat-label { font-size: 12px; color: var(--color-text-secondary); }
.menu-section { display: flex; flex-direction: column; gap: var(--spacing-xs); margin-bottom: var(--spacing-xl); }
.menu-item { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); color: var(--color-text-primary); text-decoration: none; }
.menu-item svg { color: var(--color-text-secondary); }
.logout-btn { width: 100%; padding: var(--spacing-md); background: transparent; color: var(--color-danger); font-size: 16px; border: none; text-align: center; cursor: pointer; }
</style>