<!-- src/pages/AccountSettingsPage.vue -->
<template>
  <div class="account-settings-page">
    <div class="settings-container">
      <h1>Account Settings</h1>
      
      <div class="delete-account-section">
        <h2>Delete Account</h2>
        <p class="warning-text">
          <strong>Warning:</strong> This action is permanent and cannot be undone.
          All your data will be lost.
        </p>
        
        <button
          @click="showDeleteConfirmation"
          :disabled="isLoading"
          class="delete-button"
        >
          <template v-if="isLoading">
            <span class="spinner"></span>
            Deleting...
          </template>
          <template v-else>
            Delete Account
          </template>
        </button>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">Confirm Account Deletion</h3>
        <p class="modal-message">
          Are you sure you want to delete your account? This action cannot be undone.
        </p>
        <div class="modal-buttons">
          <button 
            @click="closeModal" 
            class="cancel-button"
            :disabled="isLoading"
          >
            Cancel
          </button>
          <button 
            @click="handleDeleteAccount" 
            class="confirm-delete-button"
            :disabled="isLoading"
          >
            <template v-if="isLoading">
              <span class="spinner"></span>
              Deleting...
            </template>
            <template v-else>
              Delete
            </template>
          </button>
        </div>
      </div>
    </div>

    <!-- Error Modal -->
    <div v-if="showErrorModal" class="modal-overlay" @click="closeErrorModal">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">Account Deletion Failed</h3>
        <p class="modal-message">{{ errorMessage }}</p>
        <div class="modal-buttons">
          <button 
            @click="closeErrorModal" 
            class="ok-button"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import AuthService from '../services/auth.service';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const isLoading = ref(false);
const showConfirmModal = ref(false);
const showErrorModal = ref(false);
const errorMessage = ref('');
const shouldSignOut = ref(false);

const showDeleteConfirmation = () => {
  showConfirmModal.value = true;
};

const closeModal = () => {
  if (!isLoading.value) {
    showConfirmModal.value = false;
  }
};

const closeErrorModal = () => {
  showErrorModal.value = false;
  if (shouldSignOut.value) {
    AuthService.signOut();
  }
};

const handleDeleteAccount = async () => {
  isLoading.value = true;
  shouldSignOut.value = false;

  try {
    await axios.delete(`${API_BASE_URL}/users/current`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    // On success: clear auth state and redirect
    AuthService.signOut();
  } catch (err) {
    let message = 'An unknown error occurred.';
    shouldSignOut.value = false;

    if (!err.response) {
      // Network error (e.g., no connection, timeout)
      message = 'Unable to connect to the server. Please check your internet connection and try again.';
    } else {
      switch (err.response.status) {
        case 401:
          // Unauthorized: invalid or expired token
          message = 'Authentication expired. Please sign in again.';
          shouldSignOut.value = true;
          break;
        case 409:
          // Conflict: deletion already in progress
          message = 'Account deletion is already in progress.';
          break;
        case 500:
          // Internal Server Error
          message = 'An error occurred while deleting your account. Please try again later.';
          break;
        default:
          // Other server errors
          message = 'An error occurred while deleting your account. Please try again later.';
          break;
      }
    }

    errorMessage.value = message;
    showConfirmModal.value = false;
    showErrorModal.value = true;
    isLoading.value = false;
  }
};
</script>

<style scoped>
.account-settings-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.settings-container h1 {
  margin: 0 0 2rem 0;
  font-size: 28px;
  font-weight: 500;
  color: #333;
}

.delete-account-section {
  border-top: 1px solid #eee;
  padding-top: 2rem;
}

.delete-account-section h2 {
  margin: 0 0 1rem 0;
  font-size: 20px;
  font-weight: 500;
  color: #333;
}

.warning-text {
  margin: 0 0 1rem 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.warning-text strong {
  color: #dc3545;
}

.delete-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s;
}

.delete-button:hover:not(:disabled) {
  background-color: #c82333;
}

.delete-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-title {
  margin: 0 0 1rem 0;
  font-size: 20px;
  font-weight: 500;
  color: #333;
}

.modal-message {
  margin: 0 0 1.5rem 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-button, .ok-button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  background-color: white;
  color: #333;
  transition: background-color 0.3s, border-color 0.3s;
}

.cancel-button:hover, .ok-button:hover {
  background-color: #f8f8f8;
  border-color: #ccc;
}

.confirm-delete-button {
  padding: 8px 16px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s;
}

.confirm-delete-button:hover:not(:disabled) {
  background-color: #c82333;
}

.confirm-delete-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
