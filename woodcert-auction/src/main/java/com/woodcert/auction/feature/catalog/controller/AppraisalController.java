package com.woodcert.auction.feature.catalog.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.catalog.dto.request.CreateAppraisalReq;
import com.woodcert.auction.feature.catalog.dto.response.AppraisalSubmitRes;
import com.woodcert.auction.feature.catalog.service.AppraisalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Appraisal operations controller.
 * Media upload endpoints have been moved to {@link AppraisalMediaController}.
 *
 * <p>Note: Pending products list is available via
 * {@code GET /api/v1/products?status=PENDING_APPRAISAL} for appraisers
 * (handled by {@link ProductController#getCatalogProducts}).</p>
 */
@RestController
@RequiredArgsConstructor
public class AppraisalController {

    private final AppraisalService appraisalService;

    /**
     * Appraiser: Submit appraisal report for a product.
     * AppraisalReport is immutable once submitted — no update/delete endpoints exist.
     */
    @PostMapping("/api/v1/products/{id}/appraise")
    @PreAuthorize("hasAuthority('APPROVE_PRODUCT')")
    public ResponseEntity<ApiResponse<AppraisalSubmitRes>> submitAppraisal(
            @CurrentUserId String userId,
            @PathVariable Long id,
            @RequestBody @Valid CreateAppraisalReq request) {
        AppraisalSubmitRes result = appraisalService.submitAppraisal(userId, id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(result, "Appraisal report created successfully"));
    }
}
