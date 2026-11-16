package com.adrianwzorek.taskencoder.auth.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Login jest wymagany.")
                @Size(max = 50, message = "Login może mieć najwyżej 50 znaków.")
                String username,
        @NotBlank(message = "Hasło jest wymagane.")
                @Size(max = 200, message = "Hasło może mieć najwyżej 200 znaków.")
                String password) {
}
