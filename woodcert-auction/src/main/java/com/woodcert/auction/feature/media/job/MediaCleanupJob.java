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

    @Scheduled(cron = "${cloudinary.cleanup.cron:0 0 */6 * * *}")
    public void cleanupMediaAssets() {
        int markedPendingDelete = mediaAssetService.markExpiredPendingAssetsForDeletion();
        int deletedCount = mediaAssetService.cleanupPendingDeleteAssets();
        if (markedPendingDelete > 0 || deletedCount > 0) {
            log.info("Media cleanup marked {} stale pending assets and deleted {} assets",
                    markedPendingDelete, deletedCount);
        }
    }
}
