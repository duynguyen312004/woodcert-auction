package com.woodcert.auction.feature.auction.service.query;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.auction.dto.response.*;
import com.woodcert.auction.feature.auction.entity.*;
import com.woodcert.auction.feature.auction.repository.AuctionParticipantRepository;
import com.woodcert.auction.feature.auction.repository.AuctionSessionRepository;
import com.woodcert.auction.feature.auction.repository.BidRepository;
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.repository.AppraisalReportRepository;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.catalog.service.ProductImageHelper;
import com.woodcert.auction.feature.order.dto.response.OrderSummaryRes;
import com.woodcert.auction.feature.order.entity.OrderSourceType;
import com.woodcert.auction.feature.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BuyerAuctionQueryService {

    private final AuctionParticipantRepository participantRepository;
    private final AuctionSessionRepository auctionSessionRepository;
    private final ProductRepository productRepository;
    private final AppraisalReportRepository appraisalReportRepository;
    private final BidRepository bidRepository;
    private final ProductImageHelper productImageHelper;
    private final OrderService orderService;

    @Transactional(readOnly = true)
    public PaginationResponse<BuyerAuctionListRes> getMyAuctions(
            String userId, int page, int size, String outcomeFilter) {
        List<BuyerAuctionListRes> all = participantRepository.findByUserIdOrderByRegisteredAtDesc(userId).stream()
                .map(participant -> toListRes(userId, participant))
                .filter(item -> matchesFilter(item, outcomeFilter))
                .toList();

        int safeSize = Math.min(Math.max(size, 1), 50);
        int fromIndex = Math.min(Math.max(0, page - 1) * safeSize, all.size());
        int toIndex = Math.min(fromIndex + safeSize, all.size());
        return PaginationResponse.of(new PageImpl<>(
                all.subList(fromIndex, toIndex),
                PageRequest.of(Math.max(0, page - 1), safeSize),
                all.size()));
    }

    @Transactional(readOnly = true)
    public BuyerAuctionDetailRes getMyAuctionDetail(String userId, Long auctionId) {
        AuctionParticipant participant = participantRepository.findByAuctionSessionIdAndUserId(auctionId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_BIDDER_NOT_REGISTERED));
        AuctionSession session = auctionSessionRepository.findByIdWithProduct(auctionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));
        Product product = session.getProduct() != null
                ? session.getProduct()
                : productRepository.findById(session.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        AppraisalReport appraisalReport = appraisalReportRepository.findByProductId(product.getId()).orElse(null);
        OrderSummaryRes order = orderService.findSummaryBySource(OrderSourceType.AUCTION, auctionId);
        String outcomeCode = outcomeCode(userId, session, participant, order);
        long bidCount = bidRepository.countByAuctionSessionIdAndUserIdAndStatus(auctionId, userId, BidStatus.VALID);
        BigDecimal myHighestBid = bidRepository
                .findMaxBidAmountBySessionAndUser(auctionId, userId, BidStatus.VALID)
                .orElse(null);
        AuctionProductSummaryRes productSummary = AuctionProductSummaryRes.fromEntity(
                product,
                appraisalReport != null ? appraisalReport.getVerifiedMaterial() : product.getMaterial(),
                productImageHelper.findPrimaryImageUrl(product),
                productImageHelper.findImageUrls(product),
                AuctionAppraisalRes.fromEntity(appraisalReport));

        return new BuyerAuctionDetailRes(
                session.getId(),
                productSummary,
                session.getStatus().name(),
                session.getStartingPrice(),
                session.getCurrentPrice(),
                participant.getDepositAmount(),
                participant.getDepositStatus().name(),
                outcomeCode,
                outcomeMessage(outcomeCode),
                "WINNER".equals(outcomeCode),
                session.getStartTime(),
                session.getEndTime(),
                participant.getRegisteredAt(),
                maskUserId(session.getHighestBidderId()),
                Math.toIntExact(bidCount),
                myHighestBid,
                order
        );
    }

    @Transactional(readOnly = true)
    public BuyerAuctionStatsRes getMyAuctionStats(String userId) {
        List<BuyerAuctionListRes> all = participantRepository.findByUserIdOrderByRegisteredAtDesc(userId).stream()
                .map(participant -> toListRes(userId, participant))
                .toList();
        return new BuyerAuctionStatsRes(
                all.size(),
                all.stream().filter(item -> "ACTIVE".equals(item.outcomeCode())).count(),
                all.stream().filter(item -> "WINNER".equals(item.outcomeCode())).count(),
                all.stream().filter(item -> "LOSER".equals(item.outcomeCode()) || "ENDED_FAILED".equals(item.outcomeCode())).count(),
                all.stream().filter(item -> "PENDING_SETTLEMENT".equals(item.outcomeCode())).count()
        );
    }

    private BuyerAuctionListRes toListRes(String userId, AuctionParticipant participant) {
        AuctionSession session = auctionSessionRepository.findByIdWithProduct(participant.getAuctionSessionId())
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));
        Product product = session.getProduct();
        OrderSummaryRes order = orderService.findSummaryBySource(OrderSourceType.AUCTION, session.getId());
        String outcomeCode = outcomeCode(userId, session, participant, order);

        return new BuyerAuctionListRes(
                session.getId(),
                product != null ? product.getTitle() : "Phiên đấu giá",
                product != null ? productImageHelper.findPrimaryImageUrl(product) : null,
                session.getStatus().name(),
                session.getCurrentPrice(),
                participant.getDepositAmount(),
                participant.getDepositStatus().name(),
                outcomeCode,
                order != null ? order.status().name() : null,
                session.getStartTime(),
                session.getEndTime(),
                participant.getRegisteredAt()
        );
    }

    private String outcomeCode(
            String userId,
            AuctionSession session,
            AuctionParticipant participant,
            OrderSummaryRes order) {
        if (participant.getDepositStatus() == DepositStatus.WITHDRAWN) {
            return "WITHDRAWN";
        }
        if (session.getStatus() == AuctionSessionStatus.WAITING) {
            return "PENDING";
        }
        if (session.getStatus() == AuctionSessionStatus.ACTIVE) {
            return "ACTIVE";
        }
        if (session.getStatus() == AuctionSessionStatus.ENDED_FAILED || session.getStatus() == AuctionSessionStatus.CANCELED) {
            return "ENDED_FAILED";
        }
        if (session.getStatus() == AuctionSessionStatus.ENDED_SUCCESS) {
            if (userId.equals(session.getHighestBidderId())) {
                return order == null ? "PENDING_SETTLEMENT" : "WINNER";
            }
            if (participant.getDepositStatus() == DepositStatus.REFUNDED) {
                return "LOSER";
            }
            return "PENDING_SETTLEMENT";
        }
        return "NONE";
    }

    private boolean matchesFilter(BuyerAuctionListRes item, String filter) {
        if (filter == null || filter.isBlank() || "ALL".equalsIgnoreCase(filter)) {
            return true;
        }
        String normalized = filter.toUpperCase();
        return switch (normalized) {
            case "WON" -> "WINNER".equals(item.outcomeCode());
            case "LOST" -> "LOSER".equals(item.outcomeCode()) || "ENDED_FAILED".equals(item.outcomeCode());
            case "ACTIVE" -> "ACTIVE".equals(item.outcomeCode());
            case "PENDING" -> "PENDING".equals(item.outcomeCode()) || "PENDING_SETTLEMENT".equals(item.outcomeCode());
            default -> true;
        };
    }

    private String outcomeMessage(String outcomeCode) {
        return switch (outcomeCode) {
            case "WINNER" -> "Bạn đã thắng phiên này. Vui lòng theo dõi trạng thái đơn hàng.";
            case "LOSER" -> "Bạn không thắng phiên này. Tiền cọc đã được hoàn về ví.";
            case "ENDED_FAILED" -> "Phiên kết thúc nhưng không đạt giá sàn.";
            case "PENDING_SETTLEMENT" -> "Hệ thống đang đối soát kết quả.";
            case "ACTIVE" -> "Phiên đang diễn ra.";
            case "PENDING" -> "Phiên đang chờ bắt đầu.";
            case "WITHDRAWN" -> "Bạn đã rút khỏi phiên trước khi bắt đầu và tiền cọc đã được hoàn.";
            default -> "";
        };
    }

    private String maskUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            return null;
        }
        return userId.length() <= 8 ? "****" : userId.substring(0, 4) + "****" + userId.substring(userId.length() - 4);
    }
}
