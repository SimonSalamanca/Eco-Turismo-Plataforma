<template>
  <div class="verify-view">
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
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <polyline points="9 12 12 15 22 5"></polyline>
          </svg>
        </div>
      </div>

      <h2 class="title">Verificación</h2>
      <p class="subtitle">Ingresa el código de 6 dígitos enviado a tu correo</p>

      <form @submit.prevent="handleVerify" class="form">
        <div class="code-inputs">
          <input
            v-for="(digit, index) in code"
            :key="index"
            :ref="el => inputs[index] = el"
            v-model="code[index]"
            type="text"
            maxlength="1"
            class="code-input"
            @input="handleInput(index)"
            @keydown.backspace="handleBackspace(index, $event)"
          />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading || code.join('').length < 6">
          {{ loading ? 'Verificando...' : 'Verificar' }}
        </button>

        <button type="button" class="resend-link">¿No recibiste el código? Reenviar</button>
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

const code = reactive(['', '', '', '', '', ''])
const inputs = ref([])
const loading = ref(false)

function handleInput(index) {
  if (code[index] && index < 5) {
    inputs.value[index + 1]?.focus()
  }
}

function handleBackspace(index, event) {
  if (!code[index] && index > 0) {
    inputs.value[index - 1]?.focus()
  }
}

async function handleVerify() {
  const verificationCode = code.join('')
  if (verificationCode.length < 6) return

  loading.value = true
  try {
    await authStore.verify2FA(verificationCode)
    if (authStore.isHost) {
      router.push('/host/dashboard')
    } else {
      router.push('/tourist/home')
    }
  } catch (error) {
    console.error('Verification failed:', error)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/register')
}
</script>

<style scoped>
.verify-view {
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
  gap: var(--spacing-lg);
}

.code-inputs {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
}

.code-input {
  width: 48px;
  height: 48px;
  text-align: center;
  font-size: 20px;
  border: 1.7px solid var(--color-border);
  border-radius: var(--radius-small);
  background: var(--color-surface);
}

.code-input:focus {
  border-color: var(--color-primary);
}

.btn-primary {
  margin-top: var(--spacing-md);
}

.resend-link {
  background: transparent;
  color: var(--color-primary);
  font-size: 14px;
  text-align: center;
  cursor: pointer;
}
</style>