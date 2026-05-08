package com.woodcert.auction.feature.auction.service.policy;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.auction.dto.request.CreateAuctionSessionReq;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Component
public class AuctionPolicy {

    private static final BigDecimal MIN_STEP_PRICE = new BigDecimal("100000");
    private static final BigDecimal MIN_DEPOSIT_AMOUNT = new BigDecimal("1000000");
    private static final BigDecimal MAX_DEPOSIT_RATIO = new BigDecimal("0.50");
    private static final Duration MIN_START_LEAD_TIME = Duration.ofMinutes(5);
    private static final Duration MIN_AUCTION_DURATION = Duration.ofHours(1);
    private static final Duration MAX_AUCTION_DURATION = Duration.ofDays(30);

    private static final List<AuctionSessionStatus> DEFAULT_PUBLIC_STATUSES = List.of(
            AuctionSessionStatus.WAITING,
            AuctionSessionStatus.ACTIVE);
    private static final Set<AuctionSessionStatus> ALLOWED_PUBLIC_STATUSES = EnumSet.of(
            AuctionSessionStatus.WAITING,
            AuctionSessionStatus.ACTIVE,
            AuctionSessionStatus.ENDED_SUCCESS);

    public List<AuctionSessionStatus> defaultPublicStatuses() {
        return DEFAULT_PUBLIC_STATUSES;
    }

    public boolean isPubliclyVisible(AuctionSessionStatus status) {
        return ALLOWED_PUBLIC_STATUSES.contains(status);
    }

    public boolean isRegistrableStatus(AuctionSessionStatus status) {
        return status == AuctionSessionStatus.WAITING || status == AuctionSessionStatus.ACTIVE;
    }

    public void validateOwnedAppraisedProduct(Product product, String sellerId) {
        if (!sellerId.equals(product.getSellerId())) {
            throw new AppException(ErrorCode.AUCTION_PRODUCT_NOT_OWNED);
        }

        if (product.getStatus() != ProductStatus.APPRAISED) {
            throw new AppException(ErrorCode.AUCTION_PRODUCT_NOT_APPRAISED);
        }
    }

    public void validateCreateRequest(CreateAuctionSessionReq request, Instant now) {
        validateTimeRange(request, now);
        validatePriceRules(request);
    }

    public AuctionSessionStatus parsePublicStatus(String rawStatus) {
        try {
            AuctionSessionStatus status = AuctionSessionStatus.valueOf(rawStatus.toUpperCase());
            if (!isPubliclyVisible(status)) {
                throw invalidStatus(rawStatus);
            }
            return status;
        } catch (IllegalArgumentException ex) {
            throw invalidStatus(rawStatus);
        }
    }

    private void validateTimeRange(CreateAuctionSessionReq request, Instant now) {
        Instant minimumStartTime = now.plus(MIN_START_LEAD_TIME);
        if (request.startTime().isBefore(minimumStartTime)) {
            throw new AppException(ErrorCode.AUCTION_START_TIME_TOO_SOON);
        }

        Duration duration = Duration.between(request.startTime(), request.endTime());
        if (duration.compareTo(MIN_AUCTION_DURATION) < 0 || duration.compareTo(MAX_AUCTION_DURATION) > 0) {
            throw new AppException(ErrorCode.AUCTION_INVALID_TIME_RANGE);
        }
    }

    private void validatePriceRules(CreateAuctionSessionReq request) {
        if (request.stepPrice().compareTo(MIN_STEP_PRICE) < 0) {
            throw new AppException(ErrorCode.AUCTION_STEP_PRICE_TOO_LOW);
        }

        if (request.reservePrice().compareTo(request.startingPrice()) < 0) {
            throw new AppException(ErrorCode.AUCTION_RESERVE_PRICE_INVALID);
        }

        BigDecimal maxDeposit = request.startingPrice().multiply(MAX_DEPOSIT_RATIO);
        if (request.depositAmount().compareTo(MIN_DEPOSIT_AMOUNT) < 0
                || request.depositAmount().compareTo(maxDeposit) > 0) {
            throw new AppException(ErrorCode.AUCTION_DEPOSIT_AMOUNT_INVALID);
        }
    }

    private AppException invalidStatus(String rawStatus) {
        return new AppException(ErrorCode.INVALID_REQUEST, "Invalid auction status: " + rawStatus);
    }
}
