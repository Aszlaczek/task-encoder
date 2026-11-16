package com.adrianwzorek.taskencoder.crypto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Base64;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.Test;

class CryptoPropertiesTest {

    @Test
    void returnsSecretKeyForValid32ByteKey() {
        CryptoProperties props = new CryptoProperties();
        props.setKey(Base64.getEncoder().encodeToString(new byte[32]));

        SecretKey key = props.secretKey();

        assertThat(key.getAlgorithm()).isEqualTo("AES");
        assertThat(key.getEncoded()).hasSize(32);
    }

    @Test
    void failsWhenKeyMissing() {
        CryptoProperties props = new CryptoProperties();
        props.setKey("");

        assertThatThrownBy(props::secretKey)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_CRYPTO_KEY");
    }

    @Test
    void failsWhenKeyIsNotBase64() {
        CryptoProperties props = new CryptoProperties();
        props.setKey("nie-base64-%%%");

        assertThatThrownBy(props::secretKey)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Base64");
    }

    @Test
    void failsWhenKeyHasWrongLength() {
        CryptoProperties props = new CryptoProperties();
        props.setKey(Base64.getEncoder().encodeToString(new byte[16]));

        assertThatThrownBy(props::secretKey)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bajty");
    }
}
