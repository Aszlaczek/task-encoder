package com.adrianwzorek.taskencoder.crypto;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Szyfrowanie i deszyfrowanie wiadomości algorytmem AES-256-GCM.
 * Format pakietu: v1.<nonce>.<ciphertext+tag> (wszystko kodowane Base64).
 */
@Service
public class CryptoService {

    static final String PACKET_VERSION = "v1";
    static final String TRANSFORMATION = "AES/GCM/NoPadding";
    static final int NONCE_LENGTH_BYTES = 12;
    static final int TAG_LENGTH_BITS = 128;

    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public CryptoService(CryptoProperties cryptoProperties) {
        this.secretKey = cryptoProperties.secretKey();
    }

    public String encrypt(String plaintext, UUID ownerId) {
        if (plaintext == null) {
            throw new InvalidCryptoPayloadException("Brak tekstu do zaszyfrowania.");
        }
        if (ownerId == null) {
            throw new InvalidCryptoPayloadException("Brak właściciela operacji szyfrowania.");
        }

        byte[] nonce = new byte[NONCE_LENGTH_BYTES];
        secureRandom.nextBytes(nonce);

        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, nonce));
            cipher.updateAAD(aad(ownerId));

            byte[] ciphertextWithTag = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            return PACKET_VERSION
                    + "." + encode(nonce)
                    + "." + encode(ciphertextWithTag);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Nie udało się zaszyfrować wiadomości.", ex);
        }
    }

    public String decrypt(String packet, UUID ownerId) {
        if (!StringUtils.hasText(packet)) {
            throw new InvalidCryptoPayloadException("Brak pakietu do odszyfrowania.");
        }
        if (ownerId == null) {
            throw new InvalidCryptoPayloadException("Brak właściciela operacji deszyfrowania.");
        }

        String[] parts = packet.split("\\.", -1);
        if (parts.length != 3) {
            throw new InvalidCryptoPayloadException("Pakiet ma nieprawidłową liczbę segmentów.");
        }
        if (!PACKET_VERSION.equals(parts[0])) {
            throw new InvalidCryptoPayloadException("Nieobsługiwana wersja pakietu.");
        }

        byte[] nonce = decode(parts[1], "nonce");
        byte[] ciphertextWithTag = decode(parts[2], "ciphertext");

        if (nonce.length != NONCE_LENGTH_BYTES) {
            throw new InvalidCryptoPayloadException("Nonce ma nieprawidłową długość.");
        }
        if (ciphertextWithTag.length < TAG_LENGTH_BITS / 8) {
            throw new InvalidCryptoPayloadException("Pakiet jest zbyt krótki.");
        }

        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, nonce));
            cipher.updateAAD(aad(ownerId));

            byte[] plaintext = cipher.doFinal(ciphertextWithTag);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException ex) {
            // Celowo ogólnie: może to być cudzy pakiet, uszkodzenie albo zły format.
            throw new InvalidCryptoPayloadException("Nie udało się odszyfrować pakietu.", ex);
        }
    }

    private byte[] aad(UUID ownerId) {
        return ownerId.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String encode(byte[] bytes) {
        return Base64.getEncoder().encodeToString(bytes);
    }

    private byte[] decode(String value, String label) {
        try {
            return Base64.getDecoder().decode(value);
        } catch (IllegalArgumentException ex) {
            throw new InvalidCryptoPayloadException("Segment pakietu (" + label + ") nie jest poprawnym Base64.", ex);
        }
    }
}
