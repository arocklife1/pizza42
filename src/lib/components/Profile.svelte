<script lang="ts">
  import { user, isAuthenticated, isLoading } from '$lib/stores/auth';
  
  const placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2363b3ed'/%3E%3Cpath d='M50 45c7.5 0 13.64-6.14 13.64-13.64S57.5 17.72 50 17.72s-13.64 6.14-13.64 13.64S42.5 45 50 45zm0 6.82c-9.09 0-27.28 4.56-27.28 13.64v3.41c0 1.88 1.53 3.41 3.41 3.41h47.74c1.88 0 3.41-1.53 3.41-3.41v-3.41c0-9.08-18.19-13.64-27.28-13.64z' fill='%23fff'/%3E%3C/svg%3E`;
  
  function handleImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = placeholderImage;
  }
</script>

{#if $isLoading}
  <div class="loading-text">Loading profile...</div>
{:else if $isAuthenticated && $user}
  <div class="text-right hidden sm:block">
    <p class="font-semibold leading-tight">{$user.name || 'Unknown User'}</p>
    <p class="text-sm text-base-content/60">{$user.email || ''}</p>
  </div>

  <div class="avatar">
    <div class="w-10 rounded-full">
      <img 
        src={$user.picture || placeholderImage} 
        alt={$user.name || 'User'} 
        class="profile-picture"
        onerror={handleImageError}
      />
    </div>
  </div>
{/if}

<style>
  .loading-text {
    font-size: 1.8rem;
    font-weight: 500;
    color: #a0aec0;
    animation: pulse 1.5s infinite ease-in-out;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
</style>