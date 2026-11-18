package com.adrianwzorek.taskencoder.message.api;

import com.adrianwzorek.taskencoder.auth.AppUserDetails;
import com.adrianwzorek.taskencoder.common.api.ApiError;
import com.adrianwzorek.taskencoder.message.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @Operation(
            summary = "Zapisz zaszyfrowaną wiadomość",
            description = "Tekst jest szyfrowany AES-256-GCM przed zapisem. W bazie nie ma tekstu jawnego.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Wiadomość zapisana"),
        @ApiResponse(responseCode = "401", description = "Brak aktywnej sesji",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse create(
            @AuthenticationPrincipal AppUserDetails user,
            @Valid @RequestBody CreateMessageRequest request) {
        return messageService.create(request.plaintext(), user.getId());
    }

    @Operation(
            summary = "Lista własnych wiadomości",
            description = "Paginacja offsetowa. Zwraca podsumowania bez pakietu; maksymalny rozmiar strony to 50.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Strona wiadomości"),
        @ApiResponse(responseCode = "401", description = "Brak aktywnej sesji",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @GetMapping
    public MessagePageResponse list(
            @AuthenticationPrincipal AppUserDetails user,
            @Parameter(description = "Numer strony, licząc od zera", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Rozmiar strony od 1 do 50", example = "10")
            @RequestParam(defaultValue = "10") int size) {
        int safePage = Math.max(page, 0);
        int safeSize = size;
        if (safeSize < 1) {
            safeSize = 10;
        }
        if (safeSize > 50) {
            safeSize = 50;
        }
        return messageService.list(user.getId(), safePage, safeSize);
    }

    @Operation(summary = "Szczegóły własnej wiadomości", description = "Zwraca pakiet szyfrogramu.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Szczegóły wiadomości"),
        @ApiResponse(responseCode = "401", description = "Brak aktywnej sesji",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Wiadomość nie istnieje lub należy do innego użytkownika",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @GetMapping("/{id}")
    public MessageResponse get(
            @AuthenticationPrincipal AppUserDetails user,
            @Parameter(description = "Identyfikator wiadomości", example = "3f2504e0-4f89-41d3-9a0c-0305e82c3301")
            @PathVariable UUID id) {
        return messageService.get(user.getId(), id);
    }

    @Operation(
            summary = "Odszyfruj zapisaną wiadomość",
            description = "Tekst jawny jest zwracany tylko w odpowiedzi — nie jest zapisywany.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Odszyfrowany tekst"),
        @ApiResponse(responseCode = "401", description = "Brak aktywnej sesji",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Wiadomość nie istnieje lub należy do innego użytkownika",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping("/{id}/decrypt")
    public MessagePlaintextResponse decrypt(
            @AuthenticationPrincipal AppUserDetails user,
            @Parameter(description = "Identyfikator wiadomości", example = "3f2504e0-4f89-41d3-9a0c-0305e82c3301")
            @PathVariable UUID id) {
        return messageService.decrypt(user.getId(), id);
    }

    @Operation(summary = "Usuń własną wiadomość")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Wiadomość usunięta"),
        @ApiResponse(responseCode = "401", description = "Brak aktywnej sesji",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Wiadomość nie istnieje lub należy do innego użytkownika",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal AppUserDetails user,
            @Parameter(description = "Identyfikator wiadomości", example = "3f2504e0-4f89-41d3-9a0c-0305e82c3301")
            @PathVariable UUID id) {
        messageService.delete(user.getId(), id);
    }
}
