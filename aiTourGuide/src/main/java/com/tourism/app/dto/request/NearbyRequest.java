package com.tourism.app.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NearbyRequest {
    @NotNull
    private Double latitude;
    @NotNull
    private Double longitude;
    private Double radiusKm = 5.0;          // Bán kính tìm kiếm (km)
    private String placeType;               // Lọc theo loại
    private Integer limit = 10;
}
