package com.tourism.app.repository;

import com.tourism.app.entity.Photo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PhotoRepository extends JpaRepository<Photo, Integer> {

    @Query("SELECT p FROM TourismPhoto p WHERE p.placeId = :placeId")
    List<Photo> findByPlaceId(@Param("placeId") String placeId);
}
