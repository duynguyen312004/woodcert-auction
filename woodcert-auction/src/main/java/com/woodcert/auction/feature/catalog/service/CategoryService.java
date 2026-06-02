package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.feature.catalog.dto.request.CreateCategoryReq;
import com.woodcert.auction.feature.catalog.dto.request.UpdateCategoryReq;
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

    CategoryRes createCategory(CreateCategoryReq request);

    CategoryRes updateCategory(Integer id, UpdateCategoryReq request);

    void deleteCategory(Integer id);
}
