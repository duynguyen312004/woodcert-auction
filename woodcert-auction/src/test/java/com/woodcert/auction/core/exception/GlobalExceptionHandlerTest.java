package com.woodcert.auction.core.exception;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleAppException_includesMachineReadableErrorCode() {
        var response = handler.handleAppException(new AppException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errorCode()).isEqualTo("PASSWORD_RESET_TOKEN_INVALID");
    }
}
