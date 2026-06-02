package com.tourism.app.controller.user;

import com.tourism.app.dto.request.ItineraryRequest;
import com.tourism.app.dto.response.ApiResponse;
import com.tourism.app.dto.response.ItineraryResponse;
import com.tourism.app.dto.response.PageResponse;
import com.tourism.app.security.jwt.UserPrincipal;
import com.tourism.app.service.impl.ItineraryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/itineraries")
@RequiredArgsConstructor
public class ItineraryController {

    private final ItineraryService itineraryService;

    /**
     * POST /api/itineraries/generate
     * Chức năng 4: AI tạo lịch trình → lưu MySQL → index FAISS
     */
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<ItineraryResponse>> generate(
            @Valid @RequestBody ItineraryRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        String email = principal != null ? principal.getEmail() : null;
        return ResponseEntity.ok(ApiResponse.success(
                "Lịch trình đã được tạo thành công",
                itineraryService.generateItinerary(request, email)
        ));
    }

    /**
     * GET /api/itineraries - Lịch trình của user hiện tại
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ItineraryResponse>>> getMyItineraries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                itineraryService.getUserItineraries(
                        principal.getEmail(),
                        PageRequest.of(page, size, Sort.by("createdAt").descending())
                )
        ));
    }

    /**
     * GET /api/itineraries/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ItineraryResponse>> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                itineraryService.getById(id, principal.getEmail())
        ));
    }

    /**
     * DELETE /api/itineraries/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        itineraryService.deleteItinerary(id, principal.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Đã xóa lịch trình", null));
    }
}
