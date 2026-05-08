package com.woodcert.auction.feature.auction.service.assembler;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.service.runtime.AuctionRuntimeSnapshot;
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.repository.AppraisalReportRepository;
import com.woodcert.auction.feature.catalog.service.ProductImageHelper;
import com.woodcert.auction.feature.identity.entity.SellerProfile;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuctionResponseAssemblerTest {

    @Mock
    private ProductImageHelper productImageHelper;
    @Mock
    private AppraisalReportRepository appraisalReportRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @InjectMocks
    private AuctionResponseAssembler assembler;

    @Test
    void toDetailRes_usesImageHelperAndVerifiedMaterial() {
        Product product = product();
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);
        AppraisalReport appraisalReport = new AppraisalReport();
        appraisalReport.setProductId(10L);
        appraisalReport.setVerifiedMaterial("Verified wood");
        appraisalReport.setAuthentic(true);
        User seller = new User();
        seller.setId("seller-1");
        seller.setFullName("Seller Name");
        SellerProfile profile = new SellerProfile();
        profile.setUserId("seller-1");
        profile.setStoreName("Seller Store");
        profile.setReputationScore(new BigDecimal("4.80"));

        when(productImageHelper.findPrimaryImageUrl(product)).thenReturn("primary-url");
        when(productImageHelper.findImageUrls(product)).thenReturn(List.of("primary-url", "second-url"));
        when(appraisalReportRepository.findByProductId(10L)).thenReturn(Optional.of(appraisalReport));
        when(userRepository.findById("seller-1")).thenReturn(Optional.of(seller));
        when(sellerProfileRepository.findById("seller-1")).thenReturn(Optional.of(profile));

        var result = assembler.toDetailRes(
                session,
                product,
                new AuctionRuntimeSnapshot(new BigDecimal("13000000"), Instant.parse("2026-05-01T13:00:00Z")));

        assertThat(result.currentPrice()).isEqualByComparingTo("13000000");
        assertThat(result.endTime()).isEqualTo(Instant.parse("2026-05-01T13:00:00Z"));
        assertThat(result.product().material()).isEqualTo("Verified wood");
        assertThat(result.product().primaryImage()).isEqualTo("primary-url");
        assertThat(result.product().images()).containsExactly("primary-url", "second-url");
        assertThat(result.seller().storeName()).isEqualTo("Seller Store");
        verify(productImageHelper).findPrimaryImageUrl(product);
        verify(productImageHelper).findImageUrls(product);
    }

    @Test
    void toDetailRes_fallsBackToProductMaterialAndDbSnapshot() {
        Product product = product();
        AuctionSession session = session(AuctionSessionStatus.WAITING);
        when(productImageHelper.findPrimaryImageUrl(product)).thenReturn(null);
        when(productImageHelper.findImageUrls(product)).thenReturn(List.of());
        when(appraisalReportRepository.findByProductId(10L)).thenReturn(Optional.empty());
        when(userRepository.findById("seller-1")).thenReturn(Optional.empty());
        when(sellerProfileRepository.findById("seller-1")).thenReturn(Optional.empty());

        var result = assembler.toDetailRes(session, product, AuctionRuntimeSnapshot.empty());

        assertThat(result.currentPrice()).isEqualByComparingTo("10000000");
        assertThat(result.endTime()).isEqualTo(session.getEndTime());
        assertThat(result.product().material()).isEqualTo("Product material");
        assertThat(result.seller()).isNull();
    }

    @Test
    void toListRes_appliesRuntimeOverlayWhenPresent() {
        AuctionSession session = session(AuctionSessionStatus.ACTIVE);

        var result = assembler.toListRes(
                session,
                product(),
                "primary-url",
                2L,
                new AuctionRuntimeSnapshot(new BigDecimal("14000000"), Instant.parse("2026-05-01T14:00:00Z")));

        assertThat(result.currentPrice()).isEqualByComparingTo("14000000");
        assertThat(result.endTime()).isEqualTo(Instant.parse("2026-05-01T14:00:00Z"));
        assertThat(result.totalParticipants()).isEqualTo(2L);
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
