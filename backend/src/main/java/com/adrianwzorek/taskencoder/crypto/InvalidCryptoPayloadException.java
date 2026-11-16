package com.adrianwzorek.taskencoder.crypto;

/**
 * Sygnalizuje niepoprawny format pakietu albo nieudaną próbę odszyfrowania.
 * Szczegóły nie są ujawniane na zewnątrz, żeby nie pomagać w atakach.
 */
public class InvalidCryptoPayloadException extends RuntimeException {

    public InvalidCryptoPayloadException(String message) {
        super(message);
    }

    public InvalidCryptoPayloadException(String message, Throwable cause) {
        super(message, cause);
    }
}
