package com.adrianwzorek.taskencoder.auth.api;

import java.util.UUID;

public record UserResponse(UUID id, String username) {
}
