package com.tourism.app.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity(name = "TourismPhoto")
@Table(name = "photos")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Photo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "place_id", length = 255)
    private String placeId;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;
}
