<template>
  <div class="register-view">
    <header class="secondary-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <span class="header-title">Crear Cuenta</span>
      <div style="width: 24px;"></div>
    </header>

    <div class="register-content">
      <p class="subtitle">Únete a nuestra comunidad</p>

      <div class="role-selector">
        <label class="role-label">Selecciona tu rol</label>
        <div class="role-options">
          <button
            type="button"
            class="role-card"
            :class="{ active: form.role === 'tourist' }"
            @click="form.role = 'tourist'"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Turista</span>
          </button>
          <button
            type="button"
            class="role-card"
            :class="{ active: form.role === 'host' }"
            @click="form.role = 'host'"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Anfitrión</span>
          </button>
        </div>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="input-wrapper">
          <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <input v-model="form.name" type="text" class="input-field" placeholder="Nombre completo" required />
        </div>

        <div class="input-wrapper">
          <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <input v-model="form.email" type="email" class="input-field" placeholder="Correo electrónico" required />
        </div>

        <div class="input-wrapper">
          <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <input v-model="form.phone" type="tel" class="input-field" placeholder="Teléfono" required />
        </div>

        <div class="input-wrapper">
          <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <input v-model="form.password" type="password" class="input-field" placeholder="Contraseña" required />
        </div>

        <div class="input-wrapper">
          <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <input v-model="form.confirmPassword" type="password" class="input-field" placeholder="Confirmar contraseña" required />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Creando...' : 'Crear Cuenta' }}
        </button>

        <p class="login-text">
          ¿Ya tienes cuenta? <router-link to="/login" class="link">Inicia Sesión</router-link>
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
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: 'tourist'
})

const loading = ref(false)

async function handleRegister() {
  if (form.password !== form.confirmPassword) {
    alert('Las contraseñas no coinciden')
    return
  }

  loading.value = true
  try {
    const userData = {
      full_name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: form.role,
      accepted_terms: true
    }
    await authStore.register(userData)
    router.push('/verify-email')
  } catch (error) {
    console.error('Registration failed:', error)
    alert(error.response?.data?.error?.message || 'Error al registrar usuario')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/login')
}
</script>

<style scoped>
.register-view {
  min-height: 100vh;
  background: var(--color-background);
}

.secondary-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.header-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.register-content {
  padding: var(--spacing-xl) var(--spacing-lg);
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-bottom: var(--spacing-xl);
}

.role-selector {
  margin-bottom: var(--spacing-xl);
}

.role-label {
  display: block;
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.role-options {
  display: flex;
  gap: var(--spacing-md);
}

.role-card {
  flex: 1;
  height: 87px;
  background: var(--color-white);
  border: 1.7px solid var(--color-border);
  border-radius: var(--radius-small);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.role-card.active {
  border-color: var(--color-primary);
  background: rgba(76, 175, 80, 0.05);
}

.register-form {
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
  margin-top: var(--spacing-md);
}

.login-text {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-top: var(--spacing-lg);
}

.link {
  color: var(--color-primary);
  font-weight: 500;
}
</style>