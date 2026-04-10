package com.woodcert.auction.feature.media.repository;

import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.entity.MediaStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.Optional;

@Repository
public interface MediaAssetRepository extends JpaRepository<MediaAsset, Long> {

    Optional<MediaAsset> findByIdAndOwnerUserId(Long id, String ownerUserId);

    Page<MediaAsset> findByStatusAndCreatedAtBefore(
            MediaStatus status,
            Instant createdAt,
            Pageable pageable
    );

    Page<MediaAsset> findByStatusInOrderByDeleteRequestedAtAscIdAsc(
            Collection<MediaStatus> statuses,
            Pageable pageable
    );
}
