package com.adrianwzorek.taskencoder.crypto.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.adrianwzorek.taskencoder.auth.AppUser;
import com.adrianwzorek.taskencoder.auth.AppUserDetails;
import com.adrianwzorek.taskencoder.auth.AppUserDetailsService;
import com.adrianwzorek.taskencoder.auth.AppUserRepository;
import com.adrianwzorek.taskencoder.common.security.SecurityConfig;
import com.adrianwzorek.taskencoder.crypto.CryptoProperties;
import com.adrianwzorek.taskencoder.crypto.CryptoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@WebMvcTest(controllers = CryptoController.class)
@Import({SecurityConfig.class, AppUserDetailsService.class, CryptoService.class, CryptoProperties.class})
@TestPropertySource(properties = "app.crypto.key=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
class CryptoControllerTest {

    private static final UUID ALICE_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID BOB_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private AppUserRepository appUserRepository;

    @BeforeEach
    void setUp() {
        AppUser alice = new AppUser("alice", passwordEncoder.encode("AliceDemo123!"));
        ReflectionTestUtils.setField(alice, "id", ALICE_ID);
        lenient().when(appUserRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
    }

    @Test
    void encryptRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/crypto/encrypt")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("plaintext", "tajne"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void encryptRequiresCsrfToken() throws Exception {
        mockMvc.perform(post("/api/crypto/encrypt")
                        .session(authenticatedSession(ALICE_ID, "alice"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("plaintext", "tajne"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CSRF_INVALID"));
    }

    @Test
    void encryptAndDecryptRoundTripForLoggedInUser() throws Exception {
        MockHttpSession session = authenticatedSession(ALICE_ID, "alice");

        MvcResult encryptResult = mockMvc.perform(post("/api/crypto/encrypt")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("plaintext", "tajna wiadomosc"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.packet").isString())
                .andReturn();

        String packet = objectMapper.readTree(encryptResult.getResponse().getContentAsString())
                .get("packet").asText();
        assertThat(packet).startsWith("v1.");

        mockMvc.perform(post("/api/crypto/decrypt")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("packet", packet))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plaintext").value("tajna wiadomosc"));
    }

    @Test
    void decryptPacketOfAnotherUserReturnsInvalidPayloadError() throws Exception {
        MockHttpSession aliceSession = authenticatedSession(ALICE_ID, "alice");

        MvcResult encryptResult = mockMvc.perform(post("/api/crypto/encrypt")
                        .session(aliceSession)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("plaintext", "sekret"))))
                .andExpect(status().isOk())
                .andReturn();

        String packet = objectMapper.readTree(encryptResult.getResponse().getContentAsString())
                .get("packet").asText();

        MockHttpSession bobSession = authenticatedSession(BOB_ID, "bob");
        mockMvc.perform(post("/api/crypto/decrypt")
                        .session(bobSession)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("packet", packet))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CRYPTO_PAYLOAD_INVALID"));
    }

    @Test
    void encryptValidatesRequestBody() throws Exception {
        mockMvc.perform(post("/api/crypto/encrypt")
                        .session(authenticatedSession(ALICE_ID, "alice"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("plaintext", ""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    private MockHttpSession authenticatedSession(UUID id, String username) {
        AppUserDetails principal = new AppUserDetails(id, username, "hash-not-used");
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
        return session;
    }
}
