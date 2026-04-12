package com.csr.event.repository;

import com.csr.event.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface EventRepository extends JpaRepository<Event, Long> {

    Page<Event> findByNameContainingIgnoreCase(String keyword, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.visible = true ORDER BY e.createdAt DESC")
    Page<Event> findVisibleEvents(Pageable pageable);
}
