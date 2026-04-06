package com.woodcert.auction.feature.identity.service.cleanup;

import com.woodcert.auction.feature.identity.repository.RefreshTokenRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenCleanupJobTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RefreshTokenCleanupJob refreshTokenCleanupJob;

    @Test
    @DisplayName("cleanupRevokedAndExpiredTokens deletes revoked and expired tokens")
    void cleanupRevokedAndExpiredTokens_deletesRevokedAndExpiredTokens() {
        when(refreshTokenRepository.deleteByRevokedTrueOrExpiresAtBefore(any(Instant.class))).thenReturn(3L);

        refreshTokenCleanupJob.cleanupRevokedAndExpiredTokens();

        verify(refreshTokenRepository).deleteByRevokedTrueOrExpiresAtBefore(any(Instant.class));
    }
}
