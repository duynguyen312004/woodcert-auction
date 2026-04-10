package com.woodcert.auction.feature.media.entity;

import com.woodcert.auction.core.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "media_assets", indexes = {
        @Index(name = "idx_media_assets_owner_usage", columnList = "owner_user_id, usage_type"),
        @Index(name = "idx_media_assets_status_created", columnList = "status, created_at"),
        @Index(name = "idx_media_assets_status_delete_requested", columnList = "status, delete_requested_at")
})
public class MediaAsset extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_id", length = 100, unique = true)
    private String assetId;

    @Column(name = "public_id", length = 255, unique = true)
    private String publicId;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false, length = 20)
    private MediaResourceType resourceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "usage_type", nullable = false, length = 40)
    private MediaUsageType usageType;

    @Column(name = "owner_user_id", nullable = false, length = 36)
    private String ownerUserId;

    @Column(name = "folder", nullable = false, length = 255)
    private String folder;

    @Column(name = "asset_version")
    private Long version;

    @Column(name = "format", length = 20)
    private String format;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    @Column(name = "duration_seconds")
    private Double durationSeconds;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    @Column(name = "secure_url", length = 500)
    private String secureUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private MediaStatus status = MediaStatus.PENDING;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(name = "delete_requested_at")
    private Instant deleteRequestedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "cleanup_attempts", nullable = false)
    private int cleanupAttempts;

    @Column(name = "last_error", length = 500)
    private String lastError;
}
