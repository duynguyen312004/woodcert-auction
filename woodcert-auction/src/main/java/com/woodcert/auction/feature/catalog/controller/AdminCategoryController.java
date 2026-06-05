package com.woodcert.auction.feature.catalog.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.catalog.dto.request.CreateCategoryReq;
import com.woodcert.auction.feature.catalog.dto.request.UpdateCategoryReq;
import com.woodcert.auction.feature.catalog.dto.response.CategoryRes;
import com.woodcert.auction.feature.catalog.service.CategoryService;
import com.woodcert.auction.feature.identity.entity.AdminAction;
import com.woodcert.auction.feature.identity.entity.AdminTargetType;
import com.woodcert.auction.feature.identity.service.AdminAuditLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final CategoryService categoryService;
    private final AdminAuditLogService adminAuditLogService;

    @GetMapping
    @PreAuthorize("hasAuthority('MANAGE_CATEGORIES')")
    public ResponseEntity<ApiResponse<java.util.List<CategoryRes>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(
                categoryService.getAllCategories(),
                "Fetch admin categories successful"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_CATEGORIES')")
    public ResponseEntity<ApiResponse<CategoryRes>> createCategory(
            @CurrentUserId String adminId,
            @RequestBody @Valid CreateCategoryReq request) {
        CategoryRes category = categoryService.createCategory(request);
        adminAuditLogService.log(
                adminId,
                AdminAction.CATEGORY_CREATED,
                AdminTargetType.CATEGORY,
                String.valueOf(category.id()),
                null,
                Map.of("name", category.name(), "slug", category.slug()));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(
                        category,
                        "Category created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_CATEGORIES')")
    public ResponseEntity<ApiResponse<CategoryRes>> updateCategory(
            @CurrentUserId String adminId,
            @PathVariable Integer id,
            @RequestBody @Valid UpdateCategoryReq request) {
        CategoryRes category = categoryService.updateCategory(id, request);
        adminAuditLogService.log(
                adminId,
                AdminAction.CATEGORY_UPDATED,
                AdminTargetType.CATEGORY,
                String.valueOf(id),
                null,
                Map.of("name", category.name(), "slug", category.slug()));
        return ResponseEntity.ok(ApiResponse.success(
                category,
                "Category updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_CATEGORIES')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @CurrentUserId String adminId,
            @PathVariable Integer id) {
        categoryService.deleteCategory(id);
        adminAuditLogService.log(
                adminId,
                AdminAction.CATEGORY_DELETED,
                AdminTargetType.CATEGORY,
                String.valueOf(id),
                null,
                Map.of());
        return ResponseEntity.ok(ApiResponse.success(null, "Category deleted successfully"));
    }
}
