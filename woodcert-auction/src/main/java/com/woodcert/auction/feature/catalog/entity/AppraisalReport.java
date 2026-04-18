package com.woodcert.auction.feature.catalog.entity;

import com.woodcert.auction.feature.identity.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Appraisal report entity — maps to 'appraisal_reports' table.
 * One product can have at most one appraisal report (1:1 relationship).
 * Does NOT extend BaseEntity (no updated_at in schema, only appraised_at).
 *
 * <p><strong>Immutability contract:</strong> Once an appraisal report is submitted,
 * it MUST NOT be modified or deleted. This is an intentional business decision —
 * the report serves as a permanent record of the appraisal and is referenced by
 * its certificate code. No update/delete endpoints exist for this entity.</p>
 */
@Getter
@Setter
@Entity
@Table(name = "appraisal_reports", indexes = {
        @Index(name = "idx_appraisal_reports_appraiser_id", columnList = "appraiser_id"),
        @Index(name = "idx_appraisal_reports_verified_material", columnList = "verified_material"),
        @Index(name = "idx_appraisal_reports_origin", columnList = "origin"),
        @Index(name = "idx_appraisal_reports_condition_grade", columnList = "condition_grade"),
        @Index(name = "idx_appraisal_reports_estimated_value", columnList = "estimated_value")
})
public class AppraisalReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false, unique = true)
    private Long productId;

    @Column(name = "appraiser_id", nullable = false, length = 36)
    private String appraiserId;

    @Column(name = "certificate_code", nullable = false, unique = true, length = 50)
    private String certificateCode;

    @Column(name = "verified_material", nullable = false, length = 100)
    private String verifiedMaterial;

    @Column(name = "origin", length = 100)
    private String origin;

    @Column(name = "age_estimation", length = 50)
    private String ageEstimation;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_grade", length = 20)
    private ConditionGrade conditionGrade;

    @Column(name = "estimated_value", nullable = false, precision = 19, scale = 2)
    private BigDecimal estimatedValue;

    @Column(name = "is_authentic", nullable = false)
    private boolean isAuthentic;

    @Column(name = "appraiser_notes", columnDefinition = "TEXT")
    private String appraiserNotes;

    @Column(name = "seller_accuracy", precision = 3, scale = 2)
    private BigDecimal sellerAccuracy;

    @Column(name = "digital_signature", nullable = false, length = 255)
    private String digitalSignature;

    @Column(name = "appraised_at", nullable = false)
    private Instant appraisedAt;

    // --- Relationships ---

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appraiser_id", insertable = false, updatable = false)
    private User appraiser;

    @OneToMany(mappedBy = "appraisalReport", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AppraisalImage> images = new ArrayList<>();
}
