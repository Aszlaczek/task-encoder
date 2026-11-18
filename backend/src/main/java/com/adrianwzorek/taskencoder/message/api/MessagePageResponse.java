package com.adrianwzorek.taskencoder.message.api;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

public record MessagePageResponse(
        @Schema(description = "Podsumowania wiadomości na stronie") List<MessageSummaryResponse> items,
        @Schema(description = "Numer strony, licząc od zera", example = "0") int page,
        @Schema(description = "Rozmiar strony", example = "10") int size,
        @Schema(description = "Łączna liczba wiadomości", example = "23") long totalElements,
        @Schema(description = "Łączna liczba stron", example = "3") int totalPages) {
}
