package com.adrianwzorek.taskencoder.auth.api;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @Schema(description = "Login konta demonstracyjnego", example = "alice")
        @NotBlank(message = "Login jest wymagany.")
                @Size(max = 50, message = "Login może mieć najwyżej 50 znaków.")
                String username,
        @Schema(description = "Hasło konta demonstracyjnego", example = "AliceDemo123!")
        @NotBlank(message = "Hasło jest wymagane.")
                @Size(max = 200, message = "Hasło może mieć najwyżej 200 znaków.")
                String password) {
}
