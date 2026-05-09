package com.woodcert.auction.feature.auction.service.policy;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.auction.dto.request.CreateAuctionSessionReq;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuctionPolicyTest {

    private final AuctionPolicy policy = new AuctionPolicy();
    private final Instant now = Instant.parse("2026-05-01T09:00:00Z");

    @Test
    void validateCreateRequest_acceptsBoundaryValues() {
        CreateAuctionSessionReq request = request(
                new BigDecimal("10000000"),
                new BigDecimal("10000000"),
                new BigDecimal("100000"),
                new BigDecimal("5000000"),
                now.plusSeconds(300),
                now.plusSeconds(3900));

        assertThatCode(() -> policy.validateCreateRequest(request, now)).doesNotThrowAnyException();
    }

    @Test
    void validateCreateRequest_rejectsReserveBelowStartingPrice() {
        assertError(
                request(new BigDecimal("10000000"), new BigDecimal("9999999"), new BigDecimal("100000"),
                        new BigDecimal("1000000"), now.plusSeconds(3600), now.plusSeconds(7200)),
                ErrorCode.AUCTION_RESERVE_PRICE_INVALID);
    }

    @Test
    void validateCreateRequest_rejectsStepBelowMinimum() {
        assertError(
                request(new BigDecimal("10000000"), new BigDecimal("10000000"), new BigDecimal("99999"),
                        new BigDecimal("1000000"), now.plusSeconds(3600), now.plusSeconds(7200)),
                ErrorCode.AUCTION_STEP_PRICE_TOO_LOW);
    }

    @Test
    void validateCreateRequest_rejectsDepositBelowMinimum() {
        assertError(
                request(new BigDecimal("10000000"), new BigDecimal("10000000"), new BigDecimal("100000"),
                        new BigDecimal("999999"), now.plusSeconds(3600), now.plusSeconds(7200)),
                ErrorCode.AUCTION_DEPOSIT_AMOUNT_INVALID);
    }

    @Test
    void validateCreateRequest_rejectsDepositAboveHalfOfStartingPrice() {
        assertError(
                request(new BigDecimal("10000000"), new BigDecimal("10000000"), new BigDecimal("100000"),
                        new BigDecimal("5000001"), now.plusSeconds(3600), now.plusSeconds(7200)),
                ErrorCode.AUCTION_DEPOSIT_AMOUNT_INVALID);
    }

    @Test
    void validateCreateRequest_rejectsStartTimeTooSoon() {
        assertError(
                request(new BigDecimal("10000000"), new BigDecimal("10000000"), new BigDecimal("100000"),
                        new BigDecimal("1000000"), now.plusSeconds(299), now.plusSeconds(7200)),
                ErrorCode.AUCTION_START_TIME_TOO_SOON);
    }

    @Test
    void validateCreateRequest_rejectsDurationBelowMinimum() {
        assertError(
                request(new BigDecimal("10000000"), new BigDecimal("10000000"), new BigDecimal("100000"),
                        new BigDecimal("1000000"), now.plusSeconds(3600), now.plusSeconds(7199)),
                ErrorCode.AUCTION_INVALID_TIME_RANGE);
    }

    @Test
    void validateCreateRequest_rejectsDurationAboveMaximum() {
        Instant startTime = now.plusSeconds(3600);
        assertError(
                request(new BigDecimal("10000000"), new BigDecimal("10000000"), new BigDecimal("100000"),
                        new BigDecimal("1000000"), startTime, startTime.plusSeconds(30L * 24 * 60 * 60 + 1)),
                ErrorCode.AUCTION_INVALID_TIME_RANGE);
    }

    private void assertError(CreateAuctionSessionReq request, ErrorCode errorCode) {
        assertThatThrownBy(() -> policy.validateCreateRequest(request, now))
                .isInstanceOf(AppException.class)
                .satisfies(throwable -> assertThat(((AppException) throwable).getErrorCode()).isEqualTo(errorCode));
    }

    private CreateAuctionSessionReq request(BigDecimal startingPrice, BigDecimal reservePrice,
                                            BigDecimal stepPrice, BigDecimal depositAmount,
                                            Instant startTime, Instant endTime) {
        return new CreateAuctionSessionReq(1L, startingPrice, reservePrice, stepPrice, depositAmount, startTime, endTime);
    }
}
