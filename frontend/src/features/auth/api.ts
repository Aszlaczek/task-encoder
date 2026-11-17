import { ApiError, apiRequest, resetCsrfToken } from '@/shared/api';

export type User = {
  id: string;
  username: string;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

/** Bieżący użytkownik sesji albo `null`, gdy backend odpowiada 401. Inne błędy są rzucane dalej. */
export async function loadSession(signal?: AbortSignal): Promise<User | null> {
  try {
    return await apiRequest<User>('/api/auth/me', { signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const user = await apiRequest<User>('/api/auth/login', {
    method: 'POST',
    body: credentials,
  });

  // Po zalogowaniu backend rotuje token CSRF — poprzednia wartość nie może być użyta ponownie.
  resetCsrfToken();
  return user;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<void>('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    // Wygasła sesja oznacza, że użytkownik i tak jest już wylogowany.
    if (!(error instanceof ApiError && error.status === 401)) {
      throw error;
    }
  }

  resetCsrfToken();
}
