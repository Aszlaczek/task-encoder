package com.adrianwzorek.taskencoder.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tworzy konta demonstracyjne tylko w profilu `local`. Seed jest idempotentny i nigdy nie
 * nadpisuje hasła istniejącego konta.
 */
@Component
@Profile("local")
public class DemoUsersInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoUsersInitializer.class);

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final DemoUserProperties properties;

    public DemoUsersInitializer(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            DemoUserProperties properties) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (DemoUserProperties.Account account : properties.accounts()) {
            String username = AppUserDetailsService.normalize(account.username());
            if (username.isEmpty() || account.password() == null || account.password().isBlank()) {
                log.warn("Pominięto konto demonstracyjne z pustym loginem lub hasłem.");
                continue;
            }
            if (appUserRepository.existsByUsername(username)) {
                log.info("Konto demonstracyjne '{}' już istnieje — pomijam.", username);
                continue;
            }

            appUserRepository.save(new AppUser(username, passwordEncoder.encode(account.password())));
            log.info("Utworzono konto demonstracyjne '{}'.", username);
        }
    }
}
