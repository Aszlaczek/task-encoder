package com.adrianwzorek.taskencoder.message.api;

import io.swagger.v3.oas.annotations.media.Schema;

public record MessagePlaintextResponse(
        @Schema(description = "Odszyfrowany tekst wiadomości", example = "Tajna wiadomość") String plaintext) {
}
