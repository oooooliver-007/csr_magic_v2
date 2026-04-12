package com.csr.event.service;

import com.csr.event.dto.CreateEventRequest;
import com.csr.event.dto.EventResponse;
import com.csr.event.dto.UpdateEventRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EventService {
    Page<EventResponse> list(String keyword, Pageable pageable);
    EventResponse getById(Long id);
    EventResponse create(CreateEventRequest request);
    EventResponse update(Long id, UpdateEventRequest request);
    void delete(Long id);
}
