<template>
  <div class="home-page">
    <h1>Media Gallery</h1>

    <!-- Error Message -->
    <div v-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchMedia" class="retry-button">Retry</button>
    </div>

    <!-- Loading Spinner -->
    <div v-else-if="loading" class="loading-container">
      <div class="spinner"></div>
    </div>

    <!-- Media Grid -->
    <div v-else class="grid-container">
      <div class="grid-item" v-for="item in mediaItems" :key="item.id">
        <div class="thumbnail" :style="{ backgroundImage: `url(${item.thumbnailUrl})` }"></div>
        <h3 class="title">{{ item.title }}</h3>
        <p class="created-at">Created: {{ new Date(item.createdAt).toLocaleDateString() }}</p>
        <p class="location">Location: {{ item.location || 'Unknown' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// State to hold media items, loading status, and error
const mediaItems = ref([]);
const loading = ref(true);
const error = ref(null);

// Function to fetch media from the API
const fetchMedia = async () => {
  try {
    error.value = null; // Reset error on retry
    const response = await fetch('/api/v1/media');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let data = await response.json();

    // Ensure expected fields are present and filter out incomplete items
    const validMedia = data.filter(item => 
      item.id && 
      item.title && 
      item.thumbnailUrl && 
      item.createdAt && 
      (item.location !== undefined)
    );

    // Sort by createdAt descending (newest first)
    validMedia.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    mediaItems.value = validMedia;
  } catch (error) {
    console.error('Error fetching media:', error);
    mediaItems.value = []; // Fallback to empty array on error
    loading.value = false;
    error.value = "Failed to load media. Please try again.";
  } finally {
    loading.value = false;
  }
};

// Fetch data on component mount
onMounted(() => {
  fetchMedia();
});
</script>

<style scoped>
.home-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.grid-container {
  display: grid;
  gap: 1.5rem;
  width: 100%;
}

/* Mobile: 1 column */
.grid-container {
  grid-template-columns: repeat(1, 1fr);
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
  .grid-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

.grid-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f9f9f9;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.grid-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.thumbnail {
  width: 100%;
  height: 180px;
  background-color: #e0e0e0;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.title {
  margin: 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.created-at,
.location {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  color: #666;
}

/* Loading Spinner */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  width: 100%;
  margin: 2rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
