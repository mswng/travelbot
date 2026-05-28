package com.tourism.app.repository;

import com.tourism.app.entity.Place;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaceRepository extends JpaRepository<Place, Integer> {

    Optional<Place> findByPlaceId(String placeId);

    @Query("""
        SELECT p FROM TourismPlace p
        WHERE (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(p.address) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
        AND (:placeType IS NULL OR LOWER(p.placeType) LIKE LOWER(CONCAT('%', :placeType, '%')))
        AND (:city IS NULL OR LOWER(p.city) = LOWER(:city))
        """)
    Page<Place> searchPlaces(
            @Param("keyword") String keyword,
            @Param("placeType") String placeType,
            @Param("city") String city,
            Pageable pageable
    );

    @Query("SELECT DISTINCT p.city FROM TourismPlace p WHERE p.city IS NOT NULL ORDER BY p.city")
    List<String> findAllCities();

    @Query("SELECT DISTINCT p.placeType FROM TourismPlace p WHERE p.placeType IS NOT NULL ORDER BY p.placeType")
    List<String> findAllPlaceTypes();

    @Query("SELECT p FROM TourismPlace p WHERE p.rating IS NOT NULL ORDER BY p.rating DESC")
    List<Place> findTopRated(Pageable pageable);
}
