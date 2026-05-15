<template>
  <div class="reservation-detail-view">
    <div v-if="loading" class="loading">Cargando...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <template v-else-if="reservation">
      <header class="detail-header">
        <button class="back-btn" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <h1>Detalle de Reserva</h1>
      </header>

      <section class="status-section">
        <div class="status-badge" :class="reservation.status">
          {{ getStatusLabel(reservation.status) }}
        </div>
        <span class="confirmation-code">Código: {{ reservation.confirmation_code }}</span>
      </section>

      <section class="guest-section">
        <h3>Huésped</h3>
        <div class="guest-card">
          <div class="guest-avatar">{{ getInitials(reservation.tourist) }}</div>
          <div class="guest-info">
            <h4>{{ reservation.tourist?.full_name || 'Huésped' }}</h4>
            <p>{{ reservation.tourist?.email }}</p>
            <p v-if="reservation.tourist?.phone">{{ reservation.tourist.phone }}</p>
          </div>
        </div>
      </section>

      <section class="listing-section">
        <h3>Propiedad</h3>
        <div class="listing-card">
          <img v-if="reservation.listing?.photos?.length" :src="reservation.listing.photos[0].url" alt="" />
          <div class="listing-placeholder" v-else></div>
          <div class="listing-info">
            <h4>{{ reservation.listing?.title || 'Listing' }}</h4>
            <p>{{ reservation.listing?.address }}</p>
          </div>
        </div>
      </section>

      <section class="dates-section">
        <h3>Fechas</h3>
        <div class="dates-grid">
          <div class="date-item">
            <span class="label">Check-in</span>
            <span class="value">{{ formatDate(reservation.check_in_date) }}</span>
          </div>
          <div class="date-item">
            <span class="label">Check-out</span>
            <span class="value">{{ formatDate(reservation.check_out_date) }}</span>
          </div>
          <div class="date-item">
            <span class="label">Huéspedes</span>
            <span class="value">{{ reservation.guests_count }}</span>
          </div>
          <div class="date-item">
            <span class="label">Noches</span>
            <span class="value">{{ nights }}</span>
          </div>
        </div>
      </section>

      <section class="payment-section">
        <h3>Pago</h3>
        <div class="payment-details">
          <div class="payment-row">
            <span>Subtotal</span>
            <span>${{ formatPrice(reservation.subtotal) }}</span>
          </div>
          <div class="payment-row">
            <span>Comisión plataforma</span>
            <span>${{ formatPrice(reservation.platform_fee) }}</span>
          </div>
          <div class="payment-row total">
            <span>Total</span>
            <span>${{ formatPrice(reservation.total_amount) }}</span>
          </div>
        </div>
      </section>

      <section class="actions-section" v-if="reservation.status === 'pending'">
        <button class="btn-accept" @click="accept">Confirmar Reserva</button>
        <button class="btn-reject" @click="reject">Rechazar Reserva</button>
      </section>

      <section class="actions-section" v-if="reservation.status === 'confirmed'">
        <button class="btn-cancel" @click="cancel">Cancelar Reserva</button>
      </section>

      <div v-if="cancelledReason" class="cancellation-info">
        <h4>Motivo de cancelación:</h4>
        <p>{{ cancelledReason }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import reservationsService from '@/services/reservations.service'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref(null)
const reservation = ref(null)

const nights = computed(() => {
  if (!reservation.value?.check_in_date || !reservation.value?.check_out_date) return 0
  const checkIn = new Date(reservation.value.check_in_date)
  const checkOut = new Date(reservation.value.check_out_date)
  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
})

const cancelledReason = computed(() => {
  if (reservation.value?.status === 'cancelled') {
    return reservation.value.cancellation_reason || 'Cancelada sin motivo especificado'
  }
  return null
})

async function loadReservation() {
  try {
    loading.value = true
    const response = await reservationsService.getById(route.params.id)
    reservation.value = response.data || response
  } catch (err) {
    console.error('Error loading reservation:', err)
    error.value = 'Error al cargar la reserva'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/host/reservations')
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

function getInitials(tourist) {
  if (!tourist?.full_name) return 'H'
  return tourist.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
}

function formatDate(date) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO').format(price || 0)
}

async function accept() {
  try {
    await reservationsService.confirmReservation(reservation.value.id)
    await loadReservation()
  } catch (err) {
    console.error('Error accepting:', err)
    alert('Error al confirmar la reserva')
  }
}

async function reject() {
  const reason = prompt('Motivo del rechazo (opcional):')
  try {
    await reservationsService.rejectReservation(reservation.value.id, reason)
    await loadReservation()
  } catch (err) {
    console.error('Error rejecting:', err)
    alert('Error al rechazar la reserva')
  }
}

async function cancel() {
  const reason = prompt('Motivo de cancelación:')
  if (!reason) return
  try {
    await reservationsService.cancel(reservation.value.id, reason)
    await loadReservation()
  } catch (err) {
    console.error('Error cancelling:', err)
    alert('Error al cancelar la reserva')
  }
}

onMounted(loadReservation)
</script>

<style scoped>
.reservation-detail-view { padding: var(--spacing-lg); }
.loading, .error { text-align: center; padding: var(--spacing-xl); color: var(--color-text-secondary); }
.error { color: var(--color-danger); }

.detail-header { display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); }
.back-btn { background: none; border: none; padding: var(--spacing-xs); cursor: pointer; }
.detail-header h1 { font-size: 20px; }

.status-section { display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); }
.status-badge { padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius-small); font-weight: 600; }
.status-badge.pending { background: var(--color-warning); color: var(--color-white); }
.status-badge.confirmed { background: var(--color-success); color: var(--color-white); }
.status-badge.completed { background: var(--color-primary); color: var(--color-white); }
.status-badge.cancelled { background: var(--color-danger); color: var(--color-white); }
.confirmation-code { color: var(--color-text-secondary); font-size: 14px; }

section { margin-bottom: var(--spacing-lg); }
section h3 { font-size: 16px; margin-bottom: var(--spacing-md); color: var(--color-text-secondary); }

.guest-card { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); }
.guest-avatar { width: 50px; height: 50px; border-radius: 50%; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; color: var(--color-white); font-weight: 600; font-size: 18px; }
.guest-info h4 { font-size: 16px; margin-bottom: 4px; }
.guest-info p { font-size: 14px; color: var(--color-text-secondary); }

.listing-card { display: flex; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); }
.listing-card img { width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius-small); }
.listing-placeholder { width: 80px; height: 80px; background: var(--color-surface); border-radius: var(--radius-small); }
.listing-info h4 { font-size: 16px; margin-bottom: 4px; }
.listing-info p { font-size: 14px; color: var(--color-text-secondary); }

.dates-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
.date-item { padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); }
.date-item .label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 4px; }
.date-item .value { font-size: 16px; font-weight: 600; }

.payment-details { padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); }
.payment-row { display: flex; justify-content: space-between; padding: var(--spacing-sm) 0; font-size: 14px; }
.payment-row.total { border-top: 1px solid var(--color-border); margin-top: var(--spacing-sm); padding-top: var(--spacing-md); font-weight: 600; font-size: 16px; }

.actions-section { display: flex; gap: var(--spacing-md); margin-top: var(--spacing-lg); }
.btn-accept { flex: 1; padding: var(--spacing-md); background: var(--color-success); color: var(--color-white); border: none; border-radius: var(--radius-small); font-size: 16px; cursor: pointer; }
.btn-reject { flex: 1; padding: var(--spacing-md); background: var(--color-danger); color: var(--color-white); border: none; border-radius: var(--radius-small); font-size: 16px; cursor: pointer; }
.btn-cancel { flex: 1; padding: var(--spacing-md); background: transparent; border: 1px solid var(--color-danger); color: var(--color-danger); border-radius: var(--radius-small); font-size: 16px; cursor: pointer; }

.cancellation-info { margin-top: var(--spacing-lg); padding: var(--spacing-md); background: #fff3cd; border-radius: var(--radius-small); }
.cancellation-info h4 { font-size: 14px; color: #856404; margin-bottom: var(--spacing-xs); }
.cancellation-info p { font-size: 14px; color: #856404; }
</style>