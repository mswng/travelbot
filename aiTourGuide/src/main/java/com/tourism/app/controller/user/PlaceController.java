package com.tourism.app.controller.user;

import com.tourism.app.dto.response.ApiResponse;
import com.tourism.app.dto.response.PageResponse;
import com.tourism.app.dto.response.PlaceResponse;
import com.tourism.app.service.impl.PlaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
public class PlaceController {

    private final PlaceService placeService;

    /**
     * GET /api/places?keyword=&placeType=restaurant&city=Hanoi&page=0&size=12&sort=rating,desc
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PlaceResponse>>> getPlaces(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String placeType,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "rating") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        return ResponseEntity.ok(ApiResponse.success(
                placeService.searchPlaces(keyword, placeType, city, minRating, PageRequest.of(page, size, sort))
        ));
    }

    /** GET /api/places/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlaceResponse>> getPlace(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(placeService.getPlaceById(id)));
    }

    /** GET /api/places/top-rated?limit=6 */
    @GetMapping("/top-rated")
    public ResponseEntity<ApiResponse<List<PlaceResponse>>> getTopRated(
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(ApiResponse.success(placeService.getTopRated(limit)));
    }

    /** GET /api/places/cities */
    @GetMapping("/cities")
    public ResponseEntity<ApiResponse<List<String>>> getCities() {
        return ResponseEntity.ok(ApiResponse.success(placeService.getAllCities()));
    }

    /** GET /api/places/types */
    @GetMapping("/types")
    public ResponseEntity<ApiResponse<List<String>>> getTypes() {
        return ResponseEntity.ok(ApiResponse.success(placeService.getAllPlaceTypes()));
    }
}
