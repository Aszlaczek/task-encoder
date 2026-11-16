package com.adrianwzorek.taskencoder.auth.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.adrianwzorek.taskencoder.auth.AppUser;
import com.adrianwzorek.taskencoder.auth.AppUserDetailsService;
import com.adrianwzorek.taskencoder.auth.AppUserRepository;
import com.adrianwzorek.taskencoder.common.security.SecurityConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@WebMvcTest(controllers = AuthController.class)
@Import({SecurityConfig.class, AppUserDetailsService.class})
class AuthControllerTest {

    private static final UUID ALICE_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final String ALICE_PASSWORD = "AliceDemo123!";

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
        AppUser alice = new AppUser("alice", passwordEncoder.encode(ALICE_PASSWORD));
        ReflectionTestUtils.setField(alice, "id", ALICE_ID);
        lenient().when(appUserRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
    }

    @Test
    void csrfEndpointReturnsTokenAndCookie() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(cookie().exists(SecurityConfig.CSRF_COOKIE_NAME))
                .andExpect(jsonPath("$.headerName").value(SecurityConfig.CSRF_HEADER_NAME))
                .andExpect(jsonPath("$.cookieName").value(SecurityConfig.CSRF_COOKIE_NAME))
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = body.get("token").asText();

        assertThat(token).isNotBlank();
        assertThat(result.getResponse().getCookie(SecurityConfig.CSRF_COOKIE_NAME).getValue()).isEqualTo(token);
    }

    @Test
    void loginReturnsUserAndCreatesSession() throws Exception {
        Csrf csrf = csrf();

        MvcResult result = mockMvc.perform(loginRequest("alice", ALICE_PASSWORD, csrf))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ALICE_ID.toString()))
                .andExpect(jsonPath("$.username").value("alice"))
                .andReturn();

        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertThat(session).isNotNull();

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void loginNormalizesUsername() throws Exception {
        Csrf csrf = csrf();

        mockMvc.perform(loginRequest("  ALICE  ", ALICE_PASSWORD, csrf))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void loginRejectsWrongPassword() throws Exception {
        Csrf csrf = csrf();

        mockMvc.perform(loginRequest("alice", "zle-haslo", csrf))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void loginRejectsUnknownUserWithSameMessage() throws Exception {
        Csrf csrf = csrf();

        mockMvc.perform(loginRequest("nobody", ALICE_PASSWORD, csrf))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("Nieprawidłowy login lub hasło."));
    }

    @Test
    void loginWithoutCsrfTokenIsRejected() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentials("alice", ALICE_PASSWORD)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CSRF_INVALID"));
    }

    @Test
    void loginValidatesRequestBody() throws Exception {
        Csrf csrf = csrf();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentials("   ", ""))
                        .cookie(csrf.cookie())
                        .header(SecurityConfig.CSRF_HEADER_NAME, csrf.token()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors").isArray())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("username"));
    }

    @Test
    void loginRejectsMalformedJson() throws Exception {
        Csrf csrf = csrf();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{nie-json")
                        .cookie(csrf.cookie())
                        .header(SecurityConfig.CSRF_HEADER_NAME, csrf.token()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"));
    }

    @Test
    void meWithoutSessionReturnsJson401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void logoutInvalidatesSessionAndExpiresCookie() throws Exception {
        Csrf csrf = csrf();
        MvcResult login = mockMvc.perform(loginRequest("alice", ALICE_PASSWORD, csrf))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);

        mockMvc.perform(post("/api/auth/logout")
                        .session(session)
                        .cookie(csrf.cookie())
                        .header(SecurityConfig.CSRF_HEADER_NAME, csrf.token()))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("JSESSIONID=")));

        assertThat(session.isInvalid()).isTrue();

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    private Csrf csrf() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        Cookie cookie = result.getResponse().getCookie(SecurityConfig.CSRF_COOKIE_NAME);
        return new Csrf(body.get("token").asText(), cookie);
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder loginRequest(
            String username, String password, Csrf csrf) throws Exception {
        return post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(credentials(username, password))
                .cookie(csrf.cookie())
                .header(SecurityConfig.CSRF_HEADER_NAME, csrf.token());
    }

    private String credentials(String username, String password) throws Exception {
        return objectMapper.writeValueAsString(Map.of("username", username, "password", password));
    }

    private record Csrf(String token, Cookie cookie) {
    }
}
