package com.woodcert.auction.feature.catalog.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.catalog.service.AppraisalService;
import com.woodcert.auction.feature.media.dto.request.ConfirmMediaUploadReq;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;
import com.woodcert.auction.feature.media.service.MediaAssetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Media upload endpoints for appraisal proof images.
 * Separated from AppraisalController to keep appraisal operations focused.
 */
@RestController
@RequestMapping("/api/v1/appraisals/images")
@RequiredArgsConstructor
public class AppraisalMediaController {

    private final AppraisalService appraisalService;
    private final MediaAssetService mediaAssetService;

    /**
     * Appraiser: Create a signed Cloudinary upload intent for an appraisal proof image.
     */
    @PostMapping("/upload-intent")
    @PreAuthorize("hasAuthority('APPROVE_PRODUCT')")
    public ResponseEntity<ApiResponse<MediaUploadIntentRes>> createUploadIntent(
            @CurrentUserId String userId,
            @RequestBody @Valid CreateMediaUploadIntentReq request) {
        MediaUploadIntentRes intent = appraisalService.createAppraisalImageUploadIntent(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(intent, "Appraisal image upload intent created successfully"));
    }

    /**
     * Appraiser: Confirm an appraisal proof image upload after client-side Cloudinary upload.
     */
    @PutMapping("/confirm")
    @PreAuthorize("hasAuthority('APPROVE_PRODUCT')")
    public ResponseEntity<ApiResponse<Void>> confirmUpload(
            @CurrentUserId String userId,
            @RequestBody @Valid ConfirmMediaUploadReq request) {
        mediaAssetService.confirmOwnedUpload(userId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Appraisal image confirmed successfully"));
    }
}
