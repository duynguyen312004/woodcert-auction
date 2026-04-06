package com.woodcert.auction.feature.identity.service.cleanup;

import com.woodcert.auction.feature.identity.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        prefix = "identity.refresh-token-cleanup",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class RefreshTokenCleanupJob {

    private final RefreshTokenRepository refreshTokenRepository;

    @Scheduled(cron = "${identity.refresh-token-cleanup.cron:0 0 */6 * * *}")
    @Transactional
    public void cleanupRevokedAndExpiredTokens() {
        long deletedCount = refreshTokenRepository.deleteByRevokedTrueOrExpiresAtBefore(Instant.now());
        if (deletedCount > 0) {
            log.info("Refresh token cleanup removed {} revoked/expired tokens", deletedCount);
        }
    }
}
