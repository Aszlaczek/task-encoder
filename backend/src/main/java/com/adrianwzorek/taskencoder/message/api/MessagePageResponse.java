package com.adrianwzorek.taskencoder.message.api;

import java.util.List;

public record MessagePageResponse(
        List<MessageSummaryResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {
}
