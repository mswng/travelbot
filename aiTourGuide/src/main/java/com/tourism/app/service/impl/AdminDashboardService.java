package com.tourism.app.service.impl;

import com.tourism.app.repository.PlaceRepository;
import com.tourism.app.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final PlaceRepository placeRepository;

    public DashboardStats getStats() {
        return DashboardStats.builder()
                .totalUsers(userRepository.count())
                .totalPlaces(placeRepository.count())
                .build();
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DashboardStats {
        private long totalUsers;
        private long totalPlaces;
    }
}
