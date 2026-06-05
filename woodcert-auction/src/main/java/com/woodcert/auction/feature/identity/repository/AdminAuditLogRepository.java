package com.woodcert.auction.feature.identity.repository;

import com.woodcert.auction.feature.identity.entity.AdminAction;
import com.woodcert.auction.feature.identity.entity.AdminAuditLog;
import com.woodcert.auction.feature.identity.entity.AdminTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {

    @Query("""
            SELECT log
            FROM AdminAuditLog log
            WHERE (:actorId IS NULL OR log.actorAdminId = :actorId)
              AND (:action IS NULL OR log.action = :action)
              AND (:targetType IS NULL OR log.targetType = :targetType)
              AND (:targetId IS NULL OR log.targetId = :targetId)
              AND (:from IS NULL OR log.createdAt >= :from)
              AND (:to IS NULL OR log.createdAt <= :to)
            ORDER BY log.createdAt DESC, log.id DESC
            """)
    Page<AdminAuditLog> search(
            @Param("actorId") String actorId,
            @Param("action") AdminAction action,
            @Param("targetType") AdminTargetType targetType,
            @Param("targetId") String targetId,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable);
}
