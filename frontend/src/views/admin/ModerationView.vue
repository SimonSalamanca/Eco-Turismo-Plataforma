<template>
  <div class="moderation-view">
    <h1>Moderación de Contenido</h1>
    <div class="reports-list">
      <div v-for="report in reports" :key="report.id" class="report-card">
        <div class="report-type">{{ report.type }}</div>
        <p class="report-content">{{ report.content }}</p>
        <div class="report-actions">
          <button class="btn-approve">Aprobar</button>
          <button class="btn-reject">Rechazar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const reports = ref([
  { id: 1, type: 'Listing', content: 'Foto inapropiada en cabaña' },
  { id: 2, type: 'Review', content: 'Reseña con lenguaje ofensivo' }
])
</script>

<style scoped>
.moderation-view { padding: var(--spacing-lg); }
h1 { font-size: 20px; margin-bottom: var(--spacing-xl); }
.reports-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
.report-card { padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); }
.report-type { font-size: 12px; color: var(--color-primary); font-weight: 600; margin-bottom: var(--spacing-xs); }
.report-content { font-size: 14px; margin-bottom: var(--spacing-md); }
.report-actions { display: flex; gap: var(--spacing-sm); }
.btn-approve { padding: 4px 12px; background: var(--color-primary); color: var(--color-white); border-radius: 4px; font-size: 12px; }
.btn-reject { padding: 4px 12px; background: transparent; border: 1px solid var(--color-danger); color: var(--color-danger); border-radius: 4px; font-size: 12px; }
</style>