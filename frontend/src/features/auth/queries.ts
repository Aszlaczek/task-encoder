import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { resetCsrfToken } from '@/shared/api';
import { loadSession, login, logout } from './api';

export const sessionQueryKey = ['auth', 'session'] as const;

function clearSessionData(queryClient: QueryClient): void {
  queryClient.setQueryData(sessionQueryKey, null);
  // Dane wiadomości są prywatne — nie mogą przetrwać zmiany użytkownika w cache.
  queryClient.removeQueries({ queryKey: ['messages'] });
  resetCsrfToken();
}

/**
 * Sesja jest źródłem prawdy o zalogowaniu. `null` oznacza anonimowego użytkownika,
 * a błąd sieci/serwera jest osobnym stanem, który można ponowić.
 */
export function useSessionQuery() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: ({ signal }) => loadSession(signal),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(sessionQueryKey, user);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => clearSessionData(queryClient),
  });
}

/** Kończy sesję po stronie klienta, np. gdy chroniony endpoint zwróci 401. */
export function useExpireSession() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    clearSessionData(queryClient);
  }, [queryClient]);
}
