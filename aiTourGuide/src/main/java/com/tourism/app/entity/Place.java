package com.tourism.app.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity(name = "TourismPlace")
@Table(name = "places")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Place {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "place_id", unique = true, length = 255)
    private String placeId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "address", length = 1000)
    private String address;

    @Column(name = "city", length = 200)
    private String city;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "website", length = 500)
    private String website;

    @Column(name = "opening_hours", columnDefinition = "TEXT")
    private String openingHours;

    @Column(name = "place_type", length = 100)
    private String placeType;

    @Column(name = "price_level")
    private Integer priceLevel;

    @Column(name = "price_range", length = 200)
    private String priceRange;

    @Column(name = "rating", precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(name = "total_ratings")
    private Integer totalRatings;

    @Column(name = "source", length = 50)
    private String source;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", referencedColumnName = "place_id",
                insertable = false, updatable = false)
    private List<Photo> photos;
}
