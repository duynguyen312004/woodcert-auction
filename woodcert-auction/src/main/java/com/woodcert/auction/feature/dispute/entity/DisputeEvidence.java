package com.woodcert.auction.feature.dispute.entity;

import com.woodcert.auction.core.entity.BaseEntity;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "dispute_evidence", indexes = {
        @Index(name = "idx_dispute_evidence_case", columnList = "dispute_case_id"),
        @Index(name = "idx_dispute_evidence_media", columnList = "media_id"),
        @Index(name = "idx_dispute_evidence_uploaded_by", columnList = "uploaded_by_user_id")
})
public class DisputeEvidence extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dispute_case_id", nullable = false)
    private Long disputeCaseId;

    @Column(name = "media_id", nullable = false)
    private Long mediaId;

    @Column(name = "uploaded_by_user_id", nullable = false, length = 36)
    private String uploadedByUserId;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_case_id", insertable = false, updatable = false)
    private DisputeCase disputeCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_id", insertable = false, updatable = false)
    private MediaAsset mediaAsset;
}
