<template>
  <div class="moderation-view">
    <div class="page-header">
      <h1>Moderación de Contenido</h1>
    </div>

    <div class="filters-bar">
      <select v-model="filters.status" @change="fetchReports">
        <option value="pending">Pendientes</option>
        <option value="approved">Aprobados</option>
        <option value="edited">Editados</option>
        <option value="removed">Eliminados</option>
      </select>
      <select v-model="filters.content_type" @change="fetchReports">
        <option value="">Todos los tipos</option>
        <option value="listing">Listing</option>
        <option value="review">Reseña</option>
      </select>
    </div>

    <div v-if="loading" class="loading-state">Cargando reportes...</div>

    <div v-else-if="errorMessage" class="error-state">{{ errorMessage }}</div>

    <template v-else>
      <div v-if="reports.length === 0" class="empty-state">No hay reportes pendientes.</div>

      <div v-else class="reports-list">
        <div v-for="report in reports" :key="report.id" class="report-card" :class="{ overdue: report.is_overdue }">
          <div class="report-header">
            <span class="report-badge" :class="report.content_type">{{ report.content_type }}</span>
            <span v-if="report.is_overdue" class="overdue-badge">+48h</span>
            <span class="report-date">{{ formatDate(report.created_at) }}</span>
          </div>
          <p class="report-reason"><strong>Motivo:</strong> {{ report.reason }}</p>
          <p v-if="report.description" class="report-desc">{{ report.description }}</p>
          <div class="report-meta">
            <span>Reportado por: {{ report.reporter?.full_name || 'Anónimo' }}</span>
          </div>
          <div v-if="report.content" class="report-content-preview">
            <p v-if="report.content_type === 'listing'"><strong>{{ report.content.title }}</strong></p>
            <p v-else><em>{{ report.content.comment }}</em> ({{ report.content.rating }}/5)</p>
          </div>
          <div v-if="report.status === 'pending'" class="report-actions">
            <button class="btn-approve" @click="resolve(report.id, 'approve')">Aprobar</button>
            <button class="btn-edit" @click="resolve(report.id, 'edit')">Marcar edición</button>
            <button class="btn-delete" @click="resolve(report.id, 'delete')">Eliminar</button>
          </div>
          <div v-else class="resolved-info">
            Resuelto: {{ report.status }}
          </div>
        </div>
      </div>

      <div v-if="pagination.totalPages > 1" class="pagination">
        <button :disabled="pagination.page <= 1" @click="goPage(pagination.page - 1)">Anterior</button>
        <span>Página {{ pagination.page }} de {{ pagination.totalPages }}</span>
        <button :disabled="pagination.page >= pagination.totalPages" @click="goPage(pagination.page + 1)">Siguiente</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import adminService from '@/services/admin.service'

const reports = ref([])
const loading = ref(true)
const errorMessage = ref('')
const pagination = ref({})
const filters = reactive({
  status: 'pending',
  content_type: ''
})

onMounted(() => fetchReports())

async function fetchReports() {
  loading.value = true
  errorMessage.value = ''
  try {
    const params = { ...filters }
    if (pagination.value.page) params.page = pagination.value.page

    const result = await adminService.getReports(params)
    reports.value = result.data || []
    pagination.value = result.pagination || {}
  } catch (err) {
    console.error('Error loading reports:', err)
    errorMessage.value = err.response?.data?.error?.message || 'Error al cargar reportes'
    reports.value = []
  } finally {
    loading.value = false
  }
}

function goPage(page) {
  pagination.value.page = page
  fetchReports()
}

async function resolve(id, action) {
  const notes = prompt(`Nota para el ${action === 'approve' ? 'aprobado' : action === 'edit' ? 'editado' : 'eliminado'}:`)
  try {
    await adminService.resolveReport(id, action, notes || undefined)
    fetchReports()
  } catch (err) {
    console.error('Error resolving report:', err)
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
</script>

<style scoped>
.moderation-view { padding: var(--spacing-lg); }
.page-header { margin-bottom: var(--spacing-xl); }
.page-header h1 { font-size: 20px; margin: 0; }
.loading-state, .empty-state, .error-state { text-align: center; padding: 40px 0; color: var(--color-text-secondary); }
.error-state { color: var(--color-danger); }
.filters-bar { display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-md); }
.filters-bar select { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-small); font-size: 14px; }
.reports-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
.report-card { padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); border-left: 4px solid transparent; }
.report-card.overdue { border-left-color: var(--color-danger); }
.report-header { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); }
.report-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; font-weight: 600; }
.report-badge.listing { background: #e3f2fd; color: #1565c0; }
.report-badge.review { background: #f3e5f5; color: #7b1fa2; }
.overdue-badge { font-size: 10px; padding: 2px 6px; background: var(--color-danger); color: white; border-radius: 4px; font-weight: 600; }
.report-date { font-size: 12px; color: var(--color-text-secondary); margin-left: auto; }
.report-reason { font-size: 14px; margin-bottom: 4px; }
.report-desc { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 4px; }
.report-meta { font-size: 12px; color: var(--color-text-secondary); margin-bottom: var(--spacing-sm); }
.report-content-preview { padding: var(--spacing-sm); background: var(--color-background); border-radius: var(--radius-small); font-size: 13px; margin-bottom: var(--spacing-sm); }
.report-actions { display: flex; gap: var(--spacing-sm); }
.btn-approve, .btn-edit, .btn-delete { padding: 6px 14px; font-size: 12px; border-radius: 4px; }
.btn-approve { background: var(--color-primary); color: white; }
.btn-edit { background: var(--color-warning); color: white; }
.btn-delete { background: var(--color-danger); color: white; }
.resolved-info { font-size: 12px; color: var(--color-text-secondary); font-style: italic; }
.pagination { display: flex; justify-content: center; align-items: center; gap: var(--spacing-md); margin-top: var(--spacing-md); }
.pagination button { padding: 6px 14px; font-size: 13px; background: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-small); }
.pagination button:disabled { opacity: 0.5; }
</style>
