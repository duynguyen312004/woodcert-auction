package com.woodcert.auction.feature.media.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class CloudinaryHttpClientConfig {

    @Bean("cloudinaryRestClient")
    public RestClient cloudinaryRestClient(RestClient.Builder builder) {
        return builder.build();
    }
}
