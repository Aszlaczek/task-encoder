package com.adrianwzorek.taskencoder.message.api;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

public record MessageSummaryResponse(
        @Schema(description = "Identyfikator wiadomości") UUID id,
        @Schema(description = "Data utworzenia w UTC") Instant createdAt) {
}
