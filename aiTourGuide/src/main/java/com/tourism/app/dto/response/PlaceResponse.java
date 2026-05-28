package com.tourism.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PlaceResponse {
    private Integer id;
    private String placeId;
    private String name;
    private String address;
    private String city;
    private String country;
    private String description;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String phone;
    private String website;
    private String openingHours;
    private String placeType;
    private Integer priceLevel;
    private String priceRange;
    private BigDecimal rating;
    private Integer totalRatings;
    private String source;
    private List<String> photoUrls;
    private String primaryPhotoUrl;
    private LocalDateTime createdAt;
}
