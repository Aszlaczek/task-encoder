package com.adrianwzorek.taskencoder.crypto.api;

import com.adrianwzorek.taskencoder.auth.AppUserDetails;
import com.adrianwzorek.taskencoder.common.api.ApiError;
import com.adrianwzorek.taskencoder.crypto.CryptoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Operacje szyfrowania i deszyfrowania bez zapisu w bazie.
 * Właściciel jest zawsze brany z sesji zalogowanego użytkownika.
 */
@RestController
@RequestMapping("/api/crypto")
public class CryptoController {

    private final CryptoService cryptoService;

    public CryptoController(CryptoService cryptoService) {
        this.cryptoService = cryptoService;
    }

    @Operation(
            summary = "Zaszyfruj tekst",
            description = "Szyfrowanie AES-256-GCM bez zapisu. Pakiet ma postać v1.<nonce>.<ciphertext+tag> (Base64).")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Zwraca wygenerowany pakiet"),
        @ApiResponse(responseCode = "401", description = "Brak aktywnej sesji",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping("/encrypt")
    public EncryptResponse encrypt(
            @AuthenticationPrincipal AppUserDetails user,
            @Valid @RequestBody EncryptRequest request) {
        String packet = cryptoService.encrypt(request.plaintext(), user.getId());
        return new EncryptResponse(packet);
    }

    @Operation(
            summary = "Odszyfruj pakiet",
            description = "Deszyfrowanie w kontekście zalogowanego użytkownika. AAD wiąże pakiet z właścicielem.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Zwraca tekst jawny"),
        @ApiResponse(responseCode = "400", description = "Nieprawidłowy pakiet szyfrogramu",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "401", description = "Brak aktywnej sesji",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping("/decrypt")
    public DecryptResponse decrypt(
            @AuthenticationPrincipal AppUserDetails user,
            @Valid @RequestBody DecryptRequest request) {
        String plaintext = cryptoService.decrypt(request.packet(), user.getId());
        return new DecryptResponse(plaintext);
    }
}
