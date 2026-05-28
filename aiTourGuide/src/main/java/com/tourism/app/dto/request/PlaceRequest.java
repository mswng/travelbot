package com.tourism.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PlaceRequest {
    @NotBlank
    private String name;
    private String placeId;
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
}
