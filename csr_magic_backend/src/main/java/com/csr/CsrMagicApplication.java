package com.csr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CsrMagicApplication {

    public static void main(String[] args) {
        SpringApplication.run(CsrMagicApplication.class, args);
    }
}
