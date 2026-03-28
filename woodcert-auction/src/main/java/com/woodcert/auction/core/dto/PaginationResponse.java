package com.woodcert.auction.core.dto;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Standard paginated response wrapper.
 * Used for endpoints that return paginated lists.
 */
public record PaginationResponse<T>(
        Meta meta,
        List<T> result
) {

    /**
     * Pagination metadata matching API_SPEC format.
     */
    public record Meta(
            int page,
            int pageSize,
            int pages,
            long total
    ) {
    }

    /**
     * Create PaginationResponse from a Spring Data Page object.
     *
     * @param page   Spring Data Page containing paginated data
     * @param <T>    Type of elements
     * @return PaginationResponse with meta and result
     */
    public static <T> PaginationResponse<T> of(Page<T> page) {
        Meta meta = new Meta(
                page.getNumber() + 1,   // Spring Page is 0-indexed, API is 1-indexed
                page.getSize(),
                page.getTotalPages(),
                page.getTotalElements()
        );
        return new PaginationResponse<>(meta, page.getContent());
    }
}
