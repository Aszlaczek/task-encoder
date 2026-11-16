package com.adrianwzorek.taskencoder.crypto.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EncryptRequest(
        @NotBlank(message = "Tekst jest wymagany.")
        @Size(max = 10000, message = "Tekst może mieć maksymalnie 10000 znaków.")
        String plaintext) {
}
