package com.woodcert.auction.feature.media.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.media.config.CloudinaryProperties;
import com.woodcert.auction.feature.media.dto.request.ConfirmMediaUploadReq;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.entity.MediaResourceType;
import com.woodcert.auction.feature.media.entity.MediaStatus;
import com.woodcert.auction.feature.media.entity.MediaUsageType;
import com.woodcert.auction.feature.media.repository.MediaAssetRepository;
import com.woodcert.auction.feature.media.support.CloudinaryResourceDetails;
import com.woodcert.auction.feature.media.support.MediaUploadContext;
import com.woodcert.auction.feature.media.util.CloudinarySignatureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaAssetService {

    private final MediaAssetRepository mediaAssetRepository;
    private final CloudinaryProperties properties;
    private final CloudinarySignatureService signatureService;
    private final CloudinaryApiService cloudinaryApiService;

    @Transactional
    public MediaUploadIntentRes createUploadIntent(MediaUploadContext context, CreateMediaUploadIntentReq request) {
        assertCloudinaryConfigured();
        validateUploadRequest(context, request);

        MediaAsset mediaAsset = new MediaAsset();
        mediaAsset.setOwnerUserId(context.ownerUserId());
        mediaAsset.setUsageType(context.usageType());
        mediaAsset.setResourceType(context.resourceType());
        mediaAsset.setFolder(normalizeFolder(context.folder()));
        mediaAsset.setContentType(request.contentType().trim());
        mediaAsset.setOriginalFilename(request.originalFileName().trim());
        mediaAsset.setFileSize(request.fileSize());
        mediaAsset.setStatus(MediaStatus.PENDING);
        mediaAsset = mediaAssetRepository.save(mediaAsset);

        String publicId = mediaAsset.getFolder() + "/" + mediaAsset.getId();
        mediaAsset.setPublicId(publicId);
        mediaAsset = mediaAssetRepository.save(mediaAsset);

        long timestamp = Instant.now().getEpochSecond();
        String assetFolder = mediaAsset.getFolder();
        String signature = signatureService.sign(Map.of(
                "asset_folder", assetFolder,
                "public_id", publicId,
                "timestamp", String.valueOf(timestamp)
        ));

        return new MediaUploadIntentRes(
                mediaAsset.getId(),
                cloudinaryApiService.buildUploadUrl(context.resourceType().getCloudinaryValue()),
                properties.getCloudName(),
                properties.getApiKey(),
                assetFolder,
                publicId,
                context.resourceType().getCloudinaryValue(),
                timestamp,
                signature
        );
    }

    @Transactional
    public MediaAsset confirmOwnedUpload(String ownerUserId, ConfirmMediaUploadReq request) {
        assertCloudinaryConfigured();

        MediaAsset mediaAsset = getOwnedAssetOrThrow(request.mediaId(), ownerUserId);
        validateConfirmableState(mediaAsset);

        CloudinaryResourceDetails resource = cloudinaryApiService.fetchUploadedResource(request.assetId().trim())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Uploaded media was not found in Cloudinary"));

        validateFetchedResource(mediaAsset, request, resource);
        applyFetchedResource(mediaAsset, resource);
        return mediaAssetRepository.save(mediaAsset);
    }

    @Transactional(readOnly = true)
    public MediaAsset getOwnedAssetOrThrow(Long mediaId, String ownerUserId) {
        return mediaAssetRepository.findByIdAndOwnerUserId(mediaId, ownerUserId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Media asset not found"));
    }

    @Transactional
    public void markPendingDelete(MediaAsset mediaAsset) {
        if (mediaAsset == null || mediaAsset.getStatus() == MediaStatus.DELETED) {
            return;
        }

        mediaAsset.setStatus(MediaStatus.PENDING_DELETE);
        mediaAsset.setDeleteRequestedAt(Instant.now());
        mediaAsset.setLastError(null);
        mediaAssetRepository.save(mediaAsset);
    }

    @Transactional
    public int markExpiredPendingAssetsForDeletion() {
        Instant cutoff = Instant.now().minusSeconds(properties.getCleanup().getStalePendingHours() * 3600);
        List<MediaAsset> assets = mediaAssetRepository.findByStatusAndCreatedAtBefore(
                MediaStatus.PENDING,
                cutoff,
                PageRequest.of(0, properties.getCleanup().getBatchSize())
        ).getContent();

        for (MediaAsset asset : assets) {
            asset.setDeleteRequestedAt(Instant.now());
            asset.setStatus(MediaStatus.PENDING_DELETE);
            asset.setLastError(null);
        }

        if (!assets.isEmpty()) {
            mediaAssetRepository.saveAll(assets);
        }

        return assets.size();
    }

    @Transactional
    public int cleanupPendingDeleteAssets() {
        List<MediaAsset> assets = mediaAssetRepository.findByStatusInOrderByDeleteRequestedAtAscIdAsc(
                List.of(MediaStatus.PENDING_DELETE, MediaStatus.DELETE_FAILED),
                PageRequest.of(0, properties.getCleanup().getBatchSize())
        ).getContent();

        int deletedCount = 0;
        for (MediaAsset asset : assets) {
            if (asset.getCleanupAttempts() >= properties.getCleanup().getMaxDeleteAttempts()) {
                continue;
            }

            try {
                boolean deleted = cloudinaryApiService.destroy(asset);
                asset.setCleanupAttempts(asset.getCleanupAttempts() + 1);
                if (deleted) {
                    asset.setStatus(MediaStatus.DELETED);
                    asset.setDeletedAt(Instant.now());
                    asset.setLastError(null);
                    deletedCount++;
                } else {
                    asset.setStatus(MediaStatus.DELETE_FAILED);
                    asset.setLastError("Cloudinary destroy returned unexpected result");
                }
            } catch (RestClientException ex) {
                asset.setCleanupAttempts(asset.getCleanupAttempts() + 1);
                asset.setStatus(MediaStatus.DELETE_FAILED);
                asset.setLastError(trimError(ex.getMessage()));
                log.warn("Cloudinary delete failed for mediaId={} publicId={}", asset.getId(), asset.getPublicId(), ex);
            }
        }

        if (!assets.isEmpty()) {
            mediaAssetRepository.saveAll(assets);
        }

        return deletedCount;
    }

    private void validateUploadRequest(MediaUploadContext context, CreateMediaUploadIntentReq request) {
        String contentType = request.contentType().trim().toLowerCase();
        if (!contentType.startsWith(context.allowedContentTypePrefix().toLowerCase())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Content type is not allowed for this media usage");
        }
        if (request.fileSize() > context.maxBytes()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "File size exceeds the allowed limit");
        }
    }

    private void validateConfirmableState(MediaAsset mediaAsset) {
        if (mediaAsset.getStatus() == MediaStatus.DELETED
                || mediaAsset.getStatus() == MediaStatus.PENDING_DELETE
                || mediaAsset.getStatus() == MediaStatus.DELETE_FAILED) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Media asset is not attachable in its current state");
        }
    }

    private void validateFetchedResource(MediaAsset mediaAsset, ConfirmMediaUploadReq request, CloudinaryResourceDetails resource) {
        if (resource.assetId() == null || !request.assetId().trim().equals(resource.assetId().trim())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Uploaded asset id does not match the confirmed asset");
        }

        if (resource.publicId() == null || !mediaAsset.getPublicId().equals(resource.publicId().trim())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Uploaded public id does not match the issued upload intent");
        }

        MediaResourceType resourceType = MediaResourceType.fromCloudinaryValue(resource.resourceType());
        if (resourceType != mediaAsset.getResourceType()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Uploaded resource type does not match expected type");
        }

        if (resource.bytes() == null || resource.bytes() <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Uploaded media metadata is incomplete");
        }

        if (resource.bytes() > maxBytesFor(mediaAsset.getUsageType())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Uploaded file exceeds the allowed limit");
        }
    }

    private void applyFetchedResource(MediaAsset mediaAsset, CloudinaryResourceDetails resource) {
        mediaAsset.setAssetId(trimToNull(resource.assetId()));
        mediaAsset.setVersion(resource.version());
        mediaAsset.setFormat(trimToNull(resource.format()));
        mediaAsset.setFileSize(resource.bytes());
        mediaAsset.setWidth(resource.width());
        mediaAsset.setHeight(resource.height());
        mediaAsset.setDurationSeconds(resource.duration());
        mediaAsset.setSecureUrl(trimToNull(resource.secureUrl()));
        if (trimToNull(resource.originalFilename()) != null) {
            mediaAsset.setOriginalFilename(resource.originalFilename().trim());
        }
        mediaAsset.setStatus(MediaStatus.ACTIVE);
        mediaAsset.setDeleteRequestedAt(null);
        mediaAsset.setDeletedAt(null);
        mediaAsset.setCleanupAttempts(0);
        mediaAsset.setLastError(null);
    }

    private long maxBytesFor(MediaUsageType usageType) {
        return switch (usageType) {
            case USER_AVATAR -> properties.getUpload().getAvatarMaxBytes();
            case PRODUCT_IMAGE, APPRAISAL_IMAGE, DISPUTE_EVIDENCE -> properties.getUpload().getImageMaxBytes();
            case SHIPMENT_PACKING_VIDEO -> properties.getUpload().getVideoMaxBytes();
        };
    }

    private void assertCloudinaryConfigured() {
        if (!properties.isConfigured()) {
            throw new AppException(500, "Cloudinary is not configured");
        }
    }

    private String normalizeFolder(String folder) {
        String normalized = folder == null ? "" : folder.trim().replace("\\", "/");
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        if (normalized.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Media folder must not be blank");
        }
        return normalized;
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private String trimError(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.length() <= 500 ? value : value.substring(0, 500);
    }
}
