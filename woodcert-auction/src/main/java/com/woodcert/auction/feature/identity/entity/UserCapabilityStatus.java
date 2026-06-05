package com.woodcert.auction.feature.identity.entity;

import com.woodcert.auction.core.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "user_capability_statuses", uniqueConstraints = {
        @UniqueConstraint(
                name = "uk_user_capability_statuses_user_capability",
                columnNames = {"user_id", "capability"})
}, indexes = {
        @Index(name = "idx_user_capability_statuses_user", columnList = "user_id"),
        @Index(name = "idx_user_capability_statuses_status", columnList = "status")
})
public class UserCapabilityStatus extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "capability", nullable = false, length = 20)
    private UserCapability capability;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CapabilityStatus status;

    @Column(name = "reason", length = 1000)
    private String reason;

    @Column(name = "updated_by_admin_id", length = 36)
    private String updatedByAdminId;
}
