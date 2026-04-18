package com.woodcert.auction.feature.media.job;

import com.woodcert.auction.feature.media.service.MediaAssetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        prefix = "cloudinary.cleanup",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class MediaCleanupJob {

    private final MediaAssetService mediaAssetService;

    /**
     * Periodic media cleanup with 3 phases:
     * 1. Mark stale PENDING assets (upload intent created but never confirmed) → PENDING_DELETE
     * 2. Mark orphan ACTIVE assets (confirmed but not referenced by any entity) → PENDING_DELETE
     * 3. Actually delete PENDING_DELETE assets from Cloudinary → DELETED
     */
    @Scheduled(cron = "${cloudinary.cleanup.cron:0 0 */6 * * *}")
    public void cleanupMediaAssets() {
        // Phase 1: Stale PENDING — user created upload intent but never confirmed
        int markedStalePending = mediaAssetService.markExpiredPendingAssetsForDeletion();

        // Phase 2: Orphan ACTIVE — confirmed but not attached to any entity
        int markedOrphanActive = mediaAssetService.markOrphanActiveAssetsForDeletion();

        // Phase 3: Execute Cloudinary deletion for PENDING_DELETE + DELETE_FAILED
        int deletedCount = mediaAssetService.cleanupPendingDeleteAssets();

        if (markedStalePending > 0 || markedOrphanActive > 0 || deletedCount > 0) {
            log.info("Media cleanup: {} stale pending marked, {} orphan active marked, {} deleted from Cloudinary",
                    markedStalePending, markedOrphanActive, deletedCount);
        }
    }
}

