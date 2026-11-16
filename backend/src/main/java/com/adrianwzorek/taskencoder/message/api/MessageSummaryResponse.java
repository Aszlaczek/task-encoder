package com.adrianwzorek.taskencoder.message.api;

import java.time.Instant;
import java.util.UUID;

public record MessageSummaryResponse(UUID id, Instant createdAt) {
}
