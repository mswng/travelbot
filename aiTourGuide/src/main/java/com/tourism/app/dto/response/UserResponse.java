package com.tourism.app.dto.response;

import com.tourism.app.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String name;
    private String avatarUrl;
    private User.Role role;
    private User.AuthProvider provider;
    private boolean enabled;
    private LocalDateTime createdAt;
}
