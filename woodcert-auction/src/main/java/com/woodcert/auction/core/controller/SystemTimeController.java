package com.woodcert.auction.core.controller;

import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.core.dto.SystemTimeRes;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
public class SystemTimeController {

    @GetMapping("/time")
    public ResponseEntity<ApiResponse<SystemTimeRes>> getTime() {
        return ResponseEntity.ok(ApiResponse.success(SystemTimeRes.now(), "Fetch server time successful"));
    }
}
