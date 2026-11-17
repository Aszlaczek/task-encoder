import { useMutation } from '@tanstack/react-query';
import { decryptPacket, encryptText } from './api';

export function useEncryptMutation() {
  return useMutation({
    mutationFn: (plaintext: string) => encryptText(plaintext),
  });
}

export function useDecryptMutation() {
  return useMutation({
    mutationFn: (packet: string) => decryptPacket(packet),
  });
}
