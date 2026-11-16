package com.adrianwzorek.taskencoder.crypto.api;

import com.adrianwzorek.taskencoder.auth.AppUserDetails;
import com.adrianwzorek.taskencoder.crypto.CryptoService;
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

    @PostMapping("/encrypt")
    public EncryptResponse encrypt(
            @AuthenticationPrincipal AppUserDetails user,
            @Valid @RequestBody EncryptRequest request) {
        String packet = cryptoService.encrypt(request.plaintext(), user.getId());
        return new EncryptResponse(packet);
    }

    @PostMapping("/decrypt")
    public DecryptResponse decrypt(
            @AuthenticationPrincipal AppUserDetails user,
            @Valid @RequestBody DecryptRequest request) {
        String plaintext = cryptoService.decrypt(request.packet(), user.getId());
        return new DecryptResponse(plaintext);
    }
}
