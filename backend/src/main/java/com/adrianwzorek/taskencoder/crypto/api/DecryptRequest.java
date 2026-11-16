package com.adrianwzorek.taskencoder.crypto.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DecryptRequest(
        @NotBlank(message = "Pakiet jest wymagany.")
        @Size(max = 30000, message = "Pakiet może mieć maksymalnie 30000 znaków.")
        String packet) {
}
