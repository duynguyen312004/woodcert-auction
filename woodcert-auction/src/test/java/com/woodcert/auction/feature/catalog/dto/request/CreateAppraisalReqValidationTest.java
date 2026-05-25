package com.woodcert.auction.feature.catalog.dto.request;

import com.woodcert.auction.feature.catalog.entity.ConditionGrade;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class CreateAppraisalReqValidationTest {

    private final Validator validator;

    CreateAppraisalReqValidationTest() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        this.validator = factory.getValidator();
    }

    @Test
    void sellerAccuracy_isRequired() {
        CreateAppraisalReq request = validRequest(null);

        var violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "sellerAccuracy".equals(v.getPropertyPath().toString())
                        && "Seller accuracy is required".equals(v.getMessage()));
    }

    @Test
    void sellerAccuracy_mustBeAtLeastOne() {
        CreateAppraisalReq request = validRequest(new BigDecimal("0.9"));

        var violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "sellerAccuracy".equals(v.getPropertyPath().toString())
                        && "Seller accuracy must be between 1 and 5".equals(v.getMessage()));
    }

    @Test
    void sellerAccuracy_mustBeAtMostFive() {
        CreateAppraisalReq request = validRequest(new BigDecimal("5.1"));

        var violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "sellerAccuracy".equals(v.getPropertyPath().toString())
                        && "Seller accuracy must be between 1 and 5".equals(v.getMessage()));
    }

    private CreateAppraisalReq validRequest(BigDecimal sellerAccuracy) {
        return new CreateAppraisalReq(
                true,
                "Dalbergia tonkinensis",
                "Vietnam",
                "50-80 years",
                ConditionGrade.EXCELLENT,
                new BigDecimal("15000000"),
                "Genuine product.",
                sellerAccuracy,
                null
        );
    }
}
