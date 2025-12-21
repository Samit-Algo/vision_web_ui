// Storage Utilities - Helper functions to save/load data from browser storage
// We use localStorage to persist the login token even after page refresh

const tokenKey = 'auth_token'; // Key name for storing token in localStorage

/**
 * Saves the authentication token to browser storage
 * @param token - The JWT token received from backend
 */
export function saveToken(token: string): void {
  localStorage.setItem(tokenKey, token);
  console.log('Token saved to localStorage');
}

/**
 * Retrieves the authentication token from browser storage
 * @returns The token if it exists, or null if not found
 */
export function getToken(): string | null {
  return localStorage.getItem(tokenKey);
}

/**
 * Removes the authentication token from browser storage
 * Used when user logs out
 */
export function removeToken(): void {
  localStorage.removeItem(tokenKey);
  console.log('Token removed from localStorage');
}

/**
 * Checks if user has a valid token (is logged in)
 * @returns true if token exists, false otherwise
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

