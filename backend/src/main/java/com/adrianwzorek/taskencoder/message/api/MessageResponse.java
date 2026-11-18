package com.adrianwzorek.taskencoder.message.api;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
        @Schema(description = "Identyfikator wiadomości") UUID id,
        @Schema(description = "Data utworzenia w UTC") Instant createdAt,
        @Schema(description = "Pakiet v1.<nonce>.<ciphertext+tag> (Base64)") String packet) {
}
