package com.tourism.app.repository;

import com.tourism.app.entity.Itinerary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItineraryRepository extends JpaRepository<Itinerary, Long> {

    Page<Itinerary> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("""
        SELECT i FROM Itinerary i
        WHERE i.user.id = :userId
        AND (:destination IS NULL OR LOWER(i.destination) LIKE LOWER(CONCAT('%',:destination,'%')))
        ORDER BY i.createdAt DESC
        """)
    List<Itinerary> findByUserAndDestination(
            @Param("userId") Long userId,
            @Param("destination") String destination
    );

    // Lấy tất cả để sync vào FAISS
    @Query("SELECT i FROM Itinerary i WHERE i.status = 'SAVED' ORDER BY i.createdAt DESC")
    List<Itinerary> findAllSaved();
}
