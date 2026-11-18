package com.adrianwzorek.taskencoder.crypto.api;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EncryptRequest(
        @Schema(description = "Tekst jawny do zaszyfrowania (maks. 10000 znaków)", example = "Tajna wiadomość")
        @NotBlank(message = "Tekst jest wymagany.")
        @Size(max = 10000, message = "Tekst może mieć maksymalnie 10000 znaków.")
        String plaintext) {
}
