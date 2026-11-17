import { apiRequest } from '@/shared/api';

export type MessageSummary = {
  id: string;
  createdAt: string;
};

export type MessageDetails = MessageSummary & {
  packet: string;
};

export type MessagePage = {
  items: MessageSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type MessagePlaintext = {
  plaintext: string;
};

export const MESSAGE_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function fetchMessages(page: number, size: number, signal?: AbortSignal) {
  return apiRequest<MessagePage>(`/api/messages?page=${page}&size=${size}`, { signal });
}

export function fetchMessage(id: string, signal?: AbortSignal) {
  return apiRequest<MessageDetails>(`/api/messages/${id}`, { signal });
}

export function createMessage(plaintext: string) {
  return apiRequest<MessageDetails>('/api/messages', {
    method: 'POST',
    body: { plaintext },
  });
}

export function decryptMessage(id: string) {
  return apiRequest<MessagePlaintext>(`/api/messages/${id}/decrypt`, { method: 'POST' });
}

export function deleteMessage(id: string) {
  return apiRequest<void>(`/api/messages/${id}`, { method: 'DELETE' });
}
