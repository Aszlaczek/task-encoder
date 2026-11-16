package com.adrianwzorek.taskencoder.message;

import java.util.UUID;

/**
 * Rzucany, gdy wiadomość nie istnieje albo nie należy do zalogowanego użytkownika.
 * Oba przypadki są traktowane tak samo, żeby nie ujawniać istnienia cudzych danych.
 */
public class MessageNotFoundException extends RuntimeException {

    public MessageNotFoundException(UUID id) {
        super("Nie znaleziono wiadomości: " + id);
    }
}
