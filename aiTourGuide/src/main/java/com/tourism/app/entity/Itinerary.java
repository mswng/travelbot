package com.tourism.app.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "itineraries")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Itinerary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 200)
    private String destination;

    @Column(name = "duration_days")
    private Integer durationDays;

    // Toàn bộ lịch trình dạng JSON string
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    // Tóm tắt ngắn để index vào FAISS
    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.SAVED;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Status {
        DRAFT, SAVED, ARCHIVED
    }
}
