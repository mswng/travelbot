package com.tourism.app.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tourism.app.dto.request.ItineraryRequest;
import com.tourism.app.dto.response.ItineraryResponse;
import com.tourism.app.dto.response.PageResponse;
import com.tourism.app.entity.Itinerary;
import com.tourism.app.entity.User;
import com.tourism.app.exception.ResourceNotFoundException;
import com.tourism.app.repository.ItineraryRepository;
import com.tourism.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ItineraryService {

    private final ItineraryRepository itineraryRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    private static final String FASTAPI_URL = "http://localhost:8001";

    private final WebClient webClient = WebClient.builder()
            .baseUrl(FASTAPI_URL)
            .build();

    // ── Tạo lịch trình bằng AI ───────────────────────────────────────────────

    @Transactional
    public ItineraryResponse generateItinerary(ItineraryRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);

        // Gọi FastAPI để AI tạo lịch trình
        Map<String, Object> payload = Map.of(
                "destination",   request.getDestination(),
                "duration_days", request.getDurationDays(),
                "start_date",    request.getStartDate() != null
                                 ? request.getStartDate().toString() : "",
                "preferences",   request.getPreferences() != null
                                 ? request.getPreferences() : "",
                "budget",        request.getBudget() != null
                                 ? request.getBudget() : "trung bình"
        );

        Map response;
        try {
            response = webClient.post()
                    .uri("/itinerary/generate")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            log.error("FastAPI itinerary error: {}", e.getMessage());
            throw new RuntimeException("Không thể tạo lịch trình, vui lòng thử lại.");
        }

        String title   = (String) response.getOrDefault("title",   "Lịch trình " + request.getDestination());
        String content = (String) response.getOrDefault("content", "");
        String summary = (String) response.getOrDefault("summary", "");

        // Lưu vào MySQL
        Itinerary itinerary = Itinerary.builder()
                .user(user)
                .title(title)
                .destination(request.getDestination())
                .durationDays(request.getDurationDays())
                .startDate(request.getStartDate())
                .content(content)
                .summary(summary)
                .status(Itinerary.Status.SAVED)
                .build();
        itinerary = itineraryRepository.save(itinerary);

        // Sync sang FAISS (async, không block response)
        syncItineraryToFaiss(itinerary);

        return mapToResponse(itinerary);
    }

    // ── CRUD lịch trình ──────────────────────────────────────────────────────

    public PageResponse<ItineraryResponse> getUserItineraries(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Page<Itinerary> page = itineraryRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        return PageResponse.<ItineraryResponse>builder()
                .content(page.getContent().stream().map(this::mapToResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public ItineraryResponse getById(Long id, String userEmail) {
        Itinerary it = itineraryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Itinerary", id));
        return mapToResponse(it);
    }

    @Transactional
    public void deleteItinerary(Long id, String userEmail) {
        Itinerary it = itineraryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Itinerary", id));
        itineraryRepository.delete(it);
    }

    // ── Sync tất cả itineraries sang FAISS ──────────────────────────────────

    public void syncAllToFaiss() {
        List<Itinerary> itineraries = itineraryRepository.findAllSaved();
        log.info("Syncing {} itineraries to FAISS...", itineraries.size());
        try {
            List<Map<String, Object>> payload = itineraries.stream()
                    .map(it -> Map.<String, Object>of(
                            "id",          it.getId(),
                            "title",       it.getTitle(),
                            "destination", it.getDestination() != null ? it.getDestination() : "",
                            "summary",     it.getSummary() != null ? it.getSummary() : "",
                            "content",     it.getContent()
                    ))
                    .toList();

            webClient.post()
                    .uri("/itinerary/index")
                    .bodyValue(Map.of("itineraries", payload))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .subscribe(
                            r -> log.info("FAISS sync done: {}", r),
                            e -> log.error("FAISS sync error: {}", e.getMessage())
                    );
        } catch (Exception e) {
            log.error("Error syncing itineraries: {}", e.getMessage());
        }
    }

    private void syncItineraryToFaiss(Itinerary it) {
        try {
            webClient.post()
                    .uri("/itinerary/index")
                    .bodyValue(Map.of("itineraries", List.of(Map.of(
                            "id",          it.getId(),
                            "title",       it.getTitle(),
                            "destination", it.getDestination() != null ? it.getDestination() : "",
                            "summary",     it.getSummary() != null ? it.getSummary() : "",
                            "content",     it.getContent()
                    ))))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .subscribe(
                            r -> log.info("Itinerary {} synced to FAISS", it.getId()),
                            e -> log.warn("FAISS sync skipped: {}", e.getMessage())
                    );
        } catch (Exception e) {
            log.warn("Could not sync to FAISS: {}", e.getMessage());
        }
    }

    private ItineraryResponse mapToResponse(Itinerary i) {
        return ItineraryResponse.builder()
                .id(i.getId())
                .title(i.getTitle())
                .destination(i.getDestination())
                .durationDays(i.getDurationDays())
                .content(i.getContent())
                .summary(i.getSummary())
                .startDate(i.getStartDate())
                .status(i.getStatus())
                .createdAt(i.getCreatedAt())
                .build();
    }
}
