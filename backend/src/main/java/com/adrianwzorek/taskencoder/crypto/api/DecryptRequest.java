package com.adrianwzorek.taskencoder.crypto.api;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DecryptRequest(
        @Schema(
                description = "Pakiet w formacie v1.<nonce>.<ciphertext+tag> (Base64)",
                example = "v1.ABC....")
        @NotBlank(message = "Pakiet jest wymagany.")
        @Size(max = 30000, message = "Pakiet może mieć maksymalnie 30000 znaków.")
        String packet) {
}
