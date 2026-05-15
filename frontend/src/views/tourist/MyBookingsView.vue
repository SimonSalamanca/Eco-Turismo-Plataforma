<template>
  <div class="bookings-view">
    <div class="tabs">
      <button v-for="tab in tabs" :key="tab.value" class="tab-pill" :class="{ active: activeTab === tab.value }" @click="changeTab(tab.value)">
        {{ tab.label }}
      </button>
    </div>

    <div v-if="reservationsStore.loading && bookings.length === 0" class="loading-state">
      <span>Cargando reservas...</span>
    </div>

    <div v-else-if="bookings.length === 0" class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <p>No hay reservas</p>
      <span v-if="activeTab !== 'all'">No tienes reservas {{ getStatusLabel(activeTab).toLowerCase() }}</span>
      <span v-else>Aún no has realizado ninguna reserva</span>
    </div>

    <div v-else class="bookings-list">
      <div v-for="booking in bookings" :key="booking.id" class="booking-card" @click="goToDetail(booking.id)">
        <img :src="getListingImage(booking)" alt="" class="booking-image" />
        <div class="booking-info">
          <h3>{{ booking.listing?.title || 'Alojamiento' }}</h3>
          <p>{{ booking.listing?.address || 'Ubicación no disponible' }}</p>
          <div class="dates">
            <span>{{ formatDate(booking.check_in_date) }}</span>
            <span> - </span>
            <span>{{ formatDate(booking.check_out_date) }}</span>
          </div>
          <span class="badge" :class="booking.status">{{ getStatusLabel(booking.status) }}</span>
        </div>
        <div class="booking-price">
          <span>${{ formatPrice(booking.total_amount) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useReservationsStore } from '@/stores/reservations.store'

const router = useRouter()
const reservationsStore = useReservationsStore()

const activeTab = ref('all')
const tabs = [
  { label: 'Todas', value: 'all' },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Confirmadas', value: 'confirmed' },
  { label: 'Completadas', value: 'completed' },
  { label: 'Canceladas', value: 'cancelled' }
]

const bookings = computed(() => reservationsStore.reservations)

function getStatusLabel(status) {
  const labels = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada'
  }
  return labels[status] || status
}

function getListingImage(booking) {
  const photos = booking.listing?.photos
  if (photos && photos.length > 0) {
    return photos[0].url || photos[0]
  }
  return 'https://via.placeholder.com/200x200?text=Sin+imagen'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO').format(price)
}

async function changeTab(tab) {
  activeTab.value = tab
  await reservationsStore.fetchTouristReservations(tab)
}

function goToDetail(id) {
  router.push(`/booking/confirmation/${id}`)
}

onMounted(async () => {
  await reservationsStore.fetchTouristReservations(activeTab.value)
})
</script>

<style scoped>
.bookings-view { padding: var(--spacing-lg); }
.tabs { display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-xl); overflow-x: auto; }
.tab-pill { padding: var(--spacing-sm) var(--spacing-md); background: var(--color-white); border: 1.7px solid var(--color-border); border-radius: var(--radius-medium); font-size: 14px; white-space: nowrap; }
.tab-pill.active { background: var(--color-primary); color: var(--color-white); border-color: var(--color-primary); }
.bookings-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
.booking-card { display: flex; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); cursor: pointer; }
.booking-card:active { transform: scale(0.98); }
.booking-image { width: 100px; height: 100px; object-fit: cover; border-radius: var(--radius-small); }
.booking-info { flex: 1; min-width: 0; }
.booking-info h3 { font-size: 16px; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.booking-info p { font-size: 14px; color: var(--color-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dates { font-size: 14px; color: var(--color-text-secondary); margin: var(--spacing-xs) 0; }
.badge { display: inline-block; padding: 2px 8px; font-size: 12px; border-radius: 4px; }
.badge.confirmed, .badge.completed { background: var(--color-success); color: var(--color-white); }
.badge.pending { background: var(--color-warning); color: var(--color-white); }
.badge.cancelled { background: var(--color-danger); color: var(--color-white); }
.booking-price { display: flex; align-items: flex-start; font-weight: 600; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: var(--spacing-xxl); color: var(--color-text-secondary); text-align: center; }
.empty-state svg { margin-bottom: var(--spacing-lg); opacity: 0.5; }
.empty-state p { font-size: 18px; color: var(--color-text-primary); margin-bottom: var(--spacing-xs); }
.empty-state span { font-size: 14px; }
.loading-state { display: flex; justify-content: center; padding: var(--spacing-xl); color: var(--color-text-secondary); }
</style>