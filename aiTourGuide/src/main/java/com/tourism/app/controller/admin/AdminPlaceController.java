package com.tourism.app.controller.admin;

import com.tourism.app.dto.request.PlaceRequest;
import com.tourism.app.dto.response.ApiResponse;
import com.tourism.app.dto.response.PageResponse;
import com.tourism.app.dto.response.PlaceResponse;
import com.tourism.app.service.impl.PlaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/places")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPlaceController {

    private final PlaceService placeService;

    /** GET /api/admin/places?page=0&size=10 */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PlaceResponse>>> getAllPlaces(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return ResponseEntity.ok(ApiResponse.success(placeService.getAllPlaces(pageable)));
    }

    /** GET /api/admin/places/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlaceResponse>> getPlace(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(placeService.getPlaceById(id)));
    }

    /** POST /api/admin/places */
    @PostMapping
    public ResponseEntity<ApiResponse<PlaceResponse>> createPlace(
            @Valid @RequestBody PlaceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo địa điểm thành công", placeService.createPlace(request)));
    }

    /** PUT /api/admin/places/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PlaceResponse>> updatePlace(
            @PathVariable Integer id,
            @Valid @RequestBody PlaceRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công",
                placeService.updatePlace(id, request)));
    }

    /** DELETE /api/admin/places/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePlace(@PathVariable Integer id) {
        placeService.deletePlace(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa địa điểm thành công", null));
    }
}
