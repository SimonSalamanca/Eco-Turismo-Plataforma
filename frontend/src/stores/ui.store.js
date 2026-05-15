import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(false)
  const modalOpen = ref(false)
  const modalComponent = ref(null)
  const modalProps = ref({})
  const toasts = ref([])
  const loading = ref(false)
  const loadingMessage = ref('')
  const theme = ref('light')

  function openModal(component, props = {}) {
    modalComponent.value = component
    modalProps.value = props
    modalOpen.value = true
  }

  function closeModal() {
    modalOpen.value = false
    modalComponent.value = null
    modalProps.value = {}
  }

  function showToast(message, type = 'info', duration = 3000) {
    const id = Date.now()
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  function removeToast(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function setLoading(state, message = '') {
    loading.value = state
    loadingMessage.value = message
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function setTheme(newTheme) {
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return {
    sidebarOpen,
    modalOpen,
    modalComponent,
    modalProps,
    toasts,
    loading,
    loadingMessage,
    theme,
    openModal,
    closeModal,
    showToast,
    removeToast,
    setLoading,
    toggleSidebar,
    setTheme
  }
})