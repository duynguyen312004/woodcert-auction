package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.feature.catalog.dto.response.CategoryRes;

import java.util.List;

/**
 * Category service interface.
 */
public interface CategoryService {

    /**
     * Get all categories sorted by name.
     */
    List<CategoryRes> getAllCategories();
}
