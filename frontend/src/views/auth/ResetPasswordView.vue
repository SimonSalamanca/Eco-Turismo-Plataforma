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

      <template v-if="token">
        <h2 class="title">Nueva Contraseña</h2>
        <p class="subtitle">Ingresa tu nueva contraseña</p>

        <form @submit.prevent="handleResetPassword" class="form">
          <div v-if="successMessage" class="success-alert">
            {{ successMessage }}
          </div>

          <div class="input-wrapper">
            <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input v-model="newPassword" type="password" class="input-field" placeholder="Nueva contraseña" required />
          </div>

          <div class="input-wrapper">
            <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input v-model="confirmPassword" type="password" class="input-field" placeholder="Confirmar contraseña" required />
          </div>

          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Cambiar contraseña' }}
          </button>

          <router-link to="/login" class="back-link">Volver al inicio de sesión</router-link>
        </form>
      </template>

      <template v-else>
        <h2 class="title">Recuperar Contraseña</h2>
        <p class="subtitle">Ingresa tu correo para recibir instrucciones</p>

        <form @submit.prevent="handleSubmit" class="form">
          <div v-if="successMessage" class="success-alert">
            {{ successMessage }}
          </div>

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
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const token = route.params.token

const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const successMessage = ref('')

async function handleSubmit() {
  loading.value = true
  successMessage.value = ''
  try {
    await authStore.forgotPassword(email.value)
    successMessage.value = 'Se han enviado instrucciones a tu correo electrónico'
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (error) {
    console.error('Failed:', error)
    alert('Error al enviar las instrucciones. Verifica tu correo.')
  } finally {
    loading.value = false
  }
}

async function handleResetPassword() {
  if (newPassword.value !== confirmPassword.value) {
    alert('Las contraseñas no coinciden')
    return
  }
  
  loading.value = true
  successMessage.value = ''
  try {
    await authStore.resetPassword(token, newPassword.value)
    successMessage.value = 'Contraseña actualizada correctamente'
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (error) {
    console.error('Failed:', error)
    alert('Error al cambiar la contraseña. El enlace puede haber expirado.')
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

.success-alert {
  background: #d1fae5;
  border: 1px solid #10b981;
  color: #065f46;
  padding: var(--spacing-md);
  border-radius: var(--radius-small);
  font-size: 14px;
  text-align: center;
}
</style>