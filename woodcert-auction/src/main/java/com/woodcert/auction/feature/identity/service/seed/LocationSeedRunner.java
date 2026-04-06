package com.woodcert.auction.feature.identity.service.seed;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LocationSeedRunner implements ApplicationRunner {

    private final LocationSeedService locationSeedService;

    @Override
    public void run(ApplicationArguments args) {
        locationSeedService.seedIfEmpty();
    }
}
