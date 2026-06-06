package com.woodcert.auction.core.config;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BruteForcePropertiesTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void rejectsNonPositiveConfigurationValues() {
        BruteForceProperties properties = new BruteForceProperties();
        properties.setMaxAttempts(0);
        properties.setLockDurationSeconds(0);

        assertEquals(2, validator.validate(properties).size());
    }
}
