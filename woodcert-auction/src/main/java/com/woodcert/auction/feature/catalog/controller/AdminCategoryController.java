package com.woodcert.auction.feature.catalog.controller;

import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.catalog.dto.request.CreateCategoryReq;
import com.woodcert.auction.feature.catalog.dto.request.UpdateCategoryReq;
import com.woodcert.auction.feature.catalog.dto.response.CategoryRes;
import com.woodcert.auction.feature.catalog.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final CategoryService categoryService;

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
            @RequestBody @Valid CreateCategoryReq request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(
                        categoryService.createCategory(request),
                        "Category created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_CATEGORIES')")
    public ResponseEntity<ApiResponse<CategoryRes>> updateCategory(
            @PathVariable Integer id,
            @RequestBody @Valid UpdateCategoryReq request) {
        return ResponseEntity.ok(ApiResponse.success(
                categoryService.updateCategory(id, request),
                "Category updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_CATEGORIES')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Integer id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Category deleted successfully"));
    }
}
