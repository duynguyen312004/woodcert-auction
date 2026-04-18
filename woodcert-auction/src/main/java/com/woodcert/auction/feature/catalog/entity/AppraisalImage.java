package com.woodcert.auction.feature.catalog.entity;

import com.woodcert.auction.feature.media.entity.MediaAsset;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Appraisal image entity — maps to 'appraisal_images' table.
 * Uses media_id FK → media_assets(id) for Cloudinary integration.
 * Does NOT extend BaseEntity (no audit columns in DB schema).
 */
@Getter
@Setter
@Entity
@Table(name = "appraisal_images", indexes = {
        @Index(name = "idx_appraisal_images_report_id", columnList = "appraisal_report_id")
})
public class AppraisalImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "appraisal_report_id", nullable = false)
    private Long appraisalReportId;

    @Column(name = "media_id", nullable = false)
    private Long mediaId;

    @Column(name = "description", length = 255)
    private String description;

    // --- Relationships ---

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appraisal_report_id", insertable = false, updatable = false)
    private AppraisalReport appraisalReport;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_id", insertable = false, updatable = false)
    private MediaAsset mediaAsset;
}
