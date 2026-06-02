package com.tourism.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ItineraryRequest {
    @NotBlank
    private String destination;
    @NotNull
    private Integer durationDays;
    private LocalDate startDate;
    private String preferences; // "ẩm thực, thiên nhiên, văn hóa..."
    private String budget;      // "tiết kiệm / trung bình / cao cấp"
}
