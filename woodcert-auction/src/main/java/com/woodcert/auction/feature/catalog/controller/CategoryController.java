package com.woodcert.auction.feature.catalog.controller;

import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.catalog.dto.response.CategoryRes;
import com.woodcert.auction.feature.catalog.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryRes>>> getAllCategories() {
        List<CategoryRes> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories, "Fetch categories successful"));
    }
}
