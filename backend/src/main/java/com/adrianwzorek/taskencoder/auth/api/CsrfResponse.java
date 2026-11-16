package com.adrianwzorek.taskencoder.auth.api;

/**
 * Token CSRF zwracany frontendowi. Wartość jest też zapisana w cookie
 * `XSRF-TOKEN`; klient odsyła ją w nagłówku `X-XSRF-TOKEN` przy mutacjach.
 */
public record CsrfResponse(String token, String headerName, String cookieName) {
}
