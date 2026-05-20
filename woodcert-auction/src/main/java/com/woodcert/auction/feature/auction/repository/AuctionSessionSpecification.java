package com.woodcert.auction.feature.auction.repository;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.Product;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * JPA Specifications for dynamic public auction list filtering.
 * Filters on Product.material / AppraisalReport.verifiedMaterial, category, and price range.
 * No entity changes required — uses existing @ManyToOne AuctionSession.product join.
 */
public final class AuctionSessionSpecification {

    private AuctionSessionSpecification() {}

    /**
     * Builds a combined Specification for the public auction list query.
     * Uses a single Product JOIN to avoid duplicate join issues when multiple
     * filter criteria need the same join path.
     *
     * @param statuses     required — list of allowed statuses
     * @param materials    optional — lowercase material values; matches product.material OR
     *                     appraisalReport.verifiedMaterial (case-insensitive)
     * @param categoryId   optional — category ID (resolved from categoryName by caller)
     * @param priceMin     optional — minimum currentPrice (inclusive)
     * @param priceMax     optional — maximum currentPrice (inclusive)
     */
    public static Specification<AuctionSession> publicAuctionsFilter(
            Collection<AuctionSessionStatus> statuses,
            List<String> materials,
            Integer categoryId,
            BigDecimal priceMin,
            BigDecimal priceMax) {

        if (statuses == null || statuses.isEmpty()) {
            throw new IllegalArgumentException("statuses must not be null or empty");
        }

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(root.get("status").in(statuses));

            boolean needsProductJoin = hasValues(materials) || categoryId != null;

            if (needsProductJoin) {
                Join<AuctionSession, Product> product = root.join("product", JoinType.INNER);

                if (hasValues(materials)) {
                    Predicate directMatch = cb.lower(product.get("material")).in(materials);

                    Subquery<Long> sub = query.subquery(Long.class);
                    Root<AppraisalReport> ar = sub.from(AppraisalReport.class);
                    sub.select(ar.get("id"))
                            .where(
                                    cb.equal(ar.get("productId"), product.get("id")),
                                    cb.lower(ar.get("verifiedMaterial")).in(materials));

                    predicates.add(cb.or(directMatch, cb.exists(sub)));
                }

                if (categoryId != null) {
                    predicates.add(cb.equal(product.get("categoryId"), categoryId));
                }
            }

            if (priceMin != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("currentPrice"), priceMin));
            }

            if (priceMax != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("currentPrice"), priceMax));
            }

            query.distinct(true);
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static boolean hasValues(List<String> list) {
        return list != null && !list.isEmpty();
    }
}
