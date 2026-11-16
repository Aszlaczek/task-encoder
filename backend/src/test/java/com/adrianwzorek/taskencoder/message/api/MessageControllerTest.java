package com.adrianwzorek.taskencoder.message.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.adrianwzorek.taskencoder.auth.AppUser;
import com.adrianwzorek.taskencoder.auth.AppUserDetails;
import com.adrianwzorek.taskencoder.auth.AppUserDetailsService;
import com.adrianwzorek.taskencoder.auth.AppUserRepository;
import com.adrianwzorek.taskencoder.common.security.SecurityConfig;
import com.adrianwzorek.taskencoder.message.MessageNotFoundException;
import com.adrianwzorek.taskencoder.message.MessageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@WebMvcTest(controllers = MessageController.class)
@Import({SecurityConfig.class, AppUserDetailsService.class})
class MessageControllerTest {

    private static final UUID ALICE_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID MESSAGE_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private AppUserRepository appUserRepository;

    @MockitoBean
    private MessageService messageService;

    @BeforeEach
    void setUp() {
        AppUser alice = new AppUser("alice", passwordEncoder.encode("AliceDemo123!"));
        ReflectionTestUtils.setField(alice, "id", ALICE_ID);
        lenient().when(appUserRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
    }

    @Test
    void createRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/messages")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("plaintext", "tajne"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void createSavesMessageForLoggedInUser() throws Exception {
        when(messageService.create(eq("tajne"), eq(ALICE_ID)))
                .thenReturn(new MessageResponse(MESSAGE_ID, Instant.parse("2026-11-16T12:00:00Z"), "v1.n.ct"));

        mockMvc.perform(post("/api/messages")
                        .session(authenticatedSession(ALICE_ID, "alice"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("plaintext", "tajne"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(MESSAGE_ID.toString()))
                .andExpect(jsonPath("$.packet").value("v1.n.ct"));
    }

    @Test
    void listReturnsPageForLoggedInUser() throws Exception {
        when(messageService.list(ALICE_ID, 0, 10)).thenReturn(new MessagePageResponse(
                List.of(new MessageSummaryResponse(MESSAGE_ID, Instant.parse("2026-11-16T12:00:00Z"))),
                0, 10, 1, 1));

        mockMvc.perform(get("/api/messages")
                        .session(authenticatedSession(ALICE_ID, "alice")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(MESSAGE_ID.toString()))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void decryptReturnsPlaintext() throws Exception {
        when(messageService.decrypt(ALICE_ID, MESSAGE_ID))
                .thenReturn(new MessagePlaintextResponse("jawne"));

        mockMvc.perform(post("/api/messages/" + MESSAGE_ID + "/decrypt")
                        .session(authenticatedSession(ALICE_ID, "alice"))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plaintext").value("jawne"));
    }

    @Test
    void getMissingOrForeignMessageReturns404() throws Exception {
        when(messageService.get(ALICE_ID, MESSAGE_ID)).thenThrow(new MessageNotFoundException(MESSAGE_ID));

        mockMvc.perform(get("/api/messages/" + MESSAGE_ID)
                        .session(authenticatedSession(ALICE_ID, "alice")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("MESSAGE_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Nie znaleziono wiadomości."));
    }

    @Test
    void deleteRemovesMessage() throws Exception {
        mockMvc.perform(delete("/api/messages/" + MESSAGE_ID)
                        .session(authenticatedSession(ALICE_ID, "alice"))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(messageService).delete(ALICE_ID, MESSAGE_ID);
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
