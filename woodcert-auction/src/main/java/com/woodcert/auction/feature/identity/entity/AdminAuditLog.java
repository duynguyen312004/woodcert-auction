package com.woodcert.auction.feature.identity.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "admin_audit_logs", indexes = {
        @Index(name = "idx_admin_audit_logs_actor", columnList = "actor_admin_id"),
        @Index(name = "idx_admin_audit_logs_action", columnList = "action"),
        @Index(name = "idx_admin_audit_logs_target", columnList = "target_type,target_id"),
        @Index(name = "idx_admin_audit_logs_created", columnList = "created_at")
})
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_admin_id", nullable = false, length = 36)
    private String actorAdminId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 60)
    private AdminAction action;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 40)
    private AdminTargetType targetType;

    @Column(name = "target_id", nullable = false, length = 80)
    private String targetId;

    @Column(name = "reason", length = 1000)
    private String reason;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
