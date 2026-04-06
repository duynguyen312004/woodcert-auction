package com.woodcert.auction.feature.identity.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.identity.dto.request.CreateSellerProfileReq;
import com.woodcert.auction.feature.identity.dto.response.SellerProfileRes;
import com.woodcert.auction.feature.identity.service.SellerProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/seller-profile")
@RequiredArgsConstructor
public class SellerProfileController {

    private final SellerProfileService sellerProfileService;

    @GetMapping
    public ResponseEntity<ApiResponse<SellerProfileRes>> getCurrentSellerProfile(
            @CurrentUserId String userId) {
        SellerProfileRes sellerProfile = sellerProfileService.getCurrentSellerProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(sellerProfile, "Fetch seller profile successful"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SellerProfileRes>> createSellerProfile(
            @CurrentUserId String userId,
            @RequestBody @Valid CreateSellerProfileReq request) {
        SellerProfileRes sellerProfile = sellerProfileService.createSellerProfile(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(sellerProfile, "Seller profile created. Please re-login to update roles."));
    }
}
