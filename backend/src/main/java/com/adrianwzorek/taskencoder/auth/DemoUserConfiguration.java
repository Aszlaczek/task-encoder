package com.adrianwzorek.taskencoder.auth;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@Configuration
@Profile("local")
@EnableConfigurationProperties(DemoUserProperties.class)
public class DemoUserConfiguration {
}
