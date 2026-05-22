<template>
  <div class="users-view">
    <div class="page-header">
      <h1>Gestión de Usuarios</h1>
    </div>

    <div class="filters-bar">
      <input v-model="filters.name" placeholder="Buscar por nombre..." @input="onSearch" />
      <select v-model="filters.role" @change="onSearch">
        <option value="">Todos los roles</option>
        <option value="tourist">Turista</option>
        <option value="host">Anfitrión</option>
        <option value="admin">Admin</option>
      </select>
      <select v-model="filters.status" @change="onSearch">
        <option value="">Todos los estados</option>
        <option value="active">Activo</option>
        <option value="suspended">Suspendido</option>
        <option value="pending_verification">Pendiente</option>
      </select>
    </div>

    <div v-if="loading" class="loading-state">Cargando usuarios...</div>

    <div v-else-if="errorMessage" class="error-state">{{ errorMessage }}</div>

    <template v-else>
      <div v-if="users.length === 0" class="empty-state">No se encontraron usuarios.</div>

      <div v-else class="users-table">
        <div class="table-header">
          <span>Nombre</span>
          <span>Email</span>
          <span>Rol</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>
        <div v-for="user in users" :key="user.id" class="table-row">
          <span class="cell-name">{{ user.full_name }}</span>
          <span class="cell-email">{{ user.email }}</span>
          <span class="cell-role" :class="user.role">{{ user.role }}</span>
          <span class="cell-status" :class="user.status">{{ user.status }}</span>
          <span class="cell-actions">
            <button class="btn-sm" @click="toggleStatus(user)">
              {{ user.status === 'suspended' ? 'Activar' : 'Suspender' }}
            </button>
          </span>
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

const users = ref([])
const loading = ref(true)
const errorMessage = ref('')
const pagination = ref({})
const filters = reactive({
  name: '',
  role: '',
  status: ''
})

let searchTimeout = null

onMounted(() => fetchUsers())

async function fetchUsers() {
  loading.value = true
  errorMessage.value = ''
  try {
    const params = { ...filters }
    if (params.name) params.name = params.name.trim()
    if (pagination.value.page) params.page = pagination.value.page

    const result = await adminService.getUsers(params)
    users.value = result.data || []
    pagination.value = result.pagination || {}
  } catch (err) {
    console.error('Error loading users:', err)
    errorMessage.value = err.response?.data?.error?.message || 'Error al cargar usuarios'
    users.value = []
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    fetchUsers()
  }, 300)
}

function goPage(page) {
  pagination.value.page = page
  fetchUsers()
}

async function toggleStatus(user) {
  const newStatus = user.status === 'suspended' ? 'active' : 'suspended'
  try {
    await adminService.updateUserStatus(user.id, newStatus)
    user.status = newStatus
  } catch (err) {
    console.error('Error updating user status:', err)
  }
}
</script>

<style scoped>
.users-view { padding: var(--spacing-lg); }
.page-header { margin-bottom: var(--spacing-xl); }
.page-header h1 { font-size: 20px; margin: 0; }
.loading-state, .empty-state, .error-state { text-align: center; padding: 40px 0; color: var(--color-text-secondary); }
.error-state { color: var(--color-danger); }
.filters-bar { display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-md); flex-wrap: wrap; }
.filters-bar input, .filters-bar select { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-small); font-size: 14px; }
.filters-bar input { flex: 1; min-width: 200px; }
.users-table { background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); overflow: hidden; }
.table-header, .table-row { display: grid; grid-template-columns: 1fr 1.5fr 100px 120px 120px; gap: var(--spacing-sm); padding: var(--spacing-sm) var(--spacing-md); align-items: center; }
.table-header { background: var(--color-background); font-size: 12px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; }
.table-row { border-top: 1px solid var(--color-border); font-size: 14px; }
.cell-name { font-weight: 500; }
.cell-email { color: var(--color-text-secondary); font-size: 13px; }
.cell-role, .cell-status { font-size: 12px; padding: 2px 8px; border-radius: 4px; text-align: center; text-transform: capitalize; }
.cell-role.tourist { background: #e3f2fd; color: #1565c0; }
.cell-role.host { background: #fff3e0; color: #e65100; }
.cell-role.admin { background: #fce4ec; color: #c62828; }
.cell-status.active { background: #e8f5e9; color: #2e7d32; }
.cell-status.suspended { background: #fbe9e7; color: #c62828; }
.cell-status.pending_verification { background: #fff8e1; color: #f57f17; }
.cell-actions { display: flex; gap: 4px; }
.btn-sm { padding: 4px 10px; font-size: 12px; background: var(--color-primary); color: white; border-radius: 4px; }
.pagination { display: flex; justify-content: center; align-items: center; gap: var(--spacing-md); margin-top: var(--spacing-md); }
.pagination button { padding: 6px 14px; font-size: 13px; background: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-small); }
.pagination button:disabled { opacity: 0.5; }
</style>
