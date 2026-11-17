import { apiRequest } from '@/shared/api';

export type EncryptRequest = { plaintext: string };
export type DecryptRequest = { packet: string };

export type EncryptResponse = { packet: string };
export type DecryptResponse = { plaintext: string };

export function encryptText(plaintext: string, signal?: AbortSignal): Promise<EncryptResponse> {
  return apiRequest<EncryptResponse>('/api/crypto/encrypt', {
    method: 'POST',
    body: { plaintext } satisfies EncryptRequest,
    signal,
  });
}

export function decryptPacket(packet: string, signal?: AbortSignal): Promise<DecryptResponse> {
  return apiRequest<DecryptResponse>('/api/crypto/decrypt', {
    method: 'POST',
    body: { packet } satisfies DecryptRequest,
    signal,
  });
}
