package com.woodcert.auction.feature.auction.service.assembler;

import com.woodcert.auction.feature.auction.dto.response.AuctionAppraisalRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionProductSummaryRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionListRes;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.service.runtime.AuctionRuntimeSnapshot;
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.identity.service.SellerSummaryQueryService;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Component
public class AuctionResponseAssembler {

    public AuctionListRes toListRes(
            AuctionSession session,
            Product product,
            String primaryImage,
            String categoryName,
            AppraisalReport appraisalReport,
            SellerSummaryQueryService.SellerSummary sellerSummary,
            long participantCount,
            AuctionRuntimeSnapshot snapshot) {
        AuctionListRes.ProductSummary productSummary = product != null
                ? AuctionListRes.ProductSummary.fromEntity(product, primaryImage, categoryName, appraisalReport)
                : null;

        return new AuctionListRes(
                session.getId(),
                productSummary,
                session.getStartingPrice(),
                currentPrice(session, snapshot),
                session.getDepositAmount(),
                session.getStartTime(),
                endTime(session, snapshot),
                session.getStatus(),
                participantCount,
                buildListSellerSummary(sellerSummary)
        );
    }

    public SellerAuctionListRes toSellerListRes(
            AuctionSession session,
            String productTitle,
            String imageUrl,
            long participantCount,
            AuctionRuntimeSnapshot snapshot) {
        return new SellerAuctionListRes(
                session.getId(),
                productTitle,
                session.getProductId(),
                session.getStatus(),
                session.getStartingPrice(),
                session.getDepositAmount(),
                session.getStartTime(),
                endTime(session, snapshot),
                currentPrice(session, snapshot),
                participantCount,
                imageUrl,
                session.getCreatedAt()
        );
    }

    public AuctionDetailRes toDetailRes(
            AuctionSession session,
            Product product,
            String primaryImage,
            List<String> imageUrls,
            AppraisalReport appraisalReport,
            SellerSummaryQueryService.SellerSummary sellerSummary,
            AuctionRuntimeSnapshot snapshot,
            String highestBidderMaskedAlias) {
        AuctionAppraisalRes appraisalRes = AuctionAppraisalRes.fromEntity(appraisalReport);

        String publicMaterial = appraisalReport != null && appraisalReport.getVerifiedMaterial() != null
                ? appraisalReport.getVerifiedMaterial()
                : product.getMaterial();

        AuctionProductSummaryRes productSummary = AuctionProductSummaryRes.fromEntity(
                product,
                publicMaterial,
                primaryImage,
                imageUrls,
                appraisalRes);

        return new AuctionDetailRes(
                session.getId(),
                session.getStatus(),
                session.getStartingPrice(),
                currentPrice(session, snapshot),
                session.getStepPrice(),
                session.getDepositAmount(),
                session.getStartTime(),
                endTime(session, snapshot),
                productSummary,
                buildSellerSummary(sellerSummary),
                highestBidderMaskedAlias
        );
    }

    public SellerAuctionDetailRes toSellerDetailRes(
            AuctionSession session,
            Product product,
            String primaryImage,
            List<String> imageUrls,
            AppraisalReport appraisalReport,
            long participantCount,
            SellerAuctionDetailRes.SettlementSummary settlement,
            SellerAuctionDetailRes.SellerAuctionSettlementStatus settlementStatus,
            String winnerMaskedAlias,
            AuctionRuntimeSnapshot snapshot) {
        AuctionAppraisalRes appraisalRes = AuctionAppraisalRes.fromEntity(appraisalReport);
        String publicMaterial = appraisalReport != null && appraisalReport.getVerifiedMaterial() != null
                ? appraisalReport.getVerifiedMaterial()
                : product.getMaterial();
        AuctionProductSummaryRes productSummary = AuctionProductSummaryRes.fromEntity(
                product,
                publicMaterial,
                primaryImage,
                imageUrls,
                appraisalRes);
        BigDecimal currentPrice = currentPrice(session, snapshot);

        return new SellerAuctionDetailRes(
                session.getId(),
                session.getStatus(),
                session.getStartingPrice(),
                session.getReservePrice(),
                session.getStepPrice(),
                session.getDepositAmount(),
                currentPrice,
                isTerminal(session.getStatus()) ? currentPrice : null,
                session.getStartTime(),
                endTime(session, snapshot),
                participantCount,
                winnerMaskedAlias,
                settlementStatus,
                settlement,
                productSummary,
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }

    private BigDecimal currentPrice(AuctionSession session, AuctionRuntimeSnapshot snapshot) {
        return snapshot != null && snapshot.currentPrice() != null
                ? snapshot.currentPrice()
                : session.getCurrentPrice();
    }

    private Instant endTime(AuctionSession session, AuctionRuntimeSnapshot snapshot) {
        return snapshot != null && snapshot.endTime() != null
                ? snapshot.endTime()
                : session.getEndTime();
    }

    private boolean isTerminal(AuctionSessionStatus status) {
        return status == AuctionSessionStatus.ENDED_SUCCESS || status == AuctionSessionStatus.ENDED_FAILED;
    }

    private AuctionDetailRes.SellerSummary buildSellerSummary(SellerSummaryQueryService.SellerSummary sellerSummary) {
        if (sellerSummary == null) {
            return null;
        }

        return new AuctionDetailRes.SellerSummary(
                sellerSummary.displayName(),
                sellerSummary.reputationScore());
    }

    private AuctionListRes.SellerSummary buildListSellerSummary(SellerSummaryQueryService.SellerSummary sellerSummary) {
        if (sellerSummary == null) {
            return null;
        }

        return new AuctionListRes.SellerSummary(
                sellerSummary.displayName(),
                sellerSummary.reputationScore());
    }
}
