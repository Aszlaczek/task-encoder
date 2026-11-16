package com.adrianwzorek.taskencoder.common.api;

import java.time.Instant;
import java.util.List;

/**
 * Wspólny format odpowiedzi błędu. Trzymamy go celowo prostym: kod maszynowy,
 * komunikat dla człowieka i opcjonalna lista błędów pól.
 */
public record ApiError(String code, String message, Instant timestamp, List<FieldError> fieldErrors) {

    public ApiError {
        fieldErrors = fieldErrors == null ? List.of() : List.copyOf(fieldErrors);
    }

    public static ApiError of(String code, String message) {
        return new ApiError(code, message, Instant.now(), List.of());
    }

    public static ApiError withFields(String code, String message, List<FieldError> fieldErrors) {
        return new ApiError(code, message, Instant.now(), fieldErrors);
    }

    public record FieldError(String field, String message) {
    }
}
