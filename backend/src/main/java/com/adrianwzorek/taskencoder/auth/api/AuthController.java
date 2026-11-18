package com.adrianwzorek.taskencoder.auth.api;

import com.adrianwzorek.taskencoder.auth.AppUserDetails;
import com.adrianwzorek.taskencoder.common.api.ApiError;
import com.adrianwzorek.taskencoder.common.security.SecurityConfig;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Logowanie oparte o sesję serwerową. Ciało żądania nigdy nie wskazuje właściciela —
 * tożsamość pochodzi wyłącznie z sesji ustawionej po poprawnym uwierzytelnieniu.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final boolean secureCookie;

    public AuthController(
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository,
            @Value("${server.servlet.session.cookie.secure:false}") boolean secureCookie) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.secureCookie = secureCookie;
    }

    @Operation(
            summary = "Pobierz token CSRF",
            description = "Zwraca token oraz nazwy cookie i nagłówka. Token jest jednocześnie zapisywany w cookie XSRF-TOKEN.")
    @GetMapping("/csrf")
    public CsrfResponse csrf(CsrfToken csrfToken) {
        return new CsrfResponse(csrfToken.getToken(), SecurityConfig.CSRF_HEADER_NAME, SecurityConfig.CSRF_COOKIE_NAME);
    }

    @Operation(
            summary = "Zaloguj użytkownika demonstracyjnego",
            description = "Utworzenie sesji serwerowej. Identyfikator użytkownika pochodzi z poświadczeń, nigdy z ciała żądania.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Zalogowano, zwraca dane użytkownika"),
        @ApiResponse(responseCode = "400", description = "Nieprawidłowy login lub hasło",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping("/login")
    public UserResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(request.username().strip(), request.password()));

        // Ochrona przed session fixation: istniejący identyfikator sesji nigdy nie
        // zostaje po zalogowaniu.
        if (httpRequest.getSession(false) != null) {
            httpRequest.changeSessionId();
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        AppUserDetails principal = (AppUserDetails) authentication.getPrincipal();
        return new UserResponse(principal.getId(), principal.getUsername());
    }

    @Operation(summary = "Dane zalogowanego użytkownika", description = "Wymaga aktywnej sesji.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Dane użytkownika"),
        @ApiResponse(responseCode = "401", description = "Brak aktywnej sesji",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AppUserDetails principal) {
        return new UserResponse(principal.getId(), principal.getUsername());
    }

    @Operation(summary = "Wyloguj", description = "Unieważnia sesję i wygasza cookie JSESSIONID.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Wylogowano"),
        @ApiResponse(responseCode = "401", description = "Brak aktywnej sesji",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();

        ResponseCookie expiredSessionCookie = ResponseCookie.from("JSESSIONID", "")
                .path("/")
                .maxAge(Duration.ZERO)
                .httpOnly(true)
                .sameSite("Lax")
                .secure(secureCookie)
                .build();
        httpResponse.addHeader(HttpHeaders.SET_COOKIE, expiredSessionCookie.toString());
    }
}
