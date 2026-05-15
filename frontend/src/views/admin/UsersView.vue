<template>
  <div class="users-view">
    <h1>Gestión de Usuarios</h1>
    <div class="users-list">
      <div v-for="user in users" :key="user.id" class="user-card">
        <div class="user-avatar">{{ user.initials }}</div>
        <div class="user-info">
          <h4>{{ user.name }}</h4>
          <p>{{ user.email }}</p>
        </div>
        <span class="user-role" :class="user.role">{{ user.role }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const users = ref([
  { id: 1, name: 'Juan Pérez', email: 'juan@email.com', role: 'tourist', initials: 'JP' },
  { id: 2, name: 'María Gómez', email: 'maria@email.com', role: 'host', initials: 'MG' },
  { id: 3, name: 'Carlos López', email: 'carlos@email.com', role: 'admin', initials: 'CL' }
])
</script>

<style scoped>
.users-view { padding: var(--spacing-lg); }
h1 { font-size: 20px; margin-bottom: var(--spacing-xl); }
.users-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
.user-card { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); }
.user-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; color: var(--color-white); font-weight: 600; }
.user-info { flex: 1; }
.user-info h4 { font-size: 14px; }
.user-info p { font-size: 12px; color: var(--color-text-secondary); }
.user-role { padding: 4px 8px; font-size: 11px; border-radius: 4px; text-transform: capitalize; }
.user-role.tourist { background: var(--color-primary-light); color: var(--color-white); }
.user-role.host { background: var(--color-warning); color: var(--color-white); }
.user-role.admin { background: var(--color-danger); color: var(--color-white); }
</style>