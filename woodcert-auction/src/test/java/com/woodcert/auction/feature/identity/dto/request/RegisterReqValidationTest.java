package com.woodcert.auction.feature.identity.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;

class RegisterReqValidationTest {

    private final Validator validator;

    RegisterReqValidationTest() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        this.validator = factory.getValidator();
    }

    @Test
    void phoneNumber_isRequiredForRegister() {
        RegisterReq request = new RegisterReq(
                "user@example.com",
                "Password123",
                "Nguyen Van A",
                null
        );

        Set<ConstraintViolation<RegisterReq>> violations = validator.validate(request);

        assertTrue(
                violations.stream().anyMatch(v ->
                        "phoneNumber".equals(v.getPropertyPath().toString())
                                && "Phone number is required".equals(v.getMessage())),
                "Expected phoneNumber to be required"
        );
    }
}
