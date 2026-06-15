package com.woodcert.auction.feature.dispute.dto.request;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.LongStream;

import static org.assertj.core.api.Assertions.assertThat;

class CreateDisputeMessageReqValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsAtMostTenEvidenceImagesAndTwoThousandCharacters() {
        var request = new CreateDisputeMessageReq(
                "a".repeat(2000),
                LongStream.rangeClosed(1, 10).boxed().toList()
        );

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void rejectsMoreThanTenEvidenceImages() {
        var request = new CreateDisputeMessageReq(
                null,
                LongStream.rangeClosed(1, 11).boxed().toList()
        );

        assertThat(validator.validate(request))
                .extracting("propertyPath")
                .extracting(Object::toString)
                .containsExactly("evidenceMediaIds");
    }

    @Test
    void rejectsContentLongerThanTwoThousandCharacters() {
        var request = new CreateDisputeMessageReq("a".repeat(2001), List.of());

        assertThat(validator.validate(request))
                .extracting("propertyPath")
                .extracting(Object::toString)
                .containsExactly("content");
    }
}
