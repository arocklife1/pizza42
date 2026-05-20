import { writable, derived, get, type Readable } from 'svelte/store';
import { createAuth0Client, User, type Auth0Client, type IdToken } from '@auth0/auth0-spa-js';
import { browser } from '$app/environment';
import { replaceState } from '$app/navigation';

  export const auth0Client = writable<Auth0Client | null>(null);
  export const user = writable<User | null>(null);
  export const isAuthenticated = writable<boolean>(false);
  export const isLoading = writable<boolean>(true);
  export const error = writable<string | null>(null);

  // Derived stores
  export const isLoggedIn: Readable<boolean> = derived(
    [isAuthenticated, isLoading],
    ([$isAuthenticated, $isLoading]) => $isAuthenticated && !$isLoading
  );

  export async function initializeAuth() {
    if (!browser) return;
    
    try {
      const client = await createAuth0Client({
        domain: import.meta.env.VITE_AUTH0_DOMAIN,
        clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
        authorizationParams: {
          redirect_uri: window.location.origin,
          audience: 'http://my-api',
          scope: 'openid profile email update:orders'
        },
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });

      auth0Client.set(client);

      // Handle callback
        const query = window.location.search;
        if (query.includes('code=') && query.includes('state=')) {
            try {
                await client.handleRedirectCallback();
            } catch (e) {
                // code was already consumed — ignore and continue
                console.warn('Redirect callback failed (likely stale code):', e);
            }
            replaceState(window.location.pathname, {});
        }

      // Check authentication status
      const authenticated = await client.isAuthenticated();
      isAuthenticated.set(authenticated);

      if (authenticated) {
        const userData = await client.getUser();
        user.set(userData || null);
      }

      error.set(null);
    } catch (err) {
      console.error('Auth initialization error:', err);
      error.set(err instanceof Error ? err.message : 'Authentication initialization failed');
    } finally {
      isLoading.set(false);
    }
  }

  export async function login() {
    const client = get(auth0Client);
    if (client) {
      await client.loginWithRedirect({
        authorizationParams: {
          audience: 'http://my-api',
          scope: 'openid profile email update:orders'
        }
      });
    }
  }

  export async function logout() {
    const client = get(auth0Client);
    if (client) {
      client.logout({ 
        logoutParams: { 
          returnTo: window.location.origin 
        } 
      });
    }
  }

  export async function getAPIToken(newOrder: any): Promise<any> {
    const client = get(auth0Client);
    if (!client) throw new Error('Auth0 client not initialized');

    if (!get(user)?.email_verified) {
      throw new Error('Your email is not verified');
    }

    try {
      const token = await client.getTokenSilently({
        authorizationParams: {
          audience: 'http://my-api',
          scope: 'openid profile email update:orders'
        }
      });

      // add the new order to the user metadata
      let newOrders = get(user)?.user_metadata.orders ?? []
      newOrders.push(newOrder)

      // use the token to call the API
      const response = await fetch('/api/protected', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          data: newOrders
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to save order');
      }

      return data;
    } catch (error: any) {
      console.error('Error getting token:', error);
      throw new Error(
        error?.message || 'Something went wrong while saving your order'
      );

    }
  }

  export async function checkIDToken(): Promise<IdToken | undefined> {
    const client = get(auth0Client);
    if (!client) return undefined;
    
    try {
      return await client.getIdTokenClaims()
    } catch (err: any) {
      if (err.error === 'login_required') {
        await login();
      }
      return undefined;
    }
  }
