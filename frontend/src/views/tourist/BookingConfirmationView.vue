<template>
  <div class="confirmation-view">
    <div v-if="loading" class="loading-state">
      <span>Cargando...</span>
    </div>

    <template v-else-if="reservation">
      <div class="success-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <h1>¡Reserva Creada!</h1>
      <p class="subtitle">{{ statusMessage }}</p>

      <div class="confirmation-card">
        <div class="conf-row">
          <span>Número de confirmación</span>
          <strong>{{ reservation.confirmation_code }}</strong>
        </div>
        <div class="conf-row">
          <span>Alojamiento</span>
          <strong>{{ reservation.listing?.title || 'Alojamiento' }}</strong>
        </div>
        <div class="conf-row">
          <span>Fechas</span>
          <strong>{{ formatDateRange(reservation.check_in_date, reservation.check_out_date) }}</strong>
        </div>
        <div class="conf-row">
          <span>Estado</span>
          <strong :class="'status-' + reservation.status">{{ statusLabel }}</strong>
        </div>
        <div class="conf-row">
          <span>Total</span>
          <strong class="total">${{ formatPrice(reservation.total_amount) }}</strong>
        </div>
      </div>

      <div class="actions">
        <router-link to="/tourist/bookings" class="btn btn-primary">Ver mis Reservas</router-link>
        <router-link to="/tourist/home" class="btn btn-outline">Volver al Inicio</router-link>
      </div>
    </template>

    <div v-else class="empty-state">
      <p>Reserva no encontrada</p>
      <router-link to="/tourist/home" class="btn btn-primary">Volver al Inicio</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import reservationsService from '@/services/reservations.service'

const route = useRoute()

const loading = ref(true)
const reservation = ref(null)

const statusMessage = computed(() => {
  if (!reservation.value) return ''
  switch (reservation.value.status) {
    case 'pending': return 'Tu reserva está pendiente de confirmación'
    case 'confirmed': return 'Tu reserva ha sido confirmada'
    case 'cancelled': return 'Tu reserva fue cancelada'
    default: return 'Tu reserva ha sido creada'
  }
})

const statusLabel = computed(() => {
  if (!reservation.value) return ''
  const labels = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada'
  }
  return labels[reservation.value.status] || reservation.value.status
})

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO').format(price || 0)
}

function formatDateRange(start, end) {
  if (!start || !end) return ''
  const startDate = new Date(start)
  const endDate = new Date(end)
  const options = { day: 'numeric', month: 'short', year: 'numeric' }
  return `${startDate.toLocaleDateString('es-CO', options)} - ${endDate.toLocaleDateString('es-CO', options)}`
}

onMounted(async () => {
  try {
    const id = route.params.id
    const response = await reservationsService.getById(id)
    reservation.value = response.data || response
  } catch (err) {
    console.error('Error loading reservation:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.confirmation-view { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--spacing-xl); background: var(--color-background); }
.loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-md); color: var(--color-text-secondary); }
.success-icon { width: 80px; height: 80px; border-radius: 50%; background: var(--color-success); display: flex; align-items: center; justify-content: center; color: var(--color-white); margin-bottom: var(--spacing-xl); }
.success-icon svg { width: 40px; height: 40px; }
h1 { font-size: 24px; margin-bottom: var(--spacing-sm); }
.subtitle { color: var(--color-text-secondary); margin-bottom: var(--spacing-xl); text-align: center; }
.confirmation-card { width: 100%; max-width: 320px; padding: var(--spacing-lg); background: var(--color-surface); border-radius: var(--radius-small); margin-bottom: var(--spacing-xl); }
.conf-row { display: flex; justify-content: space-between; padding: var(--spacing-sm) 0; font-size: 14px; }
.conf-row span { color: var(--color-text-secondary); }
.conf-row .total { color: var(--color-primary); font-size: 18px; }
.status-pending { color: var(--color-warning); }
.status-confirmed { color: var(--color-success); }
.status-cancelled { color: var(--color-danger); }
.actions { width: 100%; max-width: 320px; display: flex; flex-direction: column; gap: var(--spacing-md); }
.btn-primary { display: block; background: var(--color-primary); color: var(--color-white); padding: var(--spacing-md); border-radius: var(--radius-small); text-align: center; text-decoration: none; }
.btn-outline { display: block; background: transparent; border: 1.7px solid var(--color-primary); color: var(--color-primary); padding: var(--spacing-md); border-radius: var(--radius-small); text-align: center; text-decoration: none; }
</style>