package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.auction.dto.request.CreateAuctionSessionReq;
import com.woodcert.auction.feature.auction.dto.response.AuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionListRes;

public interface AuctionService {

    AuctionDetailRes createAuctionSession(String sellerId, CreateAuctionSessionReq request);

    PaginationResponse<AuctionListRes> getPublicAuctions(int page, int size, String status);

    AuctionDetailRes getPublicAuctionDetail(Long auctionId);

    PaginationResponse<SellerAuctionListRes> getSellerAuctions(String sellerId, int page, int size);

    void cancelAuctionSession(String sellerId, Long auctionId);

    void registerForAuction(String userId, Long auctionId);
}
