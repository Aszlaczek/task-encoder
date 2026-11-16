package com.adrianwzorek.taskencoder.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@ExtendWith(MockitoExtension.class)
class AppUserDetailsServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Test
    void loadsUserByNormalizedUsername() {
        AppUser user = new AppUser("alice", "hash");
        when(appUserRepository.findByUsername("alice")).thenReturn(Optional.of(user));

        var details = new AppUserDetailsService(appUserRepository).loadUserByUsername("  ALICE  ");

        assertThat(details.getUsername()).isEqualTo("alice");
        assertThat(details.getPassword()).isEqualTo("hash");
        assertThat(details.isEnabled()).isTrue();
        assertThat(details.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_USER");
    }

    @Test
    void throwsWhenUserDoesNotExist() {
        when(appUserRepository.findByUsername("nobody")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> new AppUserDetailsService(appUserRepository).loadUserByUsername("nobody"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void rejectsBlankUsernameWithoutQueryingRepository() {
        assertThatThrownBy(() -> new AppUserDetailsService(appUserRepository).loadUserByUsername("   "))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void normalizesUsername() {
        assertThat(AppUserDetailsService.normalize("  ALICE ")).isEqualTo("alice");
        assertThat(AppUserDetailsService.normalize(null)).isEmpty();
    }
}
