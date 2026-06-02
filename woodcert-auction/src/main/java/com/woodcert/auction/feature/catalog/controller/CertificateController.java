package com.woodcert.auction.feature.catalog.controller;

import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.catalog.dto.response.CertificateVerificationRes;
import com.woodcert.auction.feature.catalog.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping("/{certificateCode}")
    public ResponseEntity<ApiResponse<CertificateVerificationRes>> verifyCertificate(
            @PathVariable String certificateCode) {
        return ResponseEntity.ok(ApiResponse.success(
                certificateService.verifyCertificate(certificateCode),
                "Certificate verified successfully"));
    }
}
