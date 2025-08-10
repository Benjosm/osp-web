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
    <div v-else class="content-wrapper">
      <!-- Media Grid -->
      <div class="grid-container">
        <div class="grid-item" v-for="item in mediaItems" :key="item.id">
          <div class="thumbnail" :style="{ backgroundImage: `url(${item.thumbnailUrl})` }"></div>
          <h3 class="title">{{ item.title }}</h3>
          <p class="created-at">Created: {{ new Date(item.createdAt).toLocaleDateString() }}</p>
          <p class="location">Location: {{ item.location || 'Unknown' }}</p>
        </div>
      </div>

      <!-- Interactive Map -->
      <div class="sidebar-container">
        <div class="filter-section">
          <h3>Filter by Date & Time</h3>
          <div class="filter-row">
            <div class="filter-group">
              <label for="start-date">Start Date</label>
              <input type="date" id="start-date" v-model="filters.startDate" />
            </div>
            <div class="filter-group">
              <label for="end-date">End Date</label>
              <input type="date" id="end-date" v-model="filters.endDate" />
            </div>
          </div>
          <div class="filter-row">
            <div class="filter-group">
              <label for="start-time">Start Time</label>
              <input type="time" id="start-time" v-model="filters.startTime" />
            </div>
            <div class="filter-group">
              <label for="end-time">End Time</label>
              <input type="time" id="end-time" v-model="filters.endTime" />
            </div>
          </div>
          <button @click="applyFilters" class="filter-button">Filter</button>
        </div>
      </div>
      <div class="map-container">
        <l-map ref="mapRef" v-model:zoom="mapZoom" :center="mapCenter" @moveend="onMapMove" @zoomend="onMapMove">
          <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            layer-type="base"
            name="OpenStreetMap"
          ></l-tile-layer>
          
        </l-map>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker, LIcon } from "@vue-leaflet/vue-leaflet";
import { icon } from "leaflet";
import PruneCluster from '@sintef/prune-cluster';

// State to hold media items, loading status, and error
const mediaItems = ref([]);
const loading = ref(true);
const error = ref(null);
const mapRef = ref(null);

// Filter state
const filters = ref({
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: ''
});

// Function to format time strings to ISO format
const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const dateTimeStr = dateStr + (timeStr ? `T${timeStr}` : 'T00:00');
  return new Date(dateTimeStr).toISOString();
};

// Function to apply filters and fetch media
const applyFilters = () => {
  fetchMedia();
};

const getLocalMidnight = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const getLocalEndOfDay = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
};

// Map state
const mapZoom = ref(2);
const mapCenter = ref([0, 0]);
const mapMarkers = ref([]);

// Custom icon to fix Leaflet marker issue
const iconDefault = icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Function to calculate radius from zoom level (approximate)
const getRadiusFromZoom = (zoom) => {
  // Approximate radius in kilometers based on zoom level
  const radiusPerZoom = {
    0: 8000,
    1: 4000,
    2: 2000,
    3: 1000,
    4: 500,
    5: 250,
    6: 125,
    7: 60,
    8: 30,
    9: 15,
    10: 7.5,
    11: 4,
    12: 2,
    13: 1,
    14: 0.5,
    15: 0.25,
    16: 0.1,
    17: 0.05,
    18: 0.02,
    19: 0.01,
    20: 0.005
  };
  return radiusPerZoom[Math.round(zoom)] || 8000;
};

// Function to fetch media from the API with geographic and temporal filtering
const fetchMedia = async () => {
  try {
    error.value = null; // Reset error on retry
    loading.value = true;

    // Get current map center from either state or map instance
    const center = mapCenter.value;
    const latitude = center[0];
    const longitude = center[1];
    const radius = getRadiusFromZoom(mapZoom.value);

    // Format date/time filters
    const startDate = filters.value.startDate 
      ? getLocalMidnight(filters.value.startDate).toISOString() 
      : undefined;
    const endDate = filters.value.endDate 
      ? getLocalEndOfDay(filters.value.endDate).toISOString() 
      : undefined;
    const startTime = filters.value.startTime 
      ? filters.value.startTime + ':00'
      : undefined;
    const endTime = filters.value.endTime 
      ? filters.value.endTime + ':59'
      : undefined;

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('latitude', latitude.toString());
    queryParams.append('longitude', longitude.toString());
    queryParams.append('radius', radius.toString());
    
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (startTime) queryParams.append('startTime', startTime);
    if (endTime) queryParams.append('endTime', endTime);

    // Make API request with query parameters
    const response = await fetch(`/api/v1/media?${queryParams.toString()}`);
    
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
      (item.location !== undefined) &&
      item.coordinates && Array.isArray(item.coordinates) && 
      item.coordinates.length === 2 &&
      typeof item.coordinates[0] === 'number' && 
      typeof item.coordinates[1] === 'number'
    );

    // Sort by createdAt descending (newest first)
    validMedia.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    mediaItems.value = validMedia;
  } catch (err) {
    console.error('Error fetching media:', err);
    mediaItems.value = []; // Fallback to empty array on error
    error.value = "Failed to load media. Please try again.";
  } finally {
    loading.value = false;
  }
};

// Function to handle map movement
const onMapMove = async () => {
  // The v-model bindings on LMap automatically update mapCenter and mapZoom
  // So we can directly use these reactive values
  fetchMedia();
};

// Fetch data on component mount
onMounted(() => {
  nextTick(() => {
    if (!mapRef.value) return;
    const map = mapRef.value.mapObject;
    
    // Initialize PruneCluster for marker management
    const pruneCluster = new PruneCluster();
    pruneCluster.PrepareLeafletMarker = (leafletMarker, data) => {
      leafletMarker.bindPopup(data.title);
    };
    map.addLayer(pruneCluster);

    // Update markers based on filtered media items
    const updateMarkers = (items) => {
      pruneCluster.RemoveAllMarkers();
      items.forEach(item => {
        const marker = new PruneCluster.Marker(item.coordinates[0], item.coordinates[1]);
        marker.data = item;
        pruneCluster.RegisterMarker(marker);
      });
      pruneCluster.ProcessView();
    };

    // Initial marker setup and watch for media changes
    updateMarkers(mediaItems.value);
    watch(mediaItems, updateMarkers, { deep: true });
    
    // Fetch media data (which may update mediaItems)
    fetchMedia();
  });
});
</script>

<style scoped>
.home-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.map-container {
  height: 500px;
  width: 100%;
  margin-top: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

/* Mobile: 1 column */
@media (min-width: 768px) {
  .content-wrapper {
    flex-direction: row;
  }

  .grid-container {
    flex: 1;
    max-width: 500px;
  }

  .map-container {
    flex: 2;
    height: 600px;
  }
}

/* Filter Sidebar Styles */
.sidebar-container {
  flex: 1;
  max-width: 320px;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.5rem;
}

.filter-row {
  display: flex;
  gap: 1rem;
}

.filter-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.filter-group label {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.5rem;
}

.filter-group input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.filter-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
  margin-top: 0.5rem;
}

.filter-button:hover {
  background-color: #0056b3;
}

/* Layout for larger screens */
@media (min-width: 768px) {
  .content-wrapper {
    flex-direction: row;
    gap: 1.5rem;
  }
}

/* On mobile, stack everything */
@media (max-width: 767px) {
  .content-wrapper {
    flex-direction: column;
  }

  .sidebar-container {
    order: 1;
    margin-bottom: 1rem;
  }

  .map-container {
    order: 2;
    margin-bottom: 2rem;
  }

  .grid-container {
    order: 3;
  }

  .filter-row {
    flex-direction: column;
  }
}

/* Ensure filter inputs are usable on small screens */
@media (max-width: 480px) {
  .filter-group label {
    font-size: 0.8rem;
  }
  .filter-group input {
    font-size: 0.8rem;
    padding: 0.4rem;
  }
  .filter-button {
    font-size: 0.8rem;
    padding: 0.6rem;
  }
  .sidebar-container {
    padding: 0.75rem;
  }
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
