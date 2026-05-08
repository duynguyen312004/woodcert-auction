package com.woodcert.auction.feature.auction.service.assembler;

import com.woodcert.auction.feature.auction.dto.response.AuctionAppraisalRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionProductSummaryRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionListRes;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.service.runtime.AuctionRuntimeSnapshot;
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.repository.AppraisalReportRepository;
import com.woodcert.auction.feature.catalog.service.ProductImageHelper;
import com.woodcert.auction.feature.identity.entity.SellerProfile;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AuctionResponseAssembler {

    private final ProductImageHelper productImageHelper;
    private final AppraisalReportRepository appraisalReportRepository;
    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;

    public AuctionListRes toListRes(
            AuctionSession session,
            Product product,
            String primaryImage,
            long participantCount,
            AuctionRuntimeSnapshot snapshot) {
        AuctionListRes.ProductSummary productSummary = product != null
                ? AuctionListRes.ProductSummary.fromEntity(product, primaryImage)
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
                participantCount
        );
    }

    public SellerAuctionListRes toSellerListRes(
            AuctionSession session,
            String productTitle,
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
                session.getCreatedAt()
        );
    }

    public AuctionDetailRes toDetailRes(
            AuctionSession session,
            Product product,
            AuctionRuntimeSnapshot snapshot) {
        String primaryImage = productImageHelper.findPrimaryImageUrl(product);
        List<String> imageUrls = productImageHelper.findImageUrls(product);

        AppraisalReport appraisalReport = appraisalReportRepository.findByProductId(product.getId()).orElse(null);
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

        User seller = userRepository.findById(product.getSellerId()).orElse(null);
        SellerProfile sellerProfile = sellerProfileRepository.findById(product.getSellerId()).orElse(null);

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
                buildSellerSummary(seller, sellerProfile)
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

    private AuctionDetailRes.SellerSummary buildSellerSummary(User seller, SellerProfile profile) {
        if (seller == null && profile == null) {
            return null;
        }

        String storeName = profile != null
                ? profile.getStoreName()
                : Optional.ofNullable(seller).map(User::getFullName).orElse(null);
        BigDecimal reputationScore = profile != null ? profile.getReputationScore() : null;
        return new AuctionDetailRes.SellerSummary(storeName, reputationScore);
    }
}
