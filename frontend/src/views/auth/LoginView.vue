<template>
  <div class="login-view">
    <header class="secondary-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
    </header>

    <div class="login-content">
      <div class="logo-container">
        <div class="logo-circle">
          <span class="logo-icon">🏠</span>
        </div>
      </div>

      <h2 class="title">Bienvenido</h2>
      <p class="subtitle">Ingresa a tu cuenta</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="errorMessage" class="error-alert">
          {{ errorMessage }}
        </div>

        <div class="input-wrapper">
          <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <input
            v-model="form.email"
            type="email"
            class="input-field"
            placeholder="correo@ejemplo.com"
            required
          />
        </div>

        <div class="input-wrapper">
          <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <input
            v-model="form.password"
            type="password"
            class="input-field"
            placeholder="Tu contraseña"
            required
          />
        </div>

        <a href="/forgot-password" class="forgot-link">¿Olvidaste tu contraseña?</a>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Iniciando...' : 'Iniciar Sesión' }}
        </button>

        <div class="divider">o continúa con</div>

        <div class="social-buttons">
          <button type="button" class="btn-social">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button type="button" class="btn-social">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
        </div>

        <p class="register-text">
          ¿No tienes cuenta? <router-link to="/register" class="link">Regístrate</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''
  loading.value = true
  try {
    await authStore.login(form)
    if (authStore.isHost) {
      router.push('/host/dashboard')
    } else if (authStore.isAdmin) {
      router.push('/admin/dashboard')
    } else {
      router.push('/tourist/home')
    }
  } catch (error) {
    console.error('Login failed:', error)
    const errorData = error.response?.data
    if (errorData?.error?.message) {
      errorMessage.value = errorData.error.message
    } else if (errorData?.message) {
      errorMessage.value = errorData.message
    } else {
      errorMessage.value = 'Error al iniciar sesión. Por favor intenta de nuevo.'
    }
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/')
}
</script>

<style scoped>
.login-view {
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

.login-content {
  padding: var(--spacing-xl) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-container {
  margin-bottom: var(--spacing-xl);
}

.logo-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  font-size: 30px;
}

.title {
  font-size: 24px;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.subtitle {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  width: 100%;
  max-width: 400px;
}

.error-alert {
  background: #fee2e2;
  border: 1px solid #ef4444;
  color: #dc2626;
  padding: var(--spacing-md);
  border-radius: var(--radius-small);
  font-size: 14px;
  text-align: center;
}

.input-wrapper {
  margin-bottom: var(--spacing-md);
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

.forgot-link {
  display: block;
  text-align: right;
  font-size: 14px;
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
}

.btn-primary {
  margin-bottom: var(--spacing-lg);
}

.divider {
  display: flex;
  align-items: center;
  margin: var(--spacing-lg) 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.divider::before {
  margin-right: var(--spacing-md);
}

.divider::after {
  margin-left: var(--spacing-md);
}

.social-buttons {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.btn-social {
  flex: 1;
  height: 47px;
  background: var(--color-white);
  border: 1.7px solid var(--color-border);
  border-radius: var(--radius-small);
  font-size: 14px;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.register-text {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.link {
  color: var(--color-primary);
  font-weight: 500;
}
</style>