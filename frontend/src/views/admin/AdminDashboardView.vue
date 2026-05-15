<template>
  <div class="admin-dashboard">
    <h1>Dashboard Admin</h1>
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">{{ stats.users }}</span>
        <span class="stat-label">Usuarios</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.listings }}</span>
        <span class="stat-label">Alojamientos</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.reservations }}</span>
        <span class="stat-label">Reservas</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${{ formatPrice(stats.revenue) }}</span>
        <span class="stat-label">Ingresos</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const stats = ref({
  users: 1250,
  listings: 340,
  reservations: 890,
  revenue: 45000000
})

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO').format(price)
}
</script>

<style scoped>
.admin-dashboard { padding: var(--spacing-lg); }
h1 { font-size: 20px; margin-bottom: var(--spacing-xl); }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
.stat-card { padding: var(--spacing-lg); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); }
.stat-value { display: block; font-size: 24px; font-weight: 600; color: var(--color-primary); }
.stat-label { font-size: 12px; color: var(--color-text-secondary); }
</style>