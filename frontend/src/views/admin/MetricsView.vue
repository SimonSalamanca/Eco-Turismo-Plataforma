<template>
  <div class="metrics-view">
    <h1>Métricas y Analytics</h1>
    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Usuarios nuevos</h3>
        <span class="metric-value">125</span>
        <span class="metric-change positive">+15%</span>
      </div>
      <div class="metric-card">
        <h3>Reservas este mes</h3>
        <span class="metric-value">340</span>
        <span class="metric-change positive">+8%</span>
      </div>
      <div class="metric-card">
        <h3>Ingresos</h3>
        <span class="metric-value">$45M</span>
        <span class="metric-change positive">+22%</span>
      </div>
      <div class="metric-card">
        <h3>Cancelaciones</h3>
        <span class="metric-value">12</span>
        <span class="metric-change negative">-5%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metrics-view { padding: var(--spacing-lg); }
h1 { font-size: 20px; margin-bottom: var(--spacing-xl); }
.metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
.metric-card { padding: var(--spacing-lg); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); }
.metric-card h3 { font-size: 14px; color: var(--color-text-secondary); margin-bottom: var(--spacing-sm); }
.metric-value { display: block; font-size: 24px; font-weight: 600; }
.metric-change { font-size: 12px; }
.metric-change.positive { color: var(--color-success); }
.metric-change.negative { color: var(--color-danger); }
</style>