import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loadSession, login, logout } from './api';

export const sessionQueryKey = ['auth', 'session'] as const;

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
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryKey, null);
    },
  });
}
