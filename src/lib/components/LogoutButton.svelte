<script lang="ts">
  import { logout } from '$lib/stores/auth';

  async function handleLogout() {
    await logout();
  }
</script>

<button class="btn btn-error btn-sm" onclick={handleLogout}>
  Logout
</button>