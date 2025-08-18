<template>
  <div class="home-page">

    <!-- Error Message -->
    <div v-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchMedia" class="retry-button">Retry</button>
    </div>

    <!-- Loading Spinner -->
    <!-- <div v-show="loading" class="loading-container">
      <div class="spinner"></div>
    </div> -->

    <!-- Main Content -->
    <div class="main-content">
      
      <!-- View Toggle Button -->
      <div class="view-toggle">
        <button 
          @click="currentView = 'map'" 
          :class="{ active: currentView === 'map' }"
          class="toggle-btn"
        >
          Map View
        </button>
        <button 
          @click="currentView = 'grid'" 
          :class="{ active: currentView === 'grid' }"
          class="toggle-btn"
        >
          Grid View
        </button>
      </div>

      <!-- Filter Toggle Button -->
      <button @click="showFilters = !showFilters" class="filter-toggle-btn">
        <span>🔍</span>
        Filters
      </button>

      <!-- Filter Overlay -->
      <div v-if="showFilters" class="filter-overlay">
        <div class="filter-panel">
          <div class="filter-header">
            <h3>Filter by Date & Time</h3>
            <button @click="showFilters = false" class="close-btn">×</button>
          </div>
          
          <div class="filter-content">
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
            <div class="filter-actions">
              <button @click="clearFilters" class="clear-button">Clear</button>
              <button @click="applyFilters" class="filter-button">Apply Filters</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid View -->
      <div v-if="currentView === 'grid'" class="grid-container">
        <div class="grid-item" v-for="item in mediaItems" :key="item.id">
          <div class="thumbnail" :style="{ backgroundImage: `url(${item.thumbnailUrl})` }"></div>
          <h3 class="title">{{ item.title }}</h3>
          <p class="created-at">Created: {{ new Date(item.createdAt).toLocaleDateString() }}</p>
          <p class="location">Location: {{ item.location?.lat?.toFixed(4) }}, {{ item.location?.lng?.toFixed(4) }}</p>
        </div>
      </div>

      <!-- Map View -->
      <div v-if="currentView === 'map'" class="map-container content-area">
        <l-map 
          ref="mapRef" 
          v-model:zoom="mapZoom" 
          :center="mapCenter" 
          @moveend="onMapMove" 
          @zoomend="onMapMove"
          @ready="onMapReady"
        >
          <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            layer-type="base"
            name="OpenStreetMap"
          ></l-tile-layer>
        </l-map>

        <div v-if="hoveredMediaItem" class="hover-preview">
          <img :src="hoveredMediaItem.thumbnailUrl" :alt="hoveredMediaItem.title" />
          <span>{{ hoveredMediaItem.title }}</span>
        </div>
      </div>
      
    </div>
    <div v-if="isModalVisible" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <button @click="closeModal" class="modal-close-btn">×</button>

        <template v-if="currentModalItem">
          <div class="modal-image-container">
            <img :src="currentModalItem.thumbnailUrl" :alt="currentModalItem.title" class="modal-image" />
          </div>
          <div class="modal-info">
            <h3>{{ currentModalItem.title }}</h3>
            <p><strong>Captured:</strong> {{ new Date(currentModalItem.createdAt).toLocaleString() }}</p>
            <p><strong>Location:</strong> {{ currentModalItem.location.lat.toFixed(6) }}, {{ currentModalItem.location.lng.toFixed(6) }}</p>
            <p v-if="currentModalItem.orientation">
              <strong>Orientation:</strong>
              Azimuth: {{ currentModalItem.orientation.azimuth }},
              Pitch: {{ currentModalItem.orientation.pitch }},
              Roll: {{ currentModalItem.orientation.roll }}
            </p>
            <p><strong>Trust Score:</strong> {{ currentModalItem.trustScore ?? 'N/A' }}</p>
            <p><strong>User ID:</strong> {{ currentModalItem.userId }}</p>
          </div>
        </template>

        <!-- Navigation Arrows for clusters -->
        <template v-if="modalMediaItems.length > 1">
          <button @click="prevMedia" class="modal-nav-btn prev" title="Previous">‹</button>
          <button @click="nextMedia" class="modal-nav-btn next" title="Next">›</button>
          <div class="modal-counter">{{ currentModalIndex + 1 }} / {{ modalMediaItems.length }}</div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watchEffect, computed } from 'vue';
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
import L, { icon } from "leaflet";

import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// View state
const currentView = ref('map');
const showFilters = ref(false);

// State to hold media items, loading status, and error
const mediaItems = ref([]);
const isFetchingMedia = ref(true);
const error = ref(null);
const mapRef = ref(null);
const mapZoom = ref(2);
const mapCenter = ref([0, 0]);

const mapInstance = ref(null);
const markerClusterGroup = ref(null);

// Filter state
const filters = ref({
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: ''
});

const hoveredMediaItem = ref(null);
const isModalVisible = ref(false);
const modalMediaItems = ref([]);
const currentModalIndex = ref(0);

const currentModalItem = computed(() => {
  if (modalMediaItems.value.length > 0) {
    return modalMediaItems.value[currentModalIndex.value];
  }
  return null;
});

const openModal = (items, startIndex = 0) => {
  if (items.length === 0) return;
  modalMediaItems.value = items;
  currentModalIndex.value = startIndex;
  isModalVisible.value = true;
};

const closeModal = () => {
  isModalVisible.value = false;
  // Clear data after transition to free memory
  setTimeout(() => {
    modalMediaItems.value = [];
    currentModalIndex.value = 0;
  }, 300);
};

const nextMedia = () => {
  if (modalMediaItems.value.length > 1) {
    currentModalIndex.value = (currentModalIndex.value + 1) % modalMediaItems.value.length;
  }
};

const prevMedia = () => {
  if (modalMediaItems.value.length > 1) {
    currentModalIndex.value = (currentModalIndex.value - 1 + modalMediaItems.value.length) % modalMediaItems.value.length;
  }
};

// Function to clear filters
const clearFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  };
  fetchMedia();
};

// Function to format time strings to ISO format
const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const dateTimeStr = dateStr + (timeStr ? `T${timeStr}` : 'T00:00');
  return new Date(dateTimeStr).toISOString();
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
  // The circumference of the Earth in meters, approximately. This will be our max search radius.
  const maxRadius = 120600000;

  // Set a practical minimum radius for when zoomed in very close.
  const minRadius = 25; // 25 meters

  const offset = 5;
  const offsetZoom = Math.max(0, zoom - offset);

  // Each zoom level typically doubles the precision, so we divide the radius by 2^zoom.
  // We use Math.max to ensure the radius doesn't become impractically small (e.g., millimeters).
  const calculatedRadius = maxRadius / Math.pow(2, offsetZoom);

  return Math.max(minRadius, calculatedRadius);
};

const normalizeLongitude = (lng) => {
  lng = lng % 360;
  if (lng > 180) lng -= 360;
  if (lng < -180) lng += 360;
  return lng;
};

const normalizeLatitude = (lat) => {
  return Math.max(-90, Math.min(90, lat));
};

const fetchMedia = async () => {
  if (currentView.value === 'map' && !mapInstance.value) {
    console.warn("FetchMedia called before map instance was available.");
    return;
  }

  try {
    isFetchingMedia.value = true;
    error.value = null;
    const queryParams = new URLSearchParams();
    
    if (currentView.value === 'map' && mapInstance.value) {
      const map = mapInstance.value;
      const center = map.getCenter();
      const zoom = map.getZoom();
      const radius = getRadiusFromZoom(zoom);
      
      queryParams.append('lat', normalizeLatitude(center.lat).toString());
      queryParams.append('lng', normalizeLongitude(center.lng).toString());
      queryParams.append('radius', radius.toString());
    } else {
      // For grid view, use default global parameters
      queryParams.append('lat', '0');
      queryParams.append('lng', '0');
      queryParams.append('radius', '2000000000');
    }

    if (filters.value.startDate) {
      const startTime = filters.value.startTime || '00:00:00';
      const startDateTime = new Date(`${filters.value.startDate}T${startTime}`);
      queryParams.append('start_date', startDateTime.toISOString());
    } else {
      queryParams.append('start_date', (new Date('0001-01-01T00:00:00Z')).toISOString());
    }
    if (filters.value.endDate) {
      const endTime = filters.value.endTime || '23:59:59';
      const endDateTime = new Date(`${filters.value.endDate}T${endTime}`);
      queryParams.append('end_date', endDateTime.toISOString());
    } else {
      queryParams.append('end_date', (new Date('9999-12-31T23:59:59Z')).toISOString());
    }

    console.log(`Fetching media with params: ${queryParams.toString()}`);

    const response = await fetch(`${API_BASE_URL}/media?${queryParams.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.detail || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log(`Response: ${JSON.stringify(data)}`);
    const mediaList = data.media || [];

    const validAndMappedMedia = mediaList
      .filter(item => 
        item.id && 
        item.capture_time && 
        item.file_path &&
        typeof item.lat === 'number' &&
        typeof item.lng === 'number'
      )
      .map(item => ({
        id: item.id,
        title: `Media from ${new Date(item.capture_time).toLocaleDateString()}`,
        thumbnailUrl: item.image_url,
        createdAt: item.capture_time,
        location: { lat: item.lat, lng: item.lng },
        coordinates: [item.lat, item.lng],
        orientation: item.orientation,
        trustScore: item.trust_score,
        userId: item.user_id
      }));

    validAndMappedMedia.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    mediaItems.value = validAndMappedMedia;
    console.log(`Successfully loaded and mapped ${validAndMappedMedia.length} media items.`);

  } catch (err) {
    console.error('Error fetching media:', err);
    mediaItems.value = [];
    error.value = err.message || "Failed to load media. Please try again.";
  } finally {
    if (isFetchingMedia.value) {
      isFetchingMedia.value = false;
    }
  }
};

// Function to handle map movement
const onMapMove = () => {
  if (currentView.value === 'map') {
    fetchMedia();
  }
};

const applyFilters = () => {
  showFilters.value = false;
  fetchMedia();
};

const onMapReady = (leafletMapObject) => {
  mapInstance.value = leafletMapObject;
  if (!mapInstance.value) {
    console.error("Leaflet map object not received in onMapReady event.");
    return;
  }
  
  markerClusterGroup.value = L.markerClusterGroup({
    maxClusterRadius: 50,      // Make clusters cover a smaller area (default is 80)
    spiderfyOnMaxZoom: true,   // Spread out markers on max zoom click
    showCoverageOnHover: false,// Cleaner hover experience
  });

  markerClusterGroup.value.on('clustermouseover', (e) => {
    const markers = e.layer.getAllChildMarkers();
    if (markers.length > 0) {
      // Find the most recent media item in the cluster
      const mostRecentItem = markers
        .map(marker => marker.mediaItem)
        .filter(Boolean) // Make sure mediaItem exists
        .reduce((latest, current) => {
          if (!latest) return current;
          return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
        }, null);

      if (mostRecentItem) {
        hoveredMediaItem.value = mostRecentItem;
      }
    }
  });
  markerClusterGroup.value.on('clustermouseout', () => {
    hoveredMediaItem.value = null;
  });

  markerClusterGroup.value.on('clusterclick', (e) => {
    // Zooming is the default behavior. If we are already at max zoom,
    // the cluster will spiderfy. We can open our modal instead.
    // This logic opens the modal regardless of zoom level.
    const childMarkers = e.layer.getAllChildMarkers();
    const items = childMarkers.map(m => m.mediaItem).filter(Boolean);
    if (items.length > 0) {
      openModal(items);
    }
  });
  
  mapInstance.value.addLayer(markerClusterGroup.value);
  
  if (currentView.value === 'map') {
    fetchMedia();
  }
};

watchEffect(() => {
  if (currentView.value === 'grid') {
    fetchMedia();
  }
});

// This watchEffect updates map markers
watchEffect(() => {
  if (!markerClusterGroup.value || currentView.value !== 'map') return;

  markerClusterGroup.value.clearLayers();

  mediaItems.value.forEach(item => {
    const marker = L.marker(item.coordinates, { icon: iconDefault });

    // This is crucial for accessing its data in event handlers.
    marker.mediaItem = item;

    marker.on('mouseover', () => {
      hoveredMediaItem.value = item;
    });
    marker.on('mouseout', () => {
      hoveredMediaItem.value = null;
    });

    marker.on('click', () => {
      openModal([item]);
    });

    markerClusterGroup.value.addLayer(marker);
  });
});
</script>

<style scoped>
.home-page {
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
}

.main-content {
  height: 100vh;
  width: 100vw;
  position: relative;
}

/* View Toggle */
.view-toggle {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  display: flex;
  gap: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.toggle-btn {
  padding: 10px 20px;
  border: none;
  background-color: #fff;
  color: #333;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-right: 1px solid #e0e0e0;
}

.toggle-btn:last-child {
  border-right: none;
}

.toggle-btn:hover {
  background-color: #f0f0f0;
}

.toggle-btn.active {
  background-color: #007bff;
  color: white;
}

/* Filter Toggle Button */
.filter-toggle-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  padding: 10px 16px;
  border: none;
  background-color: #fff;
  color: #333;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.filter-toggle-btn:hover {
  background-color: #f0f0f0;
  transform: translateY(-1px);
}

/* Filter Overlay */
.filter-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.filter-panel {
  background-color: white;
  border-radius: 12px;
  padding: 0;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.filter-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.filter-content {
  padding: 0 20px 20px 20px;
}

.filter-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
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
  font-weight: 500;
}

.filter-group input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.filter-group input:focus {
  outline: none;
  border-color: #007bff;
}

.filter-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

.clear-button {
  padding: 12px 24px;
  border: 1px solid #ddd;
  background-color: white;
  color: #333;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.clear-button:hover {
  background-color: #f8f9fa;
  border-color: #999;
}

.filter-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.filter-button:hover {
  background-color: #0056b3;
}

/* Grid View */
.grid-container {
  height: 100vh;
  width: 100vw;
  overflow-y: auto;
  padding: 80px 20px 20px 20px;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  box-sizing: border-box;
}

.grid-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f9f9f9;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: fit-content;
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
  background-size: cover;
  background-position: center;
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

/* Map View */
.map-container {
  height: 100vh;
  width: 100vw;
}

.content-area {
  position: relative; /* This is the positioning context for the overlay */
}

.content-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 1500; /* Should be above the map/grid but below filters/modals */
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Loading Spinner */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
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

/* Error Container */
.error-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  text-align: center;
}

.error-message {
  color: #d32f2f;
  margin-bottom: 1rem;
}

.retry-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.retry-button:hover {
  background-color: #0056b3;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .view-toggle {
    left: 10px;
    top: 10px;
  }
  
  .filter-toggle-btn {
    right: 10px;
    top: 10px;
    padding: 8px 12px;
    font-size: 0.8rem;
  }
  
  .grid-container {
    padding: 60px 10px 10px 10px;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }
  
  .filter-overlay {
    padding: 10px;
  }
  
  .filter-panel {
    max-height: 90vh;
  }
  
  .filter-row {
    flex-direction: column;
  }
  
  .filter-actions {
    flex-direction: column;
  }
  
  .toggle-btn {
    padding: 8px 16px;
    font-size: 0.8rem;
  }
}
.hover-preview {
  position: absolute;
  bottom: 30px;
  left: 20px;
  z-index: 999; /* Below map controls */
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none; /* Prevents flicker */
  max-width: 200px;
  transition: opacity 0.2s ease;
}

/* FINAL CHANGE: Ensure preview image is fully visible and maintains aspect ratio */
.hover-preview img {
  /* Set maximum dimensions to constrain size */
  max-width: 180px;
  max-height: 150px;
  
  /* The browser will now scale the image to fit these bounds while preserving its aspect ratio. 
     This prevents the "squished" look and ensures the whole image is visible. */
  border-radius: 4px;
}

.hover-preview span {
  font-size: 0.8rem;
  color: #333;
  margin-top: 6px;
  text-align: center;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90vw;
  height: 90vh;
  max-width: 1600px; /* Cap width on very large screens */
  box-sizing: border-box;
  display: flex;
  gap: 2rem;
  position: relative;
  box-shadow: 0 10px 40px rgba(0,0,0,0.4);
  overflow: hidden;
}

.modal-image-container {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;
}

.modal-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.modal-info {
  flex: 1;
  overflow-y: auto;
  padding-right: 15px; /* For scrollbar */
}

.modal-info h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #222;
}

.modal-info p {
  margin: 0.8rem 0;
  line-height: 1.6;
  font-size: 0.95rem;
  color: #555;
}

.modal-info p strong {
  color: #333;
}

.modal-close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 28px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background-color: #f0f0f0;
  color: #000;
}

.modal-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0,0,0,0.4);
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.modal-nav-btn:hover {
  background-color: rgba(0,0,0,0.7);
}

.modal-nav-btn.prev {
  left: 20px;
}

.modal-nav-btn.next {
  right: 20px;
}

.modal-counter {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0,0,0,0.6);
  color: white;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.9rem;
}

@media (max-width: 900px) {
  .modal-content {
    flex-direction: column;
    max-width: 95vw;
    padding: 1.5rem;
  }
  .modal-image {
    max-height: 50vh;
  }
  .modal-info {
    flex: none;
    max-height: 35vh;
  }
}
</style>
