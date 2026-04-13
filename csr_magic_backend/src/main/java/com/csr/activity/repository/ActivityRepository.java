package com.csr.activity.repository;

import com.csr.activity.entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    Page<Activity> findByNameContainingIgnoreCase(String keyword, Pageable pageable);

    Page<Activity> findByEventId(Long eventId, Pageable pageable);

    Page<Activity> findByStatus(String status, Pageable pageable);

    Page<Activity> findByEventIdAndStatus(Long eventId, String status, Pageable pageable);

    Page<Activity> findByEventIdAndNameContainingIgnoreCase(Long eventId, String keyword, Pageable pageable);

    Page<Activity> findByStatusAndNameContainingIgnoreCase(String status, String keyword, Pageable pageable);

    Page<Activity> findByEventIdAndStatusAndNameContainingIgnoreCase(Long eventId, String status, String keyword, Pageable pageable);
}
