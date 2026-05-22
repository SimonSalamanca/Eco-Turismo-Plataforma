<template>
  <div class="metrics-view">
    <div class="page-header">
      <h1>Métricas de Suscripción</h1>
    </div>

    <div v-if="loading" class="loading-state">Cargando métricas...</div>

    <template v-else>
      <div class="metrics-grid">
        <div class="metric-card">
          <h3>MRR</h3>
          <span class="metric-value">${{ formatPrice(metrics.mrr) }}</span>
          <span class="metric-label">Ingreso recurrente mensual</span>
        </div>
        <div class="metric-card">
          <h3>Total anfitriones</h3>
          <span class="metric-value">{{ metrics.totalHosts }}</span>
        </div>
        <div class="metric-card">
          <h3>Nuevas suscripciones</h3>
          <span class="metric-value">{{ metrics.newSubscriptions }}</span>
          <span class="metric-label">Este mes</span>
        </div>
        <div class="metric-card">
          <h3>Cancelaciones</h3>
          <span class="metric-value">{{ metrics.cancellations }}</span>
          <span class="metric-label">Este mes</span>
        </div>
        <div class="metric-card">
          <h3>Churn rate</h3>
          <span class="metric-value">{{ metrics.churnRate }}%</span>
        </div>
      </div>

      <div class="plans-section">
        <h2>Distribución por plan</h2>
        <div class="plan-bars">
          <div class="plan-bar-item">
            <span>Básico</span>
            <div class="bar-track">
              <div class="bar-fill basic" :style="{ width: planPercent('basic') + '%' }"></div>
            </div>
            <span class="bar-count">{{ metrics.planDistribution?.basic || 0 }}</span>
          </div>
          <div class="plan-bar-item">
            <span>Premium</span>
            <div class="bar-track">
              <div class="bar-fill premium" :style="{ width: planPercent('premium') + '%' }"></div>
            </div>
            <span class="bar-count">{{ metrics.planDistribution?.premium || 0 }}</span>
          </div>
          <div class="plan-bar-item">
            <span>Pro</span>
            <div class="bar-track">
              <div class="bar-fill pro" :style="{ width: planPercent('pro') + '%' }"></div>
            </div>
            <span class="bar-count">{{ metrics.planDistribution?.pro || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="export-section">
        <h2>Exportar datos</h2>
        <button class="btn-export" @click="exportCSV">Descargar CSV de suscripciones</button>
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
    metrics.value = await adminService.getSubscriptionMetrics()
  } catch (err) {
    console.error('Error loading metrics:', err)
  } finally {
    loading.value = false
  }
})

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO').format(price || 0)
}

function planPercent(plan) {
  const total = (metrics.value.planDistribution?.basic || 0)
    + (metrics.value.planDistribution?.premium || 0)
    + (metrics.value.planDistribution?.pro || 0)
  if (total === 0) return 0
  return ((metrics.value.planDistribution?.[plan] || 0) / total * 100)
}

async function exportCSV() {
  try {
    const data = await adminService.exportSubscriptions()
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'subscriptions.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Error exporting CSV:', err)
  }
}
</script>

<style scoped>
.metrics-view { padding: var(--spacing-lg); }
.page-header { margin-bottom: var(--spacing-xl); }
.page-header h1 { font-size: 20px; margin: 0; }
.loading-state { text-align: center; padding: 40px 0; color: var(--color-text-secondary); }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-xl); }
.metric-card { padding: var(--spacing-lg); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); }
.metric-card h3 { font-size: 14px; color: var(--color-text-secondary); margin: 0 0 var(--spacing-xs); }
.metric-value { display: block; font-size: 24px; font-weight: 600; }
.metric-label { font-size: 12px; color: var(--color-text-secondary); }
.plans-section, .export-section { margin-bottom: var(--spacing-xl); }
.plans-section h2, .export-section h2 { font-size: 16px; margin-bottom: var(--spacing-md); }
.plan-bars { display: flex; flex-direction: column; gap: var(--spacing-md); }
.plan-bar-item { display: flex; align-items: center; gap: var(--spacing-md); }
.plan-bar-item span:first-child { width: 80px; font-size: 14px; }
.bar-track { flex: 1; height: 24px; background: var(--color-background); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
.bar-fill.basic { background: #90caf9; }
.bar-fill.premium { background: #ffb74d; }
.bar-fill.pro { background: #81c784; }
.bar-count { width: 40px; text-align: right; font-size: 14px; font-weight: 600; }
.btn-export { padding: 10px 20px; background: var(--color-primary); color: white; border-radius: var(--radius-small); font-size: 14px; }
</style>
