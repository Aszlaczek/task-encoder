package com.adrianwzorek.taskencoder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class TaskEncoderApplication {

    public static void main(String[] args) {
        SpringApplication.run(TaskEncoderApplication.class, args);
    }
}
