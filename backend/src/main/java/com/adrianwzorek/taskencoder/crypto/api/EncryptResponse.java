package com.adrianwzorek.taskencoder.crypto.api;

import io.swagger.v3.oas.annotations.media.Schema;

public record EncryptResponse(
        @Schema(description = "Pakiet v1.<nonce>.<ciphertext+tag> (Base64)") String packet) {
}
