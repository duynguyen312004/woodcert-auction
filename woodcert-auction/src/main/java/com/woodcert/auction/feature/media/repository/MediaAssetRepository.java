package com.woodcert.auction.feature.media.repository;

import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.entity.MediaStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
                        Pageable pageable);

        Page<MediaAsset> findByStatusInOrderByDeleteRequestedAtAscIdAsc(
                        Collection<MediaStatus> statuses,
                        Pageable pageable);

        /**
         * Find ACTIVE media assets that are NOT referenced by any:
         * - users.avatar_media_id
         * - product_images.media_id
         * - appraisal_images.media_id
         * - dispute_evidence.media_id
         * AND were created before the given cutoff (to avoid marking in-flight
         * uploads).
         */
        @Query("""
                        SELECT ma FROM MediaAsset ma
                        WHERE ma.status = :status
                          AND ma.createdAt < :cutoff
                          AND ma.id NOT IN (SELECT u.avatarMedia.id FROM User u WHERE u.avatarMedia IS NOT NULL)
                          AND ma.id NOT IN (SELECT pi.mediaId FROM ProductImage pi)
                          AND ma.id NOT IN (SELECT ai.mediaId FROM AppraisalImage ai)
                          AND ma.id NOT IN (SELECT de.mediaId FROM DisputeEvidence de)
                        """)
        Page<MediaAsset> findOrphanActiveAssets(
                        @Param("status") MediaStatus status,
                        @Param("cutoff") Instant cutoff,
                        Pageable pageable);
}
