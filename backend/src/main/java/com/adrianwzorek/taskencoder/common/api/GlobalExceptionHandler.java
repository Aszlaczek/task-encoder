package com.adrianwzorek.taskencoder.common.api;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Zamienia wyjątki warstwy web na jednolity format {@link ApiError}. Komunikaty
 * logowania są celowo ogólne, żeby nie ujawniać, czy login istnieje.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleValidation(MethodArgumentNotValidException exception) {
        List<ApiError.FieldError> fieldErrors = exception.getBindingResult().getFieldErrors().stream()
                .map(this::toFieldError)
                .toList();
        return ApiError.withFields("VALIDATION_FAILED", "Dane żądania są nieprawidłowe.", fieldErrors);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleUnreadableBody(HttpMessageNotReadableException exception) {
        return ApiError.of("MALFORMED_REQUEST", "Treść żądania nie jest poprawnym JSON-em.");
    }

    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiError handleBadCredentials(BadCredentialsException exception) {
        return ApiError.of("INVALID_CREDENTIALS", "Nieprawidłowy login lub hasło.");
    }

    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiError handleAuthentication(AuthenticationException exception) {
        return ApiError.of("UNAUTHENTICATED", "Wymagane zalogowanie.");
    }

    private ApiError.FieldError toFieldError(FieldError fieldError) {
        String message = fieldError.getDefaultMessage() == null ? "Nieprawidłowa wartość." : fieldError.getDefaultMessage();
        return new ApiError.FieldError(fieldError.getField(), message);
    }
}
