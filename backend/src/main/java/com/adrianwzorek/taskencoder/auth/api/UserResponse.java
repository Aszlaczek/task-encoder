package com.adrianwzorek.taskencoder.auth.api;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

public record UserResponse(
        @Schema(description = "Identyfikator użytkownika z sesji") UUID id,
        @Schema(description = "Login użytkownika", example = "alice") String username) {
}
