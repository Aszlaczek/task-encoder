package com.adrianwzorek.taskencoder.crypto;

import java.util.Base64;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Wczytuje i waliduje klucz AES-256 z konfiguracji. Błędny klucz przerywa start
 * aplikacji, bo bez niego nie da się bezpiecznie szyfrować ani odszyfrować danych.
 */
@Component
@ConfigurationProperties(prefix = "app.crypto")
public class CryptoProperties {

    private String key;

    public void setKey(String key) {
        this.key = key;
    }

    public String getKey() {
        return key;
    }

    public SecretKey secretKey() {
        if (!StringUtils.hasText(key)) {
            throw new IllegalStateException(
                    "Brak klucza szyfrowania APP_CRYPTO_KEY. Ustaw zmienną środowiskową (np. przez ./scripts/init-env.sh).");
        }

        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(key.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("Klucz APP_CRYPTO_KEY nie jest poprawnym ciągiem Base64.", ex);
        }

        if (decoded.length != 32) {
            throw new IllegalStateException(
                    "Klucz APP_CRYPTO_KEY musi mieć dokładnie 32 bajty (256 bitów) po dekodowaniu Base64.");
        }

        return new SecretKeySpec(decoded, "AES");
    }
}
