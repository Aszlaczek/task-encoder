import { z } from 'zod';

export const PLAINTEXT_MAX_LENGTH = 10_000;
export const PACKET_MAX_LENGTH = 30_000;

/** Limity odpowiadają walidacji w `EncryptRequest` i `DecryptRequest` backendu. */
export const plaintextSchema = z
  .string()
  .min(1, 'Podaj tekst do zaszyfrowania.')
  .max(PLAINTEXT_MAX_LENGTH, `Tekst może mieć maksymalnie ${PLAINTEXT_MAX_LENGTH} znaków.`);

export const packetSchema = z
  .string()
  .trim()
  .min(1, 'Podaj pakiet do odszyfrowania.')
  .max(PACKET_MAX_LENGTH, `Pakiet może mieć maksymalnie ${PACKET_MAX_LENGTH} znaków.`);

export const encryptFormSchema = z.object({ plaintext: plaintextSchema });
export const decryptFormSchema = z.object({ packet: packetSchema });
