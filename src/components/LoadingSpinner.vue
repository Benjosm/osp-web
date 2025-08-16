<!-- src/components/LoadingSpinner.vue -->
<template>
  <div class="spinner-container">
    <div :class="['spinner', size]"></div>
    <p v-if="message" class="spinner-message">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: 'medium', // 'small', 'medium', 'large'
  },
  message: {
    type: String,
    default: 'Loading...',
  },
});
</script>

<style scoped>
.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  animation: spin 1s linear infinite;
}

.spinner.small {
  width: 30px;
  height: 30px;
}

.spinner.medium {
  width: 50px;
  height: 50px;
}

.spinner.large {
  width: 80px;
  height: 80px;
}

.spinner-message {
  margin-top: 10px;
  color: #666;
  font-size: 14px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

</style>
