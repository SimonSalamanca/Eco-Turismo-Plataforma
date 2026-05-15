<template>
  <div class="forgot-view">
    <header class="secondary-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
    </header>

    <div class="content">
      <div class="icon-container">
        <div class="icon-circle">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
      </div>

      <h2 class="title">Recuperar Contraseña</h2>
      <p class="subtitle">Ingresa tu correo para recibir instrucciones</p>

      <form @submit.prevent="handleSubmit" class="form">
        <div class="input-wrapper">
          <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <input v-model="email" type="email" class="input-field" placeholder="Tu correo electrónico" required />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Enviando...' : 'Enviar instrucciones' }}
        </button>

        <router-link to="/login" class="back-link">Volver al inicio de sesión</router-link>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  try {
    await authStore.forgotPassword(email.value)
    router.push('/verify-2fa')
  } catch (error) {
    console.error('Failed:', error)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/login')
}
</script>

<style scoped>
.forgot-view {
  min-height: 100vh;
  background: var(--color-background);
}

.secondary-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-lg);
  border-bottom: 1.7px solid var(--color-border);
  background: var(--color-white);
}

.back-button {
  background: transparent;
  padding: var(--spacing-xs);
  color: var(--color-text-primary);
  display: flex;
}

.content {
  padding: var(--spacing-xxl) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-container {
  margin-bottom: var(--spacing-xl);
}

.icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
}

.title {
  font-size: 20px;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.subtitle {
  color: var(--color-text-secondary);
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.form {
  width: 100%;
  max-width: 366px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.input-wrapper {
  position: relative;
}

.input-wrapper .icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
}

.input-wrapper input {
  padding-left: 44px;
  width: 100%;
}

.btn-primary {
  margin-top: var(--spacing-sm);
}

.back-link {
  display: block;
  text-align: center;
  color: var(--color-primary);
  font-size: 14px;
  margin-top: var(--spacing-lg);
}
</style>