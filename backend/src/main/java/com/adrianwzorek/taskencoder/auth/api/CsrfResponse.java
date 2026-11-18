package com.adrianwzorek.taskencoder.auth.api;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Token CSRF zwracany frontendowi. Wartość jest też zapisana w cookie
 * `XSRF-TOKEN`; klient odsyła ją w nagłówku `X-XSRF-TOKEN` przy mutacjach.
 */
public record CsrfResponse(
        @Schema(description = "Token do odesłania w nagłówku mutacji") String token,
        @Schema(description = "Nazwa nagłówka", example = "X-XSRF-TOKEN") String headerName,
        @Schema(description = "Nazwa cookie", example = "XSRF-TOKEN") String cookieName) {
}
