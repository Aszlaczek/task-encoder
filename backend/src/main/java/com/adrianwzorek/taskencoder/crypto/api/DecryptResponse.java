package com.adrianwzorek.taskencoder.crypto.api;

import io.swagger.v3.oas.annotations.media.Schema;

public record DecryptResponse(
        @Schema(description = "Odszyfrowany tekst jawny", example = "Tajna wiadomość") String plaintext) {
}
