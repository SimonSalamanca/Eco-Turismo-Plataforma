<template>
  <div class="listing-form-view">
    <header class="secondary-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <span class="header-title">{{ isEditing ? 'Editar' : 'Nueva' }} Publicación</span>
      <div></div>
    </header>

    <div class="steps">
      <span :class="{ active: step >= 1 }">1</span>
      <span :class="{ active: step >= 2 }">2</span>
      <span :class="{ active: step >= 3 }">3</span>
      <span :class="{ active: step >= 4 }">4</span>
    </div>

    <div class="content" v-if="step === 1">
      <div class="form-section">
        <h2>Fotos del alojamiento</h2>
        <p class="section-description">Añade fotos atractivas de tu propiedad. La primera será la imagen de portada.</p>
        <div class="photo-grid">
          <div v-for="(photo, index) in photos" :key="index" class="photo-item">
            <img :src="photo.preview || photo.url" alt="" />
            <button class="delete-photo" @click="removePhoto(index)" v-if="!photo.isExisting">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <label class="photo-placeholder" v-if="photos.length < 10">
            <input type="file" accept="image/*" multiple @change="handlePhotoUpload" hidden />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span>Agregar foto</span>
          </label>
        </div>
        <p class="photo-hint">Máximo 10 fotos. Formatos: JPG, PNG, WebP</p>
      </div>
      <button class="btn btn-primary" @click="step = 2" :disabled="photos.length === 0">Continuar</button>
    </div>

    <div class="content" v-if="step === 2">
      <div class="form-section">
        <h2>Información básica</h2>
        <div class="input-wrapper">
          <input v-model="form.title" type="text" class="input-field" placeholder="Nombre de la propiedad" />
        </div>
        <div class="input-wrapper">
          <select v-model="form.type" class="input-field">
            <option value="">Selecciona el tipo</option>
            <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="input-wrapper">
          <textarea v-model="form.description" class="input-field" placeholder="Descripción" rows="4"></textarea>
        </div>
        <div class="input-wrapper">
          <input v-model="form.price_per_unit" type="number" class="input-field" placeholder="Precio por noche" />
        </div>
        <div class="input-wrapper">
          <input v-model="form.capacity" type="number" class="input-field" placeholder="Capacidad (número de huéspedes)" />
        </div>
      </div>
      <button class="btn btn-primary" @click="step = 3" :disabled="!isStep2Valid">Continuar</button>
    </div>

    <div class="content" v-if="step === 3">
      <div class="form-section">
        <h2>Ubicación</h2>
        <div class="input-wrapper">
          <input v-model="form.address" type="text" class="input-field" placeholder="Dirección" />
        </div>
        <div class="input-wrapper">
          <input v-model="form.department" type="text" class="input-field" placeholder="Departamento" />
        </div>
        <div class="input-wrapper">
          <input v-model="form.municipality" type="text" class="input-field" placeholder="Municipio" />
        </div>
      </div>
      <button class="btn btn-primary" @click="step = 4">Continuar</button>
    </div>

    <div class="content" v-if="step === 4">
      <div class="form-section">
        <h2>Categorías</h2>
        <div class="amenities-grid">
          <label v-for="amenity in amenities" :key="amenity" class="amenity-checkbox">
            <input type="checkbox" v-model="form.categories" :value="amenity" />
            <span>{{ amenity }}</span>
          </label>
        </div>
      </div>
      <button class="btn btn-primary" @click="saveListing" :disabled="loading || savingPhotos">
        {{ loading || savingPhotos ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Publicar') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import listingsService from '@/services/listings.service'

const route = useRoute()
const router = useRouter()

const step = ref(1)
const isEditing = computed(() => !!route.params.id)
const loading = ref(false)
const savingPhotos = ref(false)
const photos = ref([])

const form = reactive({
  title: '',
  type: 'accommodation',
  description: '',
  price_per_unit: '',
  capacity: 1,
  address: '',
  department: '',
  municipality: '',
  latitude: 0,
  longitude: 0,
  categories: []
})

const typeOptions = [
  { value: 'accommodation', label: 'Alojamiento' },
  { value: 'activity', label: 'Actividad' }
]

const amenities = ['WiFi', 'Piscina', 'Estacionamiento', 'Cocina', 'Aire acondicionado', 'Terraza', 'Mascotas', 'Desayuno']

const MAX_PHOTO_SIZE = 10 * 1024 * 1024

const isStep2Valid = computed(() => {
  return form.title && form.type && form.description && form.price_per_unit && form.capacity
})

function goBack() {
  if (step.value > 1) step.value--
  else router.back()
}

function handlePhotoUpload(event) {
  const files = Array.from(event.target.files)
  files.forEach(file => {
    if (photos.value.length >= 10) return

    if (file.size > MAX_PHOTO_SIZE) {
      alert(`La foto "${file.name}" es demasiado grande. El tamaño máximo es 10MB.`)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      photos.value.push({
        file: file,
        preview: e.target.result,
        isExisting: false
      })
    }
    reader.readAsDataURL(file)
  })
  event.target.value = ''
}

function removePhoto(index) {
  photos.value.splice(index, 1)
}

async function saveListing() {
  loading.value = true
  let listingId = route.params.id

  try {
    const listingData = {
      title: form.title,
      type: form.type,
      description: form.description,
      price_per_unit: parseFloat(form.price_per_unit),
      capacity: parseInt(form.capacity),
      address: form.address,
      department: form.department,
      municipality: form.municipality,
      latitude: form.latitude || 4.570868,
      longitude: form.longitude || -74.297333,
      categories: form.categories
    }

    if (isEditing.value) {
      await listingsService.update(route.params.id, listingData)
    } else {
      const result = await listingsService.create(listingData)
      listingId = result.data?.id
    }

    const newPhotos = photos.value.filter(p => !p.isExisting && p.file)

    const oversizedPhotos = newPhotos.filter(p => p.file.size > MAX_PHOTO_SIZE)
    if (oversizedPhotos.length > 0) {
      alert('Una o más fotos superan el tamaño máximo de 10MB. Por favor, reduce el tamaño de las imágenes e intenta nuevamente.')
      loading.value = false
      return
    }

    if (newPhotos.length > 0) {
      savingPhotos.value = true
      try {
        const photoFiles = newPhotos.map(p => p.file)
        await listingsService.uploadPhotos(listingId, photoFiles)
      } catch (photoError) {
        console.error('Error uploading photos:', photoError)
        alert('La publicación se guardó correctamente, pero hubo un error al subir las fotos.')
        router.push('/host/listings')
        return
      }
    }

    router.push('/host/listings')
  } catch (error) {
    console.error('Error saving listing:', error)
    alert('Error al guardar la publicación')
  } finally {
    loading.value = false
    savingPhotos.value = false
  }
}

async function loadExistingListing() {
  if (!route.params.id) return

  try {
    const result = await listingsService.getById(route.params.id)
    const listing = result.data || result

    form.title = listing.title || ''
    form.type = listing.type || 'accommodation'
    form.description = listing.description || ''
    form.price_per_unit = listing.price_per_unit || ''
    form.capacity = listing.capacity || 1
    form.address = listing.address || ''
    form.department = listing.department || ''
    form.municipality = listing.municipality || ''
    form.latitude = listing.latitude || 0
    form.longitude = listing.longitude || 0
    form.categories = listing.categories || []

    if (listing.photos && listing.photos.length > 0) {
      photos.value = listing.photos.map((p, index) => ({
        url: p.url,
        isExisting: true,
        isCover: p.is_cover || index === 0
      }))
    }
  } catch (error) {
    console.error('Error loading listing:', error)
  }
}

onMounted(() => {
  if (isEditing.value) {
    loadExistingListing()
  }
})
</script>

<style scoped>
.listing-form-view { min-height: 100vh; background: var(--color-background); }
.secondary-header { height: var(--header-height); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--spacing-lg); border-bottom: 1.7px solid var(--color-border); background: var(--color-white); }
.back-button { background: transparent; }
.header-title { font-size: 18px; font-weight: 500; }
.steps { display: flex; justify-content: center; gap: var(--spacing-sm); padding: var(--spacing-md); }
.steps span { width: 24px; height: 24px; border-radius: 50%; background: var(--color-border); display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--color-text-secondary); }
.steps span.active { background: var(--color-primary); color: var(--color-white); }
.content { padding: var(--spacing-lg); }
.form-section { margin-bottom: var(--spacing-xl); }
.form-section h2 { font-size: 18px; margin-bottom: var(--spacing-sm); }
.section-description { font-size: 14px; color: var(--color-text-secondary); margin-bottom: var(--spacing-md); }
.input-wrapper { margin-bottom: var(--spacing-md); }
.input-wrapper input, .input-wrapper textarea, .input-wrapper select { width: 100%; padding: var(--spacing-md); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-small); }

.photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); margin-bottom: var(--spacing-sm); }
.photo-item { position: relative; aspect-ratio: 1; border-radius: var(--radius-small); overflow: hidden; }
.photo-item img { width: 100%; height: 100%; object-fit: cover; }
.delete-photo { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); border: none; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; }
.photo-placeholder { aspect-ratio: 1; border: 2px dashed var(--color-border); border-radius: var(--radius-small); display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--color-text-secondary); font-size: 12px; cursor: pointer; }
.photo-placeholder span { margin-top: 4px; }
.photo-hint { font-size: 12px; color: var(--color-text-secondary); }

.amenities-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
.amenity-checkbox { display: flex; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-sm); background: var(--color-surface); border-radius: var(--radius-small); }
.amenity-checkbox input { width: auto; }

.btn { width: 100%; padding: var(--spacing-md); font-size: 16px; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>