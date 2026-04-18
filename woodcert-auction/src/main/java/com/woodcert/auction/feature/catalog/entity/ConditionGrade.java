package com.woodcert.auction.feature.catalog.entity;

/**
 * Condition grade assigned by appraiser during product appraisal.
 */
public enum ConditionGrade {
    EXCELLENT(4),
    GOOD(3),
    FAIR(2),
    POOR(1);

    private final int rank;

    ConditionGrade(int rank) {
        this.rank = rank;
    }

    public int getRank() {
        return rank;
    }
}