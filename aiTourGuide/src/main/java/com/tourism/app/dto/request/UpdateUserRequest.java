package com.tourism.app.dto.request;

import com.tourism.app.entity.User;
import lombok.Data;

@Data
public class UpdateUserRequest {
    private String name;
    private String email;
    private String password;
    private User.Role role;
    private Boolean enabled;
}
