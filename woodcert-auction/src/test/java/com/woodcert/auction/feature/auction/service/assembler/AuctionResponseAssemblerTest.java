package com.woodcert.auction.feature.auction.service.assembler;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.service.runtime.AuctionRuntimeSnapshot;
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.ConditionGrade;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.identity.service.SellerSummaryQueryService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AuctionResponseAssemblerTest {

    private final AuctionResponseAssembler assembler = new AuctionResponseAssembler();

    @Test
    void toDetailRes_usesImageHelperAndVerifiedMaterial() {
        Product product = product();
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        AppraisalReport appraisalReport = new AppraisalReport();
        appraisalReport.setProductId(10L);
        appraisalReport.setVerifiedMaterial("Verified wood");
        appraisalReport.setAuthentic(true);
        var seller = new SellerSummaryQueryService.SellerSummary("Seller Store", new BigDecimal("4.80"));

        var result = assembler.toDetailRes(
                session,
                product,
                "primary-url",
                List.of("primary-url", "second-url"),
                appraisalReport,
                seller,
                new AuctionRuntimeSnapshot(new BigDecimal("13000000"), Instant.parse("2026-05-01T13:00:00Z")));

        assertThat(result.currentPrice()).isEqualByComparingTo("13000000");
        assertThat(result.endTime()).isEqualTo(Instant.parse("2026-05-01T13:00:00Z"));
        assertThat(result.product().material()).isEqualTo("Verified wood");
        assertThat(result.product().primaryImage()).isEqualTo("primary-url");
        assertThat(result.product().images()).containsExactly("primary-url", "second-url");
        assertThat(result.seller().storeName()).isEqualTo("Seller Store");
    }

    @Test
    void toDetailRes_fallsBackToProductMaterialAndDbSnapshot() {
        Product product = product();
        AuctionSession session = session(AuctionSessionStatus.WAITING);

        var result = assembler.toDetailRes(
                session,
                product,
                null,
                List.of(),
                null,
                null,
                AuctionRuntimeSnapshot.empty());

        assertThat(result.currentPrice()).isEqualByComparingTo("10000000");
        assertThat(result.endTime()).isEqualTo(session.getEndTime());
        assertThat(result.product().material()).isEqualTo("Product material");
        assertThat(result.seller()).isNull();
    }

    @Test
    void toListRes_appliesRuntimeOverlayWhenPresent() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        AppraisalReport appraisalReport = new AppraisalReport();
        appraisalReport.setProductId(10L);
        appraisalReport.setVerifiedMaterial("Verified rosewood");
        appraisalReport.setConditionGrade(ConditionGrade.EXCELLENT);
        appraisalReport.setCertificateCode("WC-2026-001");
        appraisalReport.setAuthentic(true);
        appraisalReport.setSellerAccuracy(new BigDecimal("4.75"));
        var seller = new SellerSummaryQueryService.SellerSummary("Seller Store", new BigDecimal("4.80"));

        var result = assembler.toListRes(
                session,
                product(),
                "primary-url",
                "Fine sculpture",
                appraisalReport,
                seller,
                2L,
                new AuctionRuntimeSnapshot(new BigDecimal("14000000"), Instant.parse("2026-05-01T14:00:00Z")));

        assertThat(result.currentPrice()).isEqualByComparingTo("14000000");
        assertThat(result.endTime()).isEqualTo(Instant.parse("2026-05-01T14:00:00Z"));
        assertThat(result.totalParticipants()).isEqualTo(2L);
        assertThat(result.product().material()).isEqualTo("Verified rosewood");
        assertThat(result.product().categoryName()).isEqualTo("Fine sculpture");
        assertThat(result.product().conditionGrade()).isEqualTo(ConditionGrade.EXCELLENT);
        assertThat(result.product().certificateCode()).isEqualTo("WC-2026-001");
        assertThat(result.product().isAuthentic()).isTrue();
        assertThat(result.product().sellerAccuracy()).isEqualByComparingTo("4.75");
        assertThat(result.seller().name()).isEqualTo("Seller Store");
        assertThat(result.seller().reputationScore()).isEqualByComparingTo("4.80");
    }

    private Product product() {
        Product product = new Product();
        product.setId(10L);
        product.setSellerId("seller-1");
        product.setTitle("Wood statue");
        product.setMaterial("Product material");
        return product;
    }

    private AuctionSession session(AuctionSessionStatus status) {
        AuctionSession session = new AuctionSession();
        session.setId(20L);
        session.setProductId(10L);
        session.setStatus(status);
        session.setStartingPrice(new BigDecimal("10000000"));
        session.setCurrentPrice(new BigDecimal("10000000"));
        session.setStepPrice(new BigDecimal("100000"));
        session.setDepositAmount(new BigDecimal("1000000"));
        session.setStartTime(Instant.parse("2026-05-01T10:00:00Z"));
        session.setEndTime(Instant.parse("2026-05-01T12:00:00Z"));
        return session;
    }
}
