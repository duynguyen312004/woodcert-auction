package com.woodcert.auction.core.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class SystemTimeControllerTest {

    @Test
    void getTime_returnsCurrentServerEpochMillis() {
        SystemTimeController controller = new SystemTimeController();
        long before = Instant.now().toEpochMilli();

        var result = controller.getTime();

        long after = Instant.now().toEpochMilli();
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().data().epochMillis()).isBetween(before, after);
        assertThat(result.getBody().data().serverTime().toEpochMilli())
                .isEqualTo(result.getBody().data().epochMillis());
    }
}
