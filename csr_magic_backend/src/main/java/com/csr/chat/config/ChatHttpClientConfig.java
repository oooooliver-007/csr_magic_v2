package com.csr.chat.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * ChatService 调用 csr_ai_service 使用的 RestTemplate：
 * 必须配置 connect / read timeout，防止 AI 服务不可用时拖垮 Tomcat 线程池。
 */
@Configuration
public class ChatHttpClientConfig {

    @Bean("chatAiRestTemplate")
    public RestTemplate chatAiRestTemplate(RestTemplateBuilder builder) {
        return builder
            .requestFactory(SimpleClientHttpRequestFactory.class)
            .connectTimeout(Duration.ofSeconds(3))
            .readTimeout(Duration.ofSeconds(15))
            .build();
    }
}
