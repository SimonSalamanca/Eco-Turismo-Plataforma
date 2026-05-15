<template>
  <div class="reservations-view">
    <div class="tabs">
      <button v-for="tab in tabs" :key="tab.value" class="tab-pill" :class="{ active: activeTab === tab.value }" @click="changeTab(tab.value)">
        {{ tab.label }}
        <span class="count" v-if="tab.count > 0">{{ tab.count }}</span>
      </button>
    </div>

    <div v-if="loading" class="loading">Cargando...</div>
    <div v-else-if="reservations.length === 0" class="empty">No hay reservas {{ activeTab === 'pending' ? 'pendientes' : activeTab }}</div>

    <div v-else class="reservations-list">
      <div v-for="res in reservations" :key="res.id" class="reservation-card" @click="goToDetail(res.id)">
        <div class="res-avatar">{{ getInitials(res.tourist) }}</div>
        <div class="res-content">
          <h4>{{ res.tourist?.full_name || 'Huésped' }}</h4>
          <p>{{ res.listing?.title || 'Listing' }}</p>
          <span>{{ formatDates(res.check_in_date, res.check_out_date) }} · {{ res.guests_count }} huéspedes</span>
        </div>
        <div class="res-price">${{ formatPrice(res.total_amount) }}</div>
        <div class="res-status" :class="res.status">
          {{ getStatusLabel(res.status) }}
        </div>
        <div class="res-actions" v-if="res.status === 'pending'" @click.stop>
          <button class="btn-accept" @click="accept(res.id)">Aceptar</button>
          <button class="btn-reject" @click="reject(res.id)">Rechazar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import reservationsService from '@/services/reservations.service'

const router = useRouter()

const activeTab = ref('pending')
const loading = ref(false)
const reservations = ref([])

const tabs = computed(() => [
  { label: 'Pendientes', value: 'pending', count: pendingCount.value },
  { label: 'Confirmadas', value: 'confirmed', count: confirmedCount.value },
  { label: 'Completadas', value: 'completed', count: completedCount.value },
  { label: 'Canceladas', value: 'cancelled', count: cancelledCount.value }
])

const pendingCount = ref(0)
const confirmedCount = ref(0)
const completedCount = ref(0)
const cancelledCount = ref(0)

async function loadReservations() {
  try {
    loading.value = true
    const response = await reservationsService.getHostReservations()
    const allReservations = response.data || response

    pendingCount.value = allReservations.filter(r => r.status === 'pending').length
    confirmedCount.value = allReservations.filter(r => r.status === 'confirmed').length
    completedCount.value = allReservations.filter(r => r.status === 'completed').length
    cancelledCount.value = allReservations.filter(r => r.status === 'cancelled').length

    reservations.value = allReservations.filter(r => r.status === activeTab.value)
  } catch (err) {
    console.error('Error loading reservations:', err)
  } finally {
    loading.value = false
  }
}

function changeTab(tab) {
  activeTab.value = tab
  loadReservations()
}

function getInitials(tourist) {
  if (!tourist?.full_name) return 'H'
  return tourist.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
}

function formatDates(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 'Fechas no disponibles'
  const inDate = new Date(checkIn)
  const outDate = new Date(checkOut)
  const options = { day: 'numeric', month: 'short' }
  return `${inDate.toLocaleDateString('es-CO', options)} - ${outDate.toLocaleDateString('es-CO', options)}`
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO').format(price || 0)
}

function getStatusLabel(status) {
  const labels = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada'
  }
  return labels[status] || status
}

function goToDetail(id) {
  router.push(`/host/reservation/${id}`)
}

async function accept(id) {
  try {
    await reservationsService.confirmReservation(id)
    await loadReservations()
  } catch (err) {
    console.error('Error accepting reservation:', err)
    alert('Error al aceptar la reserva')
  }
}

async function reject(id) {
  try {
    await reservationsService.rejectReservation(id)
    await loadReservations()
  } catch (err) {
    console.error('Error rejecting reservation:', err)
    alert('Error al rechazar la reserva')
  }
}

onMounted(loadReservations)
</script>

<style scoped>
.reservations-view { padding: var(--spacing-lg); }
.tabs { display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-xl); overflow-x: auto; }
.tab-pill { padding: var(--spacing-sm) var(--spacing-md); background: var(--color-white); border: 1.7px solid var(--color-border); border-radius: var(--radius-medium); font-size: 14px; white-space: nowrap; display: flex; align-items: center; gap: 4px; }
.tab-pill.active { background: var(--color-primary); color: var(--color-white); border-color: var(--color-primary); }
.count { font-size: 11px; background: var(--color-surface); padding: 2px 6px; border-radius: 10px; }
.tab-pill.active .count { background: rgba(255,255,255,0.2); }
.loading, .empty { text-align: center; padding: var(--spacing-xl); color: var(--color-text-secondary); }
.reservations-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
.reservation-card { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); cursor: pointer; }
.res-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; color: var(--color-white); font-weight: 600; flex-shrink: 0; }
.res-content { flex: 1; min-width: 0; }
.res-content h4 { font-size: 14px; margin-bottom: 2px; }
.res-content p { font-size: 12px; color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.res-content span { font-size: 12px; color: var(--color-text-secondary); }
.res-price { font-weight: 600; white-space: nowrap; }
.res-status { padding: 4px 8px; font-size: 11px; border-radius: 4px; white-space: nowrap; }
.res-status.pending { background: var(--color-warning); color: var(--color-white); }
.res-status.confirmed { background: var(--color-success); color: var(--color-white); }
.res-status.completed { background: var(--color-primary); color: var(--color-white); }
.res-status.cancelled { background: var(--color-danger); color: var(--color-white); }
.res-actions { display: flex; gap: var(--spacing-xs); flex-shrink: 0; }
.btn-accept { padding: 4px 12px; background: var(--color-primary); color: var(--color-white); border-radius: 4px; font-size: 12px; border: none; cursor: pointer; }
.btn-reject { padding: 4px 12px; background: transparent; border: 1px solid var(--color-danger); color: var(--color-danger); border-radius: 4px; font-size: 12px; cursor: pointer; }
</style>