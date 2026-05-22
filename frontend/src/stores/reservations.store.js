import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import reservationsService from '@/services/reservations.service'

export const useReservationsStore = defineStore('reservations', () => {
  const reservations = ref([])
  const currentReservation = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const activeFilter = ref('all')

  const filteredReservations = computed(() => {
    if (activeFilter.value === 'all') return reservations.value
    return reservations.value.filter(r => r.status === activeFilter.value)
  })

  async function fetchTouristReservations(status = 'all') {
    loading.value = true
    error.value = null
    try {
      const response = await reservationsService.getTouristReservations(status)
      reservations.value = Array.isArray(response) ? response : []
      return response
    } catch (err) {
      error.value = err.message
      reservations.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchReservations(filters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await reservationsService.getAll(filters)
      reservations.value = Array.isArray(response) ? response : []
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchReservation(id) {
    loading.value = true
    try {
      const response = await reservationsService.getById(id)
      currentReservation.value = response
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createReservation(reservationData) {
    loading.value = true
    error.value = null
    try {
      const response = await reservationsService.create(reservationData)
      currentReservation.value = response.reservation
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateReservation(id, data) {
    loading.value = true
    try {
      const response = await reservationsService.update(id, data)
      const index = reservations.value.findIndex(r => r.id === id)
      if (index !== -1) {
        reservations.value[index] = response.reservation
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelReservation(id, reason = '') {
    loading.value = true
    try {
      const response = await reservationsService.cancel(id, reason)
      const index = reservations.value.findIndex(r => r.id === id)
      if (index !== -1) {
        reservations.value[index] = response.reservation
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function confirmReservation(id) {
    loading.value = true
    try {
      const response = await reservationsService.confirm(id)
      const index = reservations.value.findIndex(r => r.id === id)
      if (index !== -1) {
        reservations.value[index] = response.reservation
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function rejectReservation(id, reason = '') {
    loading.value = true
    try {
      const response = await reservationsService.reject(id, reason)
      const index = reservations.value.findIndex(r => r.id === id)
      if (index !== -1) {
        reservations.value[index] = response.reservation
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function setFilter(filter) {
    activeFilter.value = filter
  }

  return {
    reservations,
    currentReservation,
    loading,
    error,
    activeFilter,
    filteredReservations,
    fetchTouristReservations,
    fetchReservations,
    fetchReservation,
    createReservation,
    updateReservation,
    cancelReservation,
    confirmReservation,
    rejectReservation,
    setFilter
  }
})