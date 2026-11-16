package com.adrianwzorek.taskencoder.auth;

import java.util.Locale;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final AppUserRepository appUserRepository;

    public AppUserDetailsService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) {
        String normalized = normalize(username);
        if (normalized.isEmpty()) {
            throw new UsernameNotFoundException("Nie znaleziono użytkownika.");
        }

        return appUserRepository.findByUsername(normalized)
                .map(AppUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("Nie znaleziono użytkownika."));
    }

    public static String normalize(String username) {
        if (username == null) {
            return "";
        }
        return username.strip().toLowerCase(Locale.ROOT);
    }
}
