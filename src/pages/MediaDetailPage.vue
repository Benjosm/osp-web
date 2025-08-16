<!-- src/pages/MediaDetailPage.vue -->
<template>
  <div v-if="isLoading" class="loading-container">
    <LoadingSpinner message="Loading media details..." />
  </div>

  <div v-else-if="errorMedia" class="error-container">
    <p>{{ errorMedia }}</p>
    <button @click="fetchMedia">Retry</button>
  </div>
  
  <div v-else-if="media" class="media-detail-page">
    <h2>{{ media.title }}</h2>
    <p><strong>Description:</strong> {{ media.description }}</p>
    <img :src="media.thumbnailUrl" :alt="media.title" class="media-image" />
    <p><strong>Uploaded:</strong> {{ new Date(media.createdAt).toLocaleString() }}</p>
    <p v-if="media.location"><strong>Location:</strong> {{ media.location }}</p>
    
    <section class="comments-section">
      <h3>Comments</h3>
      
      <div v-if="loadingComments" class="loading-container">
        <LoadingSpinner size="small" message="Loading comments..." />
      </div>
      <div v-else-if="errorComments" class="error-container">
        <p>{{ errorComments }}</p>
        <button @click="fetchComments">Retry</button>
      </div>
      
      <ul v-else-if="comments.length > 0" class="comment-list">
        <li v-for="comment in comments" :key="comment.id" class="comment-item">
          <p>{{ comment.text }}</p>
          <small>{{ new Date(comment.createdAt).toLocaleString() }}</small>
        </li>
      </ul>
      <p v-else>No comments yet.</p>

      <!-- Comment Form -->
      <form v-if="isAuthenticated" @submit.prevent="postComment" class="comment-form">
        <textarea v-model="newCommentText" placeholder="Add a comment..." required rows="3"></textarea>
        <div v-if="errorPostComment" class="error-container small">
          <p>{{ errorPostComment }}</p>
        </div>
        <button type="submit" :disabled="loadingPostComment">
          {{ loadingPostComment ? 'Posting...' : 'Post Comment' }}
        </button>
      </form>
    </section>
  </div>
  
  <div v-else>
    <p>Media not found.</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import LoadingSpinner from '../components/LoadingSpinner.vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const route = useRoute();
const mediaId = route.params.id;

const media = ref(null);
const comments = ref([]);
const newCommentText = ref('');

const loadingMedia = ref(true);
const loadingComments = ref(true);
const loadingPostComment = ref(false);

const errorMedia = ref(null);
const errorComments = ref(null);
const errorPostComment = ref(null);

const isLoading = computed(() => loadingMedia.value);
const isAuthenticated = computed(() => !!localStorage.getItem('token'));

const fetchMedia = async () => {
  loadingMedia.value = true;
  errorMedia.value = null;
  try {
    const response = await fetch(`${API_BASE_URL}/media/${mediaId}`);
    if (!response.ok) throw new Error('Failed to load media.');
    media.value = await response.json();
  } catch (error) {
    errorMedia.value = error.message;
  } finally {
    loadingMedia.value = false;
  }
};

const fetchComments = async () => {
  loadingComments.value = true;
  errorComments.value = null;
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${mediaId}`);
    if (!response.ok) throw new Error('Failed to load comments.');
    comments.value = await response.json();
  } catch (error) {
    errorComments.value = error.message;
  } finally {
    loadingComments.value = false;
  }
};

const postComment = async () => {
  if (!newCommentText.value.trim()) return;
  
  loadingPostComment.value = true;
  errorPostComment.value = null;
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ mediaId, text: newCommentText.value }),
    });
    if (!response.ok) throw new Error('Failed to post comment.');
    
    const newComment = await response.json();
    comments.value.unshift(newComment); // Add to start of list
    newCommentText.value = ''; // Clear textarea
  } catch (error) {
    errorPostComment.value = error.message;
  } finally {
    loadingPostComment.value = false;
  }
};

onMounted(() => {
  fetchMedia();
  fetchComments();
});
</script>

<style scoped>
/* Add relevant styles for media detail page here */
.media-detail-page { max-width: 800px; margin: auto; }
.media-image { width: 100%; border-radius: 8px; }
.comments-section { margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
.comment-list { list-style: none; padding: 0; }
.comment-item { border-bottom: 1px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 15px; }
.comment-form { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
.error-container { color: #dc3545; text-align: center; margin: 20px; }
</style>
