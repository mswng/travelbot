package com.tourism.app.dto.response;

import com.tourism.app.entity.Itinerary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ItineraryResponse {
    private Long id;
    private String title;
    private String destination;
    private Integer durationDays;
    private String content;       // JSON lịch trình chi tiết
    private String summary;
    private LocalDate startDate;
    private Itinerary.Status status;
    private LocalDateTime createdAt;
}
