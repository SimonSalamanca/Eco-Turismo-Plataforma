<template>
  <div class="listing-detail-view">
    <div v-if="loading" class="loading">Cargando...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <template v-else-if="listing">
      <header class="detail-header">
        <button class="back-btn" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <h1>Detalles del Alojamiento</h1>
        <div class="header-actions">
          <button v-if="listing.status === 'active'" class="btn-icon warning" @click="toggleStatus('paused')" title="Inactivar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
          </button>
          <button v-else-if="listing.status === 'paused'" class="btn-icon success" @click="toggleStatus('active')" title="Activar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </button>
          <button class="btn-icon" @click="editListing">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-icon danger" @click="deleteListing">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </header>

      <section class="photos-section">
        <div class="main-photo">
          <img v-if="mainPhoto" :src="mainPhoto.url" alt="" />
          <div v-else class="no-photo">Sin fotos</div>
        </div>
        <div class="photo-grid" v-if="listing.photos && listing.photos.length > 1">
          <img v-for="(photo, index) in listing.photos.slice(1, 5)" :key="index" :src="photo.url" alt="" />
        </div>
      </section>

      <section class="info-section">
        <div class="status-row">
          <span class="status-badge" :class="listing.status">{{ getStatusLabel(listing.status) }}</span>
          <span class="listing-id">ID: {{ listing.id }}</span>
        </div>

        <h2>{{ listing.title }}</h2>
        <p class="location">{{ listing.address }}, {{ listing.municipality }}, {{ listing.department }}</p>

        <div class="price-row">
          <span class="price">${{ formatPrice(listing.price_per_unit) }}</span>
          <span class="per-night">/ noche</span>
        </div>
      </section>

      <section class="details-section">
        <h3>Detalles</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">Tipo</span>
            <span class="value">{{ listing.type === 'accommodation' ? 'Alojamiento' : 'Actividad' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Capacidad</span>
            <span class="value">{{ listing.capacity }} huéspedes</span>
          </div>
          <div class="detail-item">
            <span class="label">Calificación</span>
            <span class="value">{{ listing.average_rating > 0 ? listing.average_rating + '/5' : 'Sin reseñas' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Reseñas</span>
            <span class="value">{{ listing.review_count || 0 }}</span>
          </div>
        </div>
      </section>

      <section class="description-section">
        <h3>Descripción</h3>
        <p>{{ listing.description || 'Sin descripción' }}</p>
      </section>

      <section class="categories-section" v-if="listing.categories && listing.categories.length > 0">
        <h3>Comodidades</h3>
        <div class="categories-list">
          <span v-for="cat in listing.categories" :key="cat" class="category-tag">{{ cat }}</span>
        </div>
      </section>

      <section class="stats-section">
        <h3>Estadísticas</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ stats.totalReservations }}</span>
            <span class="stat-label">Reservas</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats.confirmedReservations }}</span>
            <span class="stat-label">Confirmadas</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${{ formatPrice(stats.totalIncome) }}</span>
            <span class="stat-label">Ingresos</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import listingsService from '@/services/listings.service'
import reservationsService from '@/services/reservations.service'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref(null)
const listing = ref(null)
const stats = ref({ totalReservations: 0, confirmedReservations: 0, totalIncome: 0 })

const mainPhoto = computed(() => {
  if (!listing.value?.photos?.length) return null
  return listing.value.photos.find(p => p.is_cover) || listing.value.photos[0]
})

async function loadListing() {
  try {
    loading.value = true
    const result = await listingsService.getById(route.params.id)
    listing.value = result.data || result
  } catch (err) {
    console.error('Error loading listing:', err)
    error.value = 'Error al cargar el alojamiento'
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const result = await reservationsService.getByListing(route.params.id)
    const reservations = result.data || result

    stats.value.totalReservations = reservations.length
    stats.value.confirmedReservations = reservations.filter(r => r.status === 'confirmed').length
    stats.value.totalIncome = reservations
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.total_amount || 0), 0)
  } catch (err) {
    console.error('Error loading stats:', err)
  }
}

function getStatusLabel(status) {
  const labels = { active: 'Activo', paused: 'Pausado', deleted: 'Eliminado' }
  return labels[status] || status
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO').format(price || 0)
}

function goBack() {
  router.push('/host/listings')
}

function editListing() {
  router.push(`/host/listing/${route.params.id}/edit`)
}

async function deleteListing() {
  if (!confirm('¿Estás seguro de que quieres eliminar este alojamiento?')) return

  try {
    await listingsService.deleteListing(route.params.id)
    router.push('/host/listings')
  } catch (err) {
    console.error('Error deleting listing:', err)
    alert('Error al eliminar el alojamiento')
  }
}

async function toggleStatus(newStatus) {
  const action = newStatus === 'paused' ? 'inactivar' : 'activar'
  if (!confirm(`¿Estás seguro de que quieres ${action} este alojamiento?`)) return

  try {
    await listingsService.update(route.params.id, { status: newStatus })
    listing.value.status = newStatus
  } catch (err) {
    console.error('Error toggling status:', err)
    alert('Error al cambiar el estado del alojamiento')
  }
}

onMounted(() => {
  loadListing()
  loadStats()
})
</script>

<style scoped>
.listing-detail-view { padding: var(--spacing-lg); }
.loading, .error { text-align: center; padding: var(--spacing-xl); }
.error { color: var(--color-danger); }

.detail-header { display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); }
.back-btn { background: none; border: none; padding: var(--spacing-xs); cursor: pointer; }
.detail-header h1 { flex: 1; font-size: 20px; }
.header-actions { display: flex; gap: var(--spacing-sm); }
.btn-icon { padding: var(--spacing-sm); background: var(--color-surface); border: none; border-radius: var(--radius-small); cursor: pointer; }
.btn-icon.danger { color: var(--color-danger); }
.btn-icon.warning { color: var(--color-warning); }
.btn-icon.success { color: var(--color-success); }

.photos-section { margin-bottom: var(--spacing-lg); }
.main-photo { width: 100%; height: 250px; border-radius: var(--radius-medium); overflow: hidden; margin-bottom: var(--spacing-sm); }
.main-photo img { width: 100%; height: 100%; object-fit: cover; }
.no-photo { width: 100%; height: 100%; background: var(--color-surface); display: flex; align-items: center; justify-content: center; color: var(--color-text-secondary); }
.photo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-sm); }
.photo-grid img { width: 100%; height: 80px; object-fit: cover; border-radius: var(--radius-small); }

.info-section { margin-bottom: var(--spacing-lg); }
.status-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm); }
.status-badge { padding: 4px 12px; border-radius: var(--radius-small); font-size: 12px; font-weight: 600; }
.status-badge.active { background: var(--color-success); color: white; }
.status-badge.paused { background: var(--color-warning); color: white; }
.status-badge.deleted { background: var(--color-danger); color: white; }
.listing-id { font-size: 12px; color: var(--color-text-secondary); }
.info-section h2 { font-size: 24px; margin-bottom: var(--spacing-xs); }
.location { color: var(--color-text-secondary); margin-bottom: var(--spacing-md); }
.price-row { display: flex; align-items: baseline; gap: var(--spacing-xs); }
.price { font-size: 24px; font-weight: 600; color: var(--color-primary); }
.per-night { color: var(--color-text-secondary); }

.details-section, .description-section, .categories-section, .stats-section { margin-bottom: var(--spacing-lg); }
.details-section h3, .description-section h3, .categories-section h3, .stats-section h3 { font-size: 16px; margin-bottom: var(--spacing-md); color: var(--color-text-secondary); }

.detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
.detail-item { padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); }
.detail-item .label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 4px; }
.detail-item .value { font-size: 16px; font-weight: 500; }

.description-section p { color: var(--color-text-primary); line-height: 1.6; }

.categories-list { display: flex; flex-wrap: wrap; gap: var(--spacing-sm); }
.category-tag { padding: 4px 12px; background: var(--color-surface); border-radius: var(--radius-small); font-size: 14px; }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); }
.stat-card { padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); text-align: center; }
.stat-card .stat-value { display: block; font-size: 20px; font-weight: 600; color: var(--color-primary); }
.stat-card .stat-label { font-size: 12px; color: var(--color-text-secondary); }
</style>