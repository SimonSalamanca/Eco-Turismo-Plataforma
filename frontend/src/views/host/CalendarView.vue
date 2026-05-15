<template>
  <div class="calendar-view">
    <header class="page-header">
      <button class="nav-btn" @click="prevMonth">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <span class="month-title">{{ currentMonth }}</span>
      <button class="nav-btn" @click="nextMonth">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </header>

    <div v-if="loading" class="loading">Cargando...</div>

    <template v-else>
      <div class="listings-selector">
        <button v-for="listing in listings" :key="listing.id" class="listing-tab" :class="{ active: selectedListing === listing.id }" @click="selectListing(listing.id)">
          {{ listing.title }}
        </button>
      </div>

      <div class="calendar-grid">
        <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
        <div v-for="date in calendarDays" :key="date.day + date.month" class="calendar-day" :class="getDayClass(date)" @click="selectDate(date)">
          {{ date.day }}
        </div>
      </div>

      <div class="legend">
        <div class="legend-item"><span class="dot available"></span> Disponible</div>
        <div class="legend-item"><span class="dot occupied"></span> Ocupado</div>
        <div class="legend-item"><span class="dot blocked"></span> Bloqueado</div>
      </div>

      <div class="reservations-summary" v-if="selectedListingData">
        <h3>Reservas de {{ selectedListingData.title }}</h3>
        <div v-if="selectedListingData.reservations.length === 0" class="no-reservations">No hay reservas confirmadas</div>
        <div v-else class="reservations-list">
          <div v-for="res in selectedListingData.reservations" :key="res.id" class="reservation-item">
            <span class="res-dates">{{ formatDateRange(res.checkIn, res.checkOut) }}</span>
            <span class="res-guests">{{ res.guests }} huéspedes</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import listingsService from '@/services/listings.service'

const loading = ref(true)
const listings = ref([])
const availability = ref([])
const selectedListing = ref(null)
const currentDate = ref(new Date())

const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const currentMonth = computed(() => {
  return currentDate.value.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
})

const selectedListingData = computed(() => {
  if (!selectedListing.value) return null
  return availability.value.find(a => a.id === selectedListing.value)
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []

  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({ day: '', class: '' })
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    const dateStr = date.toISOString().split('T')[0]
    days.push({
      day,
      date: dateStr,
      month: month,
      class: getOccupiedClass(dateStr)
    })
  }

  return days
})

async function loadAvailability() {
  try {
    loading.value = true
    const response = await listingsService.getHostCalendarAvailability()
    availability.value = response.data || response

    if (availability.value.length > 0) {
      selectedListing.value = availability.value[0].id
      listings.value = availability.value.map(l => ({ id: l.id, title: l.title }))
    }
  } catch (err) {
    console.error('Error loading availability:', err)
  } finally {
    loading.value = false
  }
}

function selectListing(id) {
  selectedListing.value = id
}

function prevMonth() {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentDate.value = newDate
}

function nextMonth() {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentDate.value = newDate
}

function getOccupiedClass(dateStr) {
  if (!selectedListingData.value) return ''

  const listing = selectedListingData.value

  for (const res of listing.reservations) {
    const checkIn = res.checkIn.split('T')[0]
    const checkOut = res.checkOut.split('T')[0]
    if (dateStr >= checkIn && dateStr < checkOut) {
      return 'occupied'
    }
  }

  if (listing.blockedDates?.includes(dateStr)) {
    return 'blocked'
  }

  return ''
}

function getDayClass(date) {
  return date.class || ''
}

function selectDate(date) {}

function formatDateRange(checkIn, checkOut) {
  if (!checkIn || !checkOut) return ''
  const inDate = new Date(checkIn)
  const outDate = new Date(checkOut)
  const options = { day: 'numeric', month: 'short' }
  return `${inDate.toLocaleDateString('es-CO', options)} - ${outDate.toLocaleDateString('es-CO', options)}`
}

onMounted(loadAvailability)
</script>

<style scoped>
.calendar-view { padding: var(--spacing-lg); }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-lg); }
.nav-btn { background: transparent; padding: var(--spacing-xs); cursor: pointer; }
.month-title { font-size: 18px; font-weight: 500; }
.loading { text-align: center; padding: var(--spacing-xl); color: var(--color-text-secondary); }

.listings-selector { display: flex; gap: var(--spacing-xs); margin-bottom: var(--spacing-lg); overflow-x: auto; flex-wrap: wrap; }
.listing-tab { padding: var(--spacing-sm) var(--spacing-md); background: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-small); font-size: 13px; white-space: nowrap; cursor: pointer; }
.listing-tab.active { background: var(--color-primary); color: var(--color-white); border-color: var(--color-primary); }

.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: var(--spacing-lg); }
.weekday { text-align: center; font-size: 12px; color: var(--color-text-secondary); padding: var(--spacing-sm); }
.calendar-day { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: var(--color-surface); border-radius: var(--radius-small); font-size: 14px; cursor: pointer; }
.calendar-day.occupied { background: var(--color-primary); color: var(--color-white); }
.calendar-day.blocked { background: #E0E0E0; color: var(--color-text-secondary); }

.legend { display: flex; justify-content: center; gap: var(--spacing-lg); margin-bottom: var(--spacing-xl); }
.legend-item { display: flex; align-items: center; gap: var(--spacing-xs); font-size: 12px; }
.dot { width: 12px; height: 12px; border-radius: 50%; }
.dot.available { background: var(--color-surface); border: 1px solid var(--color-border); }
.dot.occupied { background: var(--color-primary); }
.dot.blocked { background: #E0E0E0; }

.reservations-summary { margin-top: var(--spacing-lg); }
.reservations-summary h3 { font-size: 16px; margin-bottom: var(--spacing-md); }
.no-reservations { color: var(--color-text-secondary); font-size: 14px; }
.reservations-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }
.reservation-item { display: flex; justify-content: space-between; padding: var(--spacing-sm); background: var(--color-white); border-radius: var(--radius-small); font-size: 14px; }
.res-dates { font-weight: 500; }
.res-guests { color: var(--color-text-secondary); }
</style>