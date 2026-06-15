package com.woodcert.auction.feature.dispute.entity;

import com.woodcert.auction.core.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "dispute_messages", indexes = {
        @Index(name = "idx_dispute_messages_case_created", columnList = "dispute_case_id, created_at, id"),
        @Index(name = "idx_dispute_messages_author", columnList = "author_user_id")
})
public class DisputeMessage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dispute_case_id", nullable = false)
    private Long disputeCaseId;

    @Column(name = "author_user_id", nullable = false, length = 36)
    private String authorUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "author_role", nullable = false, length = 20)
    private DisputeAuthorRole authorRole;

    @Column(name = "content", length = 2000)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_case_id", insertable = false, updatable = false)
    private DisputeCase disputeCase;
}
