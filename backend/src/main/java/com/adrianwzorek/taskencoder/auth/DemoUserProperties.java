package com.adrianwzorek.taskencoder.auth;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Konta demonstracyjne ładowane wyłącznie z profilu `local`.
 */
@ConfigurationProperties(prefix = "app.demo-users")
public record DemoUserProperties(List<Account> accounts) {

    public DemoUserProperties {
        accounts = accounts == null ? List.of() : List.copyOf(accounts);
    }

    public record Account(String username, String password) {
    }
}
