package com.tourism.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NearbyPlaceResponse {
    private Integer id;
    private String name;
    private String address;
    private String city;
    private String placeType;
    private BigDecimal rating;
    private String priceRange;
    private String phone;
    private String openingHours;
    private String primaryPhotoUrl;
    private Double latitude;
    private Double longitude;
    private Double distanceKm;      // Khoảng cách từ user đến địa điểm
    // OpenStreetMap link
    private String mapUrl;
}
