package com.woodcert.auction.feature.media.service;

import com.woodcert.auction.core.exception.AppException;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.client.RestClientException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MediaAssetServiceTest {

    @Mock
    private MediaAssetRepository mediaAssetRepository;

    @Mock
    private CloudinarySignatureService signatureService;

    @Mock
    private CloudinaryApiService cloudinaryApiService;

    private CloudinaryProperties properties;
    private MediaAssetService mediaAssetService;

    @BeforeEach
    void setUp() {
        properties = new CloudinaryProperties();
        properties.setCloudName("demo-cloud");
        properties.setApiKey("key");
        properties.setApiSecret("secret");
        properties.setBaseFolder("woodcert/dev");
        properties.getUpload().setAvatarMaxBytes(5_242_880);
        properties.getUpload().setImageMaxBytes(10_485_760);
        properties.getUpload().setVideoMaxBytes(104_857_600);
        properties.getCleanup().setBatchSize(20);
        properties.getCleanup().setMaxDeleteAttempts(5);
        properties.getCleanup().setStalePendingHours(24);
        mediaAssetService = new MediaAssetService(
                mediaAssetRepository,
                properties,
                signatureService,
                cloudinaryApiService
        );
    }

    @Test
    @DisplayName("createUploadIntent creates pending asset and returns signed upload response")
    void createUploadIntent_success_returnsSignedIntent() {
        MediaUploadContext context = new MediaUploadContext(
                "user-1",
                MediaUsageType.USER_AVATAR,
                MediaResourceType.IMAGE,
                "woodcert/dev/users/user-1/avatar",
                properties.getUpload().getAvatarMaxBytes(),
                "image/"
        );
        CreateMediaUploadIntentReq request = new CreateMediaUploadIntentReq("avatar.jpg", "image/jpeg", 1024L);

        when(mediaAssetRepository.save(any(MediaAsset.class))).thenAnswer(invocation -> {
            MediaAsset asset = invocation.getArgument(0);
            if (asset.getId() == null) {
                asset.setId(101L);
            }
            return asset;
        });
        when(signatureService.sign(any())).thenReturn("signed-hash");
        when(cloudinaryApiService.buildUploadUrl("image"))
                .thenReturn("https://api.cloudinary.com/v1_1/demo-cloud/image/upload");

        MediaUploadIntentRes response = mediaAssetService.createUploadIntent(context, request);

        assertEquals(101L, response.mediaId());
        assertEquals("woodcert/dev/users/user-1/avatar", response.assetFolder());
        assertEquals("woodcert/dev/users/user-1/avatar/101", response.publicId());
        assertEquals("signed-hash", response.signature());
        assertEquals("demo-cloud", response.cloudName());
        assertNotNull(response.timestamp());
        verify(mediaAssetRepository, times(2)).save(any(MediaAsset.class));
    }

    @Test
    @DisplayName("createUploadIntent rejects invalid content type")
    void createUploadIntent_invalidContentType_throws() {
        MediaUploadContext context = new MediaUploadContext(
                "user-1",
                MediaUsageType.USER_AVATAR,
                MediaResourceType.IMAGE,
                "woodcert/dev/users/user-1/avatar",
                properties.getUpload().getAvatarMaxBytes(),
                "image/"
        );
        CreateMediaUploadIntentReq request = new CreateMediaUploadIntentReq("avatar.mp4", "video/mp4", 1024L);

        AppException exception = assertThrows(
                AppException.class,
                () -> mediaAssetService.createUploadIntent(context, request)
        );

        assertEquals("Content type is not allowed for this media usage", exception.getMessage());
    }

    @Test
    @DisplayName("confirmOwnedUpload fetches metadata from Cloudinary and activates the asset")
    void confirmOwnedUpload_success_fetchesCloudinaryMetadata() {
        MediaAsset asset = createMediaAsset(11L, "user-1", MediaStatus.PENDING);
        CloudinaryResourceDetails details = new CloudinaryResourceDetails(
                "asset-123",
                asset.getPublicId(),
                "image",
                7L,
                "jpg",
                2048L,
                800,
                800,
                null,
                "https://res.cloudinary.com/demo/image/upload/v7/" + asset.getPublicId(),
                "avatar"
        );

        when(mediaAssetRepository.findByIdAndOwnerUserId(11L, "user-1")).thenReturn(Optional.of(asset));
        when(cloudinaryApiService.fetchUploadedResource("asset-123")).thenReturn(Optional.of(details));
        when(mediaAssetRepository.save(asset)).thenReturn(asset);

        MediaAsset result = mediaAssetService.confirmOwnedUpload("user-1", new ConfirmMediaUploadReq(11L, "asset-123"));

        assertEquals(MediaStatus.ACTIVE, result.getStatus());
        assertEquals("asset-123", result.getAssetId());
        assertEquals(7L, result.getVersion());
        assertEquals(2048L, result.getFileSize());
        assertEquals(800, result.getWidth());
        assertEquals("https://res.cloudinary.com/demo/image/upload/v7/" + asset.getPublicId(), result.getSecureUrl());
    }

    @Test
    @DisplayName("confirmOwnedUpload rejects when Cloudinary resource is missing")
    void confirmOwnedUpload_resourceMissing_throws() {
        MediaAsset asset = createMediaAsset(11L, "user-1", MediaStatus.PENDING);

        when(mediaAssetRepository.findByIdAndOwnerUserId(11L, "user-1")).thenReturn(Optional.of(asset));
        when(cloudinaryApiService.fetchUploadedResource("asset-123")).thenReturn(Optional.empty());

        AppException exception = assertThrows(
                AppException.class,
                () -> mediaAssetService.confirmOwnedUpload("user-1", new ConfirmMediaUploadReq(11L, "asset-123"))
        );

        assertEquals("Uploaded media was not found in Cloudinary", exception.getMessage());
    }

    @Test
    @DisplayName("confirmOwnedUpload rejects resource type mismatch")
    void confirmOwnedUpload_resourceTypeMismatch_throws() {
        MediaAsset asset = createMediaAsset(11L, "user-1", MediaStatus.PENDING);
        CloudinaryResourceDetails details = new CloudinaryResourceDetails(
                "asset-123",
                asset.getPublicId(),
                "video",
                7L,
                "mp4",
                2048L,
                800,
                800,
                3.5,
                "https://res.cloudinary.com/demo/video/upload/v7/" + asset.getPublicId(),
                "avatar"
        );

        when(mediaAssetRepository.findByIdAndOwnerUserId(11L, "user-1")).thenReturn(Optional.of(asset));
        when(cloudinaryApiService.fetchUploadedResource("asset-123")).thenReturn(Optional.of(details));

        AppException exception = assertThrows(
                AppException.class,
                () -> mediaAssetService.confirmOwnedUpload("user-1", new ConfirmMediaUploadReq(11L, "asset-123"))
        );

        assertEquals("Uploaded resource type does not match expected type", exception.getMessage());
    }

    @Test
    @DisplayName("confirmOwnedUpload rejects asset id mismatch")
    void confirmOwnedUpload_assetIdMismatch_throws() {
        MediaAsset asset = createMediaAsset(11L, "user-1", MediaStatus.PENDING);
        CloudinaryResourceDetails details = new CloudinaryResourceDetails(
                "asset-999",
                asset.getPublicId(),
                "image",
                7L,
                "jpg",
                2048L,
                800,
                800,
                null,
                "https://res.cloudinary.com/demo/image/upload/v7/" + asset.getPublicId(),
                "avatar"
        );

        when(mediaAssetRepository.findByIdAndOwnerUserId(11L, "user-1")).thenReturn(Optional.of(asset));
        when(cloudinaryApiService.fetchUploadedResource("asset-123")).thenReturn(Optional.of(details));

        AppException exception = assertThrows(
                AppException.class,
                () -> mediaAssetService.confirmOwnedUpload("user-1", new ConfirmMediaUploadReq(11L, "asset-123"))
        );

        assertEquals("Uploaded asset id does not match the confirmed asset", exception.getMessage());
    }

    @Test
    @DisplayName("cleanupPendingDeleteAssets marks asset deleted when Cloudinary destroy succeeds")
    void cleanupPendingDeleteAssets_success_marksDeleted() {
        MediaAsset asset = createMediaAsset(12L, "user-1", MediaStatus.PENDING_DELETE);
        asset.setDeleteRequestedAt(Instant.now());

        when(mediaAssetRepository.findByStatusInOrderByDeleteRequestedAtAscIdAsc(
                eq(List.of(MediaStatus.PENDING_DELETE, MediaStatus.DELETE_FAILED)),
                eq(PageRequest.of(0, properties.getCleanup().getBatchSize()))
        )).thenReturn(new PageImpl<>(List.of(asset)));
        when(cloudinaryApiService.destroy(asset)).thenReturn(true);

        int deletedCount = mediaAssetService.cleanupPendingDeleteAssets();

        assertEquals(1, deletedCount);
        assertEquals(MediaStatus.DELETED, asset.getStatus());
        assertEquals(1, asset.getCleanupAttempts());
        verify(mediaAssetRepository).saveAll(List.of(asset));
    }

    @Test
    @DisplayName("cleanupPendingDeleteAssets marks asset delete failed when Cloudinary throws")
    void cleanupPendingDeleteAssets_failure_marksDeleteFailed() {
        MediaAsset asset = createMediaAsset(12L, "user-1", MediaStatus.PENDING_DELETE);
        asset.setDeleteRequestedAt(Instant.now());

        when(mediaAssetRepository.findByStatusInOrderByDeleteRequestedAtAscIdAsc(
                eq(List.of(MediaStatus.PENDING_DELETE, MediaStatus.DELETE_FAILED)),
                eq(PageRequest.of(0, properties.getCleanup().getBatchSize()))
        )).thenReturn(new PageImpl<>(List.of(asset)));
        when(cloudinaryApiService.destroy(asset)).thenThrow(new RestClientException("boom"));

        int deletedCount = mediaAssetService.cleanupPendingDeleteAssets();

        assertEquals(0, deletedCount);
        assertEquals(MediaStatus.DELETE_FAILED, asset.getStatus());
        assertEquals(1, asset.getCleanupAttempts());
        assertEquals("boom", asset.getLastError());
    }

    private MediaAsset createMediaAsset(Long id, String ownerUserId, MediaStatus status) {
        MediaAsset asset = new MediaAsset();
        asset.setId(id);
        asset.setOwnerUserId(ownerUserId);
        asset.setUsageType(MediaUsageType.USER_AVATAR);
        asset.setResourceType(MediaResourceType.IMAGE);
        asset.setFolder("woodcert/dev/users/" + ownerUserId + "/avatar");
        asset.setPublicId(asset.getFolder() + "/" + id);
        asset.setStatus(status);
        asset.setContentType("image/jpeg");
        asset.setOriginalFilename("avatar.jpg");
        return asset;
    }
}
