package com.tourism.app.service.impl;

import com.tourism.app.dto.request.PlaceRequest;
import com.tourism.app.dto.response.PageResponse;
import com.tourism.app.dto.response.PlaceResponse;
import com.tourism.app.entity.Photo;
import com.tourism.app.entity.Place;
import com.tourism.app.exception.ResourceNotFoundException;
import com.tourism.app.repository.PhotoRepository;
import com.tourism.app.repository.PlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final PhotoRepository photoRepository;

    // ============ PUBLIC ============

    public PageResponse<PlaceResponse> searchPlaces(
            String keyword, String placeType, String city, Double minRating, Pageable pageable) {
        Page<Place> page = placeRepository.searchPlaces(keyword, placeType, city, minRating, pageable);
        return toPageResponse(page);
    }

    public PlaceResponse getPlaceById(Integer id) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Place", Long.valueOf(id)));
        return mapToResponse(place);
    }

    public List<PlaceResponse> getTopRated(int limit) {
        return placeRepository.findTopRated(PageRequest.of(0, limit))
                .stream().map(this::mapToResponse).toList();
    }

    public List<String> getAllCities() {
        return placeRepository.findAllCities();
    }

    public List<String> getAllPlaceTypes() {
        return placeRepository.findAllPlaceTypes();
    }

    // ============ ADMIN ============

    public PageResponse<PlaceResponse> getAllPlaces(Pageable pageable) {
        return toPageResponse(placeRepository.findAll(pageable));
    }

    @Transactional
    public PlaceResponse createPlace(PlaceRequest request) {
        Place place = buildFromRequest(new Place(), request);
        return mapToResponse(placeRepository.save(place));
    }

    @Transactional
    public PlaceResponse updatePlace(Integer id, PlaceRequest request) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Place", Long.valueOf(id)));
        buildFromRequest(place, request);
        return mapToResponse(placeRepository.save(place));
    }

    @Transactional
    public void deletePlace(Integer id) {
        if (!placeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Place", Long.valueOf(id));
        }
        placeRepository.deleteById(id);
    }

    // ============ HELPERS ============

    private Place buildFromRequest(Place place, PlaceRequest req) {
        place.setName(req.getName());
        place.setPlaceId(req.getPlaceId());
        place.setAddress(req.getAddress());
        place.setCity(req.getCity());
        place.setCountry(req.getCountry() != null ? req.getCountry() : "Vietnam");
        place.setDescription(req.getDescription());
        place.setLatitude(req.getLatitude());
        place.setLongitude(req.getLongitude());
        place.setPhone(req.getPhone());
        place.setWebsite(req.getWebsite());
        place.setOpeningHours(req.getOpeningHours());
        place.setPlaceType(req.getPlaceType());
        place.setPriceLevel(req.getPriceLevel());
        place.setPriceRange(req.getPriceRange());
        place.setRating(req.getRating());
        place.setTotalRatings(req.getTotalRatings());
        place.setSource(req.getSource());
        return place;
    }

    private PageResponse<PlaceResponse> toPageResponse(Page<Place> page) {
        return PageResponse.<PlaceResponse>builder()
                .content(page.getContent().stream().map(this::mapToResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public PlaceResponse mapToResponse(Place p) {
        // Lấy photos theo place_id string
        List<String> photoUrls = List.of();
        if (p.getPlaceId() != null) {
            photoUrls = photoRepository.findByPlaceId(p.getPlaceId())
                    .stream().map(Photo::getPhotoUrl).toList();
        } else if (p.getPhotos() != null) {
            photoUrls = p.getPhotos().stream().map(Photo::getPhotoUrl).toList();
        }

        String primaryUrl = photoUrls.isEmpty() ? null : photoUrls.get(0);

        return PlaceResponse.builder()
                .id(p.getId())
                .placeId(p.getPlaceId())
                .name(p.getName())
                .address(p.getAddress())
                .city(p.getCity())
                .country(p.getCountry())
                .description(p.getDescription())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .phone(p.getPhone())
                .website(p.getWebsite())
                .openingHours(p.getOpeningHours())
                .placeType(p.getPlaceType())
                .priceLevel(p.getPriceLevel())
                .priceRange(p.getPriceRange())
                .rating(p.getRating())
                .totalRatings(p.getTotalRatings())
                .source(p.getSource())
                .photoUrls(photoUrls)
                .primaryPhotoUrl(primaryUrl)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
