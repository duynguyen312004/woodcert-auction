package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.auction.dto.request.CreateAuctionSessionReq;
import com.woodcert.auction.feature.auction.dto.response.AuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionListRes;
import com.woodcert.auction.feature.auction.service.command.AuctionCommandService;
import com.woodcert.auction.feature.auction.service.query.AuctionQueryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuctionServiceImplTest {

    @Mock
    private AuctionCommandService commandService;
    @Mock
    private AuctionQueryService queryService;

    @InjectMocks
    private AuctionServiceImpl auctionService;

    @Test
    void createAuctionSession_delegatesToCommandService() {
        CreateAuctionSessionReq request = validRequest();
        AuctionDetailRes expected = detailRes();
        when(commandService.createAuctionSession("seller-1", request)).thenReturn(expected);

        AuctionDetailRes result = auctionService.createAuctionSession("seller-1", request);

        assertThat(result).isSameAs(expected);
        verify(commandService).createAuctionSession("seller-1", request);
    }

    @Test
    void getPublicAuctions_delegatesToQueryService() {
        PaginationResponse<AuctionListRes> expected = new PaginationResponse<>(
                new PaginationResponse.Meta(1, 10, 0, 0),
                List.of());
        when(queryService.getPublicAuctions(1, 10, null)).thenReturn(expected);

        var result = auctionService.getPublicAuctions(1, 10, null);

        assertThat(result).isSameAs(expected);
        verify(queryService).getPublicAuctions(1, 10, null);
    }

    @Test
    void getPublicAuctionDetail_delegatesToQueryService() {
        AuctionDetailRes expected = detailRes();
        when(queryService.getPublicAuctionDetail(10L)).thenReturn(expected);

        AuctionDetailRes result = auctionService.getPublicAuctionDetail(10L);

        assertThat(result).isSameAs(expected);
        verify(queryService).getPublicAuctionDetail(10L);
    }

    @Test
    void getSellerAuctions_delegatesToQueryService() {
        PaginationResponse<SellerAuctionListRes> expected = new PaginationResponse<>(
                new PaginationResponse.Meta(1, 10, 0, 0),
                List.of());
        when(queryService.getSellerAuctions("seller-1", 1, 10)).thenReturn(expected);

        var result = auctionService.getSellerAuctions("seller-1", 1, 10);

        assertThat(result).isSameAs(expected);
        verify(queryService).getSellerAuctions("seller-1", 1, 10);
    }

    @Test
    void cancelAuctionSession_delegatesToCommandService() {
        auctionService.cancelAuctionSession("seller-1", 10L);

        verify(commandService).cancelAuctionSession("seller-1", 10L);
    }

    @Test
    void registerForAuction_delegatesToCommandService() {
        auctionService.registerForAuction("bidder-1", 10L);

        verify(commandService).registerForAuction("bidder-1", 10L);
    }

    private CreateAuctionSessionReq validRequest() {
        return new CreateAuctionSessionReq(
                1L,
                new BigDecimal("10000000"),
                new BigDecimal("12000000"),
                new BigDecimal("100000"),
                new BigDecimal("1000000"),
                Instant.now().plusSeconds(3600),
                Instant.now().plusSeconds(7200));
    }

    private AuctionDetailRes detailRes() {
        return new AuctionDetailRes(
                10L,
                null,
                BigDecimal.ONE,
                BigDecimal.ONE,
                BigDecimal.ONE,
                BigDecimal.ONE,
                Instant.now(),
                Instant.now(),
                null,
                null);
    }
}
