<template>
  <div class="admin-dashboard">
    <div class="page-header">
      <h1>Dashboard</h1>
      <span class="subtitle">Panel de administración</span>
    </div>

    <div v-if="loading" class="loading-state">
      <span>Cargando datos del dashboard...</span>
    </div>

    <template v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ metrics.totalUsers }}</span>
          <span class="stat-label">Usuarios totales</span>
          <div class="stat-breakdown">
            <span>{{ metrics.usersByRole?.tourist || 0 }} turistas</span>
            <span>·</span>
            <span>{{ metrics.usersByRole?.host || 0 }} anfitriones</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ metrics.activeHosts }}</span>
          <span class="stat-label">Anfitriones activos</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ metrics.monthlyReservations }}</span>
          <span class="stat-label">Reservas del mes</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${{ formatPrice(metrics.monthlyAmount) }}</span>
          <span class="stat-label">Ingresos del mes</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ metrics.newSubscriptions }}</span>
          <span class="stat-label">Nuevas suscripciones</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ metrics.cancellations }}</span>
          <span class="stat-label">Cancelaciones del mes</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ metrics.churnRate }}%</span>
          <span class="stat-label">Tasa de churn</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ metrics.pendingReports }}</span>
          <span class="stat-label">Reportes pendientes</span>
        </div>
      </div>

      <div v-if="metrics.recentReservations?.length" class="recent-section">
        <h2>Reservas recientes</h2>
        <div class="recent-list">
          <div v-for="res in metrics.recentReservations" :key="res.id" class="recent-item">
            <div class="recent-info">
              <strong>{{ res.listing?.title }}</strong>
              <span>{{ res.tourist?.full_name }}</span>
            </div>
            <span class="recent-status" :class="res.status">{{ res.status }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import adminService from '@/services/admin.service'

const loading = ref(true)
const metrics = ref({})

onMounted(async () => {
  try {
    metrics.value = await adminService.getDashboard()
  } catch (err) {
    console.error('Error loading dashboard:', err)
  } finally {
    loading.value = false
  }
})

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO').format(price || 0)
}
</script>

<style scoped>
.admin-dashboard { padding: var(--spacing-lg); }
.page-header { margin-bottom: var(--spacing-xl); }
.page-header h1 { font-size: 20px; margin: 0; }
.subtitle { font-size: 12px; color: var(--color-text-secondary); }
.loading-state { text-align: center; padding: 60px 0; color: var(--color-text-secondary); }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-xl); }
.stat-card { padding: var(--spacing-lg); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); }
.stat-value { display: block; font-size: 22px; font-weight: 600; color: var(--color-primary); }
.stat-label { font-size: 12px; color: var(--color-text-secondary); }
.stat-breakdown { font-size: 11px; color: var(--color-text-secondary); margin-top: 4px; display: flex; gap: 4px; }
.recent-section h2 { font-size: 16px; margin-bottom: var(--spacing-md); }
.recent-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }
.recent-item { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-sm) var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); }
.recent-info { display: flex; flex-direction: column; }
.recent-info strong { font-size: 14px; }
.recent-info span { font-size: 12px; color: var(--color-text-secondary); }
.recent-status { font-size: 11px; padding: 2px 8px; border-radius: 4px; text-transform: capitalize; }
.recent-status.confirmed { background: #e3f2fd; color: #1565c0; }
.recent-status.completed { background: #e8f5e9; color: #2e7d32; }
.recent-status.cancelled { background: #fbe9e7; color: #c62828; }
</style>
