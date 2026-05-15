<template>
  <div class="profile-view">
    <header class="profile-header">
      <div class="avatar-large">{{ initials }}</div>
      <h1>{{ user?.name || 'Usuario' }}</h1>
      <p>{{ user?.email || 'correo@ejemplo.com' }}</p>
      <button class="btn btn-outline edit-btn">Editar Perfil</button>
    </header>

    <section class="stats-section">
      <div class="stat-item">
        <span class="stat-value">12</span>
        <span class="stat-label">Reservas</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">5</span>
        <span class="stat-label">Destinos</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">8</span>
        <span class="stat-label">Reseñas</span>
      </div>
    </section>

    <section class="menu-section">
      <router-link to="/tourist/bookings" class="menu-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        <span>Mis Reservas</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </router-link>
      <router-link to="/tourist/payments" class="menu-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
        <span>Historial de Pagos</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </router-link>
      <div class="menu-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        <span>Favoritos</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
      <div class="menu-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        <span>Notificaciones</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
      <div class="menu-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        <span>Ayuda y Soporte</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
      <div class="menu-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
        <span>Términos y Condiciones</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
    </section>

    <button class="logout-btn" @click="logout">Cerrar Sesión</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const initials = computed(() => user.value?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U')

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.profile-view { padding: var(--spacing-lg); }
.profile-header { display: flex; flex-direction: column; align-items: center; padding: var(--spacing-xl) 0; }
.avatar-large { width: 80px; height: 80px; border-radius: 50%; background: var(--color-primary); border: 2px solid var(--color-primary); display: flex; align-items: center; justify-content: center; color: var(--color-white); font-size: 28px; font-weight: 600; margin-bottom: var(--spacing-md); }
.profile-header h1 { font-size: 20px; margin-bottom: var(--spacing-xs); }
.profile-header p { font-size: 14px; color: var(--color-text-secondary); margin-bottom: var(--spacing-md); }
.edit-btn { width: auto; padding: var(--spacing-sm) var(--spacing-lg); }
.stats-section { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); padding: var(--spacing-lg); background: var(--color-surface); border-radius: var(--radius-small); margin-bottom: var(--spacing-xl); }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-value { font-size: 20px; font-weight: 600; color: var(--color-text-primary); }
.stat-label { font-size: 12px; color: var(--color-text-secondary); }
.menu-section { display: flex; flex-direction: column; gap: var(--spacing-xs); margin-bottom: var(--spacing-xl); }
.menu-item { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); color: var(--color-text-primary); text-decoration: none; }
.menu-item svg:first-child { color: var(--color-text-secondary); }
.menu-item span { flex: 1; }
.menu-item svg:last-child { color: var(--color-text-secondary); }
.logout-btn { width: 100%; padding: var(--spacing-md); background: transparent; color: var(--color-danger); font-size: 16px; border: none; text-align: center; cursor: pointer; }
</style>