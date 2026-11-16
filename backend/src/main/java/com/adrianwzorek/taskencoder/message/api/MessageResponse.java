package com.adrianwzorek.taskencoder.message.api;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(UUID id, Instant createdAt, String packet) {
}
