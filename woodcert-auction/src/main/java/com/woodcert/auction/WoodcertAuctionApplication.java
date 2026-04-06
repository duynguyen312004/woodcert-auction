package com.woodcert.auction;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import com.woodcert.auction.feature.identity.service.seed.LocationSeedProperties;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(LocationSeedProperties.class)
public class WoodcertAuctionApplication {

	public static void main(String[] args) {
		SpringApplication.run(WoodcertAuctionApplication.class, args);
	}

}
