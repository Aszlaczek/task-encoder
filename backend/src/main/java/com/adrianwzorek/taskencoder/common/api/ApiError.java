package com.adrianwzorek.taskencoder.common.api;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

/**
 * Wspólny format odpowiedzi błędu. Trzymamy go celowo prostym: kod maszynowy,
 * komunikat dla człowieka i opcjonalna lista błędów pól.
 */
public record ApiError(
        @Schema(description = "Kod błędu", example = "CRYPTO_PAYLOAD_INVALID") String code,
        @Schema(description = "Komunikat po polsku", example = "Nieprawidłowy pakiet szyfrogramu.") String message,
        @Schema(description = "Moment błędu w UTC") Instant timestamp,
        @Schema(description = "Błędy walidacji pól, pusta lista jeśli nie dotyczy") List<FieldError> fieldErrors) {

    public ApiError {
        fieldErrors = fieldErrors == null ? List.of() : List.copyOf(fieldErrors);
    }

    public static ApiError of(String code, String message) {
        return new ApiError(code, message, Instant.now(), List.of());
    }

    public static ApiError withFields(String code, String message, List<FieldError> fieldErrors) {
        return new ApiError(code, message, Instant.now(), fieldErrors);
    }

    public record FieldError(
            @Schema(description = "Nazwa pola", example = "plaintext") String field,
            @Schema(description = "Komunikat walidacji", example = "Tekst jest wymagany.") String message) {
    }
}
