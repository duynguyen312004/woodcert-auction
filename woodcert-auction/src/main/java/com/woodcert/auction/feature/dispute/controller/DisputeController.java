package com.woodcert.auction.feature.dispute.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.dispute.dto.request.CreateDisputeReq;
import com.woodcert.auction.feature.dispute.dto.request.ResolveDisputeReq;
import com.woodcert.auction.feature.dispute.dto.response.DisputeRes;
import com.woodcert.auction.feature.dispute.service.DisputeService;
import com.woodcert.auction.feature.media.dto.request.ConfirmMediaUploadReq;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;

    @PostMapping("/api/v1/disputes/evidence/upload-intent")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MediaUploadIntentRes>> createEvidenceUploadIntent(
            @CurrentUserId String userId,
            @RequestBody @Valid CreateMediaUploadIntentReq request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(
                        disputeService.createEvidenceUploadIntent(userId, request),
                        "Dispute evidence upload intent created successfully"));
    }

    @PutMapping("/api/v1/disputes/evidence/confirm")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> confirmEvidenceUpload(
            @CurrentUserId String userId,
            @RequestBody @Valid ConfirmMediaUploadReq request) {
        disputeService.confirmEvidenceUpload(userId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Dispute evidence confirmed successfully"));
    }

    @PostMapping("/api/v1/orders/{orderId}/disputes")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DisputeRes>> openDispute(
            @CurrentUserId String buyerId,
            @PathVariable Long orderId,
            @RequestBody @Valid CreateDisputeReq request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(
                        disputeService.openDispute(buyerId, orderId, request),
                        "Dispute opened successfully"));
    }

    @GetMapping("/api/v1/orders/{orderId}/disputes/current")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DisputeRes>> getCurrentDispute(
            @CurrentUserId String userId,
            @PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(
                disputeService.getCurrentDispute(userId, orderId),
                "Fetch current dispute successful"));
    }

    @GetMapping("/api/v1/orders/{orderId}/disputes")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DisputeRes>>> getDisputeHistory(
            @CurrentUserId String userId,
            @PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(
                disputeService.getDisputeHistory(userId, orderId),
                "Fetch dispute history successful"));
    }

    @PatchMapping("/api/v1/orders/{orderId}/disputes/{disputeId}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DisputeRes>> cancelDispute(
            @CurrentUserId String userId,
            @PathVariable Long orderId,
            @PathVariable Long disputeId) {
        return ResponseEntity.ok(ApiResponse.success(
                disputeService.cancelDispute(userId, orderId, disputeId),
                "Dispute canceled successfully"));
    }

    @GetMapping("/api/v1/admin/disputes")
    @PreAuthorize("hasAuthority('RESOLVE_DISPUTE')")
    public ResponseEntity<ApiResponse<PaginationResponse<DisputeRes>>> getAdminDisputes(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                disputeService.getAdminDisputes(status, page, size),
                "Fetch disputes successful"));
    }

    @GetMapping("/api/v1/admin/disputes/{id}")
    @PreAuthorize("hasAuthority('RESOLVE_DISPUTE')")
    public ResponseEntity<ApiResponse<DisputeRes>> getAdminDispute(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                disputeService.getAdminDispute(id),
                "Fetch dispute successful"));
    }

    @PatchMapping("/api/v1/admin/disputes/{id}/review")
    @PreAuthorize("hasAuthority('RESOLVE_DISPUTE')")
    public ResponseEntity<ApiResponse<DisputeRes>> markUnderReview(
            @CurrentUserId String adminId,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                disputeService.markUnderReview(adminId, id),
                "Dispute marked under review"));
    }

    @PatchMapping("/api/v1/admin/disputes/{id}/resolve")
    @PreAuthorize("hasAuthority('RESOLVE_DISPUTE')")
    public ResponseEntity<ApiResponse<DisputeRes>> resolveDispute(
            @CurrentUserId String adminId,
            @PathVariable Long id,
            @RequestBody @Valid ResolveDisputeReq request) {
        return ResponseEntity.ok(ApiResponse.success(
                disputeService.resolveDispute(adminId, id, request),
                "Dispute resolved successfully"));
    }
}
