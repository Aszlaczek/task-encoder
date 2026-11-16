package com.adrianwzorek.taskencoder.crypto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Base64;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CryptoServiceTest {

    private static final String TEST_KEY = Base64.getEncoder().encodeToString(new byte[32]);

    private CryptoService cryptoService;
    private UUID owner;

    @BeforeEach
    void setUp() {
        CryptoProperties props = new CryptoProperties();
        props.setKey(TEST_KEY);
        cryptoService = new CryptoService(props);
        owner = UUID.fromString("11111111-1111-1111-1111-111111111111");
    }

    @Test
    void encryptAndDecryptRoundTrip() {
        String plaintext = "Witaj świecie";

        String packet = cryptoService.encrypt(plaintext, owner);
        String decrypted = cryptoService.decrypt(packet, owner);

        assertThat(packet).startsWith("v1.");
        assertThat(decrypted).isEqualTo(plaintext);
    }

    @Test
    void differentEncryptionsProduceDifferentPacketsBecauseNonceIsRandom() {
        String plaintext = "tajna wiadomosc";

        String packet1 = cryptoService.encrypt(plaintext, owner);
        String packet2 = cryptoService.encrypt(plaintext, owner);

        assertThat(packet1).isNotEqualTo(packet2);
    }

    @Test
    void decryptWithDifferentOwnerFails() {
        String packet = cryptoService.encrypt("sekret", owner);
        UUID otherOwner = UUID.fromString("22222222-2222-2222-2222-222222222222");

        assertThatThrownBy(() -> cryptoService.decrypt(packet, otherOwner))
                .isInstanceOf(InvalidCryptoPayloadException.class);
    }

    @Test
    void decryptInvalidPacketFails() {
        assertThatThrownBy(() -> cryptoService.decrypt("nieprawidlowy-pakiet", owner))
                .isInstanceOf(InvalidCryptoPayloadException.class);
    }

    @Test
    void decryptRejectsWrongVersion() {
        String packet = cryptoService.encrypt("tekst", owner);
        String wrongVersion = packet.replaceFirst("^v1\\.", "v2.");

        assertThatThrownBy(() -> cryptoService.decrypt(wrongVersion, owner))
                .isInstanceOf(InvalidCryptoPayloadException.class)
                .hasMessageContaining("Nieobsługiwana wersja pakietu");
    }

    @Test
    void decryptRejectsEmptyPacket() {
        assertThatThrownBy(() -> cryptoService.decrypt("", owner))
                .isInstanceOf(InvalidCryptoPayloadException.class);
    }
}
