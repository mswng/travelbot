package com.tourism.app.service.impl;

import com.tourism.app.dto.request.NearbyRequest;
import com.tourism.app.dto.response.NearbyPlaceResponse;
import com.tourism.app.repository.PhotoRepository;
import com.tourism.app.repository.PlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final PlaceRepository placeRepository;
    private final PhotoRepository photoRepository;

    /**
     * Tìm địa điểm gần vị trí user (Haversine formula trong MySQL).
     * Trả về list kèm distanceKm và mapUrl (OpenStreetMap).
     */
    public List<NearbyPlaceResponse> findNearby(NearbyRequest request) {
        List<Object[]> rows = placeRepository.findNearbyRaw(
                request.getLatitude(),
                request.getLongitude(),
                request.getRadiusKm(),
                request.getPlaceType(),
                request.getLimit()
        );

        return rows.stream().map(row -> {
            // Map từ native query result
            Integer id          = row[0] != null ? ((Number) row[0]).intValue() : null;
            String  placeId     = (String) row[1];
            String  name        = (String) row[2];
            String  address     = (String) row[3];
            String  city        = (String) row[4];
            String  description = (String) row[5];
            Double  lat         = row[6] != null ? ((Number) row[6]).doubleValue() : null;
            Double  lng         = row[7] != null ? ((Number) row[7]).doubleValue() : null;
            String  phone       = (String) row[8];
            String  website     = (String) row[9];
            String  openingHours= (String) row[10];
            String  placeType   = (String) row[11];
            Integer priceLevel  = row[12] != null ? ((Number) row[12]).intValue() : null;
            String  priceRange  = (String) row[13];
            Object  ratingObj   = row[14];
            BigDecimal rating   = ratingObj != null
                    ? new BigDecimal(ratingObj.toString()) : null;
            Double  distKm      = row[row.length - 1] != null
                    ? ((Number) row[row.length - 1]).doubleValue() : null;

            // Lấy ảnh đầu tiên
            String photoUrl = null;
            if (placeId != null) {
                var photos = photoRepository.findByPlaceId(placeId);
                if (!photos.isEmpty()) photoUrl = photos.get(0).getPhotoUrl();
            }

            // OpenStreetMap URL
            String mapUrl = (lat != null && lng != null)
                    ? buildOsmUrl(lat, lng, name)
                    : null;

            return NearbyPlaceResponse.builder()
                    .id(id)
                    .name(name)
                    .address(address)
                    .city(city)
                    .placeType(placeType)
                    .rating(rating)
                    .priceRange(priceRange)
                    .phone(phone)
                    .openingHours(openingHours)
                    .primaryPhotoUrl(photoUrl)
                    .latitude(lat)
                    .longitude(lng)
                    .distanceKm(distKm != null ? Math.round(distKm * 100.0) / 100.0 : null)
                    .mapUrl(mapUrl)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Tạo OpenStreetMap URL cho 1 địa điểm.
     * Format: https://www.openstreetmap.org/?mlat=LAT&mlon=LNG&zoom=17
     */
    public String buildOsmUrl(double lat, double lng, String name) {
        return String.format(
                "https://www.openstreetmap.org/?mlat=%.6f&mlon=%.6f&zoom=17&layers=M",
                lat, lng
        );
    }

    /**
     * Tạo URL nhúng bản đồ (embed) cho frontend dùng iframe.
     * OpenStreetMap không cần API key.
     */
    public String buildOsmEmbedUrl(double lat, double lng) {
        double delta = 0.005; // ~500m
        return String.format(
                "https://www.openstreetmap.org/export/embed.html" +
                "?bbox=%.6f,%.6f,%.6f,%.6f&layer=mapnik&marker=%.6f,%.6f",
                lng - delta, lat - delta, lng + delta, lat + delta, lat, lng
        );
    }
}
