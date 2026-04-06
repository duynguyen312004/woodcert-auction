package com.woodcert.auction.feature.identity.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.identity.dto.request.CreateAddressReq;
import com.woodcert.auction.feature.identity.dto.response.AddressRes;
import com.woodcert.auction.feature.identity.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AddressRes>>> getAddresses(
            @CurrentUserId String userId) {
        List<AddressRes> addresses = addressService.getCurrentUserAddresses(userId);
        return ResponseEntity.ok(ApiResponse.success(addresses, "Fetch addresses successful"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AddressRes>> createAddress(
            @CurrentUserId String userId,
            @RequestBody @Valid CreateAddressReq request) {
        AddressRes address = addressService.createAddress(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(address, "Address created successfully"));
    }
}
