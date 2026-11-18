package com.adrianwzorek.taskencoder;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
@OpenAPIDefinition(
        info = @Info(
                title = "Task Encoder API",
                version = "0.1.0",
                description = """
                        Demonstracyjny API szyfrowania wiadomości AES-256-GCM. \
                        Operacje wymagają sesji serwerowej (cookie JSESSIONID); mutacje dodatkowo \
                        wymagają nagłówka X-XSRF-TOKEN zgodnego z cookie XSRF-TOKEN. \
                        Aplikacja nie jest E2EE — backend posiada klucz i widzi tekst jawny.
                        """))
public class TaskEncoderApplication {

    public static void main(String[] args) {
        SpringApplication.run(TaskEncoderApplication.class, args);
    }
}
