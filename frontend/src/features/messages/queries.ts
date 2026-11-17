import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMessage, decryptMessage, deleteMessage, fetchMessage, fetchMessages } from './api';

export const messagesQueryKey = ['messages'] as const;
export const messageListsKey = [...messagesQueryKey, 'list'] as const;
export const messageDetailsKey = [...messagesQueryKey, 'detail'] as const;

export function messageListKey(page: number, size: number) {
  return [...messageListsKey, page, size] as const;
}

export function messageDetailKey(id: string) {
  return [...messageDetailsKey, id] as const;
}

export function useMessagesQuery(page: number, size: number) {
  return useQuery({
    queryKey: messageListKey(page, size),
    queryFn: ({ signal }) => fetchMessages(page, size, signal),
    placeholderData: keepPreviousData,
  });
}

export function useMessageDetailQuery(id: string | null) {
  return useQuery({
    queryKey: messageDetailKey(id ?? 'none'),
    queryFn: ({ signal }) => fetchMessage(id ?? '', signal),
    enabled: id !== null,
    retry: false,
  });
}

export function useCreateMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMessage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: messageListsKey });
    },
  });
}

export function useDecryptMessageMutation() {
  return useMutation({
    mutationFn: decryptMessage,
  });
}

export function useDeleteMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMessage,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: messageDetailsKey });
      await queryClient.invalidateQueries({ queryKey: messageListsKey });
    },
  });
}
