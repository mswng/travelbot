package com.tourism.app.config;

import com.tourism.app.entity.User;
import com.tourism.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            if (!userRepository.existsByEmail("admin@tourism.com")) {
                User admin = User.builder()
                        .email("admin@tourism.com")
                        .password(passwordEncoder.encode("Admin@123"))
                        .name("Super Admin")
                        .role(User.Role.ROLE_ADMIN)
                        .provider(User.AuthProvider.LOCAL)
                        .enabled(true)
                        .build();
                userRepository.save(admin);
                log.info("✅ Admin mặc định đã tạo: admin@tourism.com / Admin@123");
            }
        };
    }
}
