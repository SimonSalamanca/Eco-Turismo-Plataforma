<template>
  <div class="manage-listings-view">
    <header class="page-header">
      <h1>Mis Publicaciones</h1>
      <button class="btn btn-primary add-btn" @click="$router.push('/host/listing/create')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Nueva
      </button>
    </header>

    <div class="tabs">
      <button v-for="tab in tabs" :key="tab.value" class="tab-pill" :class="{ active: activeTab === tab.value }" @click="changeTab(tab.value)">
        {{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="loading">Cargando...</div>
    <div v-else-if="filteredListings.length === 0" class="empty">No hay publicaciones {{ activeTab === 'active' ? 'activas' : activeTab === 'inactive' ? 'inactivas' : 'como borrador' }}</div>

    <div v-else class="listings-list">
      <div v-for="listing in filteredListings" :key="listing.id" class="listing-card" @click="viewDetail(listing.id)">
        <img :src="getListingImage(listing)" alt="" />
        <div class="listing-content">
          <h3>{{ listing.title }}</h3>
          <p>{{ listing.address || listing.municipality }}</p>
          <span class="price">${{ formatPrice(listing.price_per_unit) }} / noche</span>
          <div class="rating" v-if="listing.average_rating > 0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>{{ listing.average_rating }}</span>
            <span class="review-count">({{ listing.review_count }} reseñas)</span>
          </div>
        </div>
        <div class="listing-actions" @click.stop>
          <span class="status-badge" :class="listing.status">{{ getStatusLabel(listing.status) }}</span>
          <button class="action-btn" @click="editListing(listing.id)">Editar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import listingsService from '@/services/listings.service'

const router = useRouter()

const loading = ref(true)
const listings = ref([])
const activeTab = ref('active')

const tabs = [
  { label: 'Activas', value: 'active' },
  { label: 'Inactivas', value: 'inactive' },
  { label: 'Borradores', value: 'paused' }
]

const filteredListings = computed(() => {
  if (activeTab.value === 'inactive') {
    return listings.value.filter(l => l.status !== 'active')
  }
  return listings.value.filter(l => l.status === activeTab.value)
})

async function loadListings() {
  try {
    loading.value = true
    const response = await listingsService.getMyListings()
    listings.value = response.data || response
  } catch (err) {
    console.error('Error loading listings:', err)
  } finally {
    loading.value = false
  }
}

function changeTab(tab) {
  activeTab.value = tab
}

function getListingImage(listing) {
  if (listing.photos?.length > 0) {
    return listing.photos[0].url
  }
  return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200'
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO').format(price || 0)
}

function getStatusLabel(status) {
  const labels = {
    active: 'Activa',
    paused: 'Pausada',
    deleted: 'Eliminada'
  }
  return labels[status] || status
}

function editListing(id) {
  window.location.href = `/host/listing/${id}/edit`
}

function viewDetail(id) {
  router.push(`/host/listing/${id}`)
}

onMounted(loadListings)
</script>

<style scoped>
.manage-listings-view { padding: var(--spacing-lg); }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg); }
.page-header h1 { font-size: 20px; }
.add-btn { width: auto; padding: var(--spacing-sm) var(--spacing-md); display: flex; align-items: center; gap: var(--spacing-xs); }
.tabs { display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-xl); overflow-x: auto; }
.tab-pill { padding: var(--spacing-sm) var(--spacing-md); background: var(--color-white); border: 1.7px solid var(--color-border); border-radius: var(--radius-medium); font-size: 14px; white-space: nowrap; }
.tab-pill.active { background: var(--color-primary); color: var(--color-white); border-color: var(--color-primary); }
.loading, .empty { text-align: center; padding: var(--spacing-xl); color: var(--color-text-secondary); }
.listings-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
.listing-card { display: flex; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); }
.listing-card img { width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius-small); flex-shrink: 0; }
.listing-content { flex: 1; min-width: 0; }
.listing-content h3 { font-size: 16px; margin-bottom: 4px; }
.listing-content p { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 4px; }
.listing-content .price { font-size: 14px; font-weight: 600; }
.rating { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: 12px; }
.review-count { color: var(--color-text-secondary); }
.listing-actions { display: flex; flex-direction: column; align-items: flex-end; gap: var(--spacing-sm); }
.status-badge { padding: 4px 8px; font-size: 11px; border-radius: 4px; }
.status-badge.active { background: var(--color-success); color: var(--color-white); }
.status-badge.paused { background: var(--color-warning); color: var(--color-white); }
.status-badge.deleted { background: var(--color-danger); color: var(--color-white); }
.action-btn { padding: 4px 12px; font-size: 12px; border: 1px solid var(--color-primary); color: var(--color-primary); background: transparent; border-radius: 4px; cursor: pointer; }
</style>