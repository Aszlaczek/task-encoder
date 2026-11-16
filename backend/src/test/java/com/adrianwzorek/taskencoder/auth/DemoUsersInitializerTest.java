package com.adrianwzorek.taskencoder.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class DemoUsersInitializerTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ApplicationArguments applicationArguments;

    @Test
    void createsMissingDemoAccounts() {
        when(appUserRepository.existsByUsername("alice")).thenReturn(false);
        when(appUserRepository.existsByUsername("bob")).thenReturn(false);
        when(passwordEncoder.encode("AliceDemo123!")).thenReturn("hash-alice");
        when(passwordEncoder.encode("BobDemo1234!")).thenReturn("hash-bob");

        initializer().run(applicationArguments);

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(appUserRepository, times(2)).save(captor.capture());
        assertThat(captor.getAllValues())
                .extracting(AppUser::getUsername)
                .containsExactly("alice", "bob");
        assertThat(captor.getAllValues())
                .extracting(AppUser::getPasswordHash)
                .containsExactly("hash-alice", "hash-bob");
    }

    @Test
    void doesNotOverwriteExistingAccounts() {
        when(appUserRepository.existsByUsername("alice")).thenReturn(true);
        when(appUserRepository.existsByUsername("bob")).thenReturn(true);

        initializer().run(applicationArguments);

        verify(appUserRepository, never()).save(any());
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void skipsAccountsWithBlankCredentials() {
        DemoUserProperties properties = new DemoUserProperties(List.of(
                new DemoUserProperties.Account(" ", "secret"),
                new DemoUserProperties.Account("bob", "   ")));

        new DemoUsersInitializer(appUserRepository, passwordEncoder, properties).run(applicationArguments);

        verify(appUserRepository, never()).save(any());
        verifyNoInteractions(passwordEncoder);
    }

    private DemoUsersInitializer initializer() {
        DemoUserProperties properties = new DemoUserProperties(List.of(
                new DemoUserProperties.Account(" Alice ", "AliceDemo123!"),
                new DemoUserProperties.Account("bob", "BobDemo1234!")));
        return new DemoUsersInitializer(appUserRepository, passwordEncoder, properties);
    }
}
