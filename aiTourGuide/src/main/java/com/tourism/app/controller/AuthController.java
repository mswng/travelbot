package com.tourism.app.controller;

import com.tourism.app.dto.request.AdminLoginRequest;
import com.tourism.app.dto.response.ApiResponse;
import com.tourism.app.dto.response.AuthResponse;
import com.tourism.app.dto.response.UserResponse;
import com.tourism.app.security.jwt.UserPrincipal;
import com.tourism.app.service.impl.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Admin đăng nhập bằng email/password thường
     * POST /api/auth/admin/login
     */
    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse<AuthResponse>> adminLogin(
            @Valid @RequestBody AdminLoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.adminLogin(request)));
    }

    /**
     * Lấy thông tin user hiện tại (cả user lẫn admin)
     * GET /api/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(ApiResponse.success(
                authService.getCurrentUser(userPrincipal.getEmail())
        ));
    }

    /**
     * Đăng xuất - Frontend chỉ cần xóa token, backend stateless
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        // Stateless JWT - frontend tự xóa token
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }
}
