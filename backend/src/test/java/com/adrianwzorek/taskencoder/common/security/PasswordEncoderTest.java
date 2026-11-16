package com.adrianwzorek.taskencoder.common.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class PasswordEncoderTest {

    private final PasswordEncoder passwordEncoder = new SecurityConfig().passwordEncoder();

    @Test
    void hashesPasswordAndMatchesIt() {
        String hash = passwordEncoder.encode("TajneHaslo123!");

        assertThat(hash).startsWith("$2");
        assertThat(hash).hasSize(60);
        assertThat(passwordEncoder.matches("TajneHaslo123!", hash)).isTrue();
        assertThat(passwordEncoder.matches("zle-haslo", hash)).isFalse();
    }

    @Test
    void usesSaltForEveryHash() {
        String first = passwordEncoder.encode("TajneHaslo123!");
        String second = passwordEncoder.encode("TajneHaslo123!");

        assertThat(first).isNotEqualTo(second);
        assertThat(passwordEncoder.matches("TajneHaslo123!", first)).isTrue();
        assertThat(passwordEncoder.matches("TajneHaslo123!", second)).isTrue();
    }
}
