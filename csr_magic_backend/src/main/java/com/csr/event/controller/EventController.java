package com.csr.event.controller;

import com.csr.common.ApiResponse;
import com.csr.event.dto.CreateEventRequest;
import com.csr.event.dto.EventResponse;
import com.csr.event.dto.UpdateEventRequest;
import com.csr.event.service.EventService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v2/events")
@PreAuthorize("hasRole('ADMIN')")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ApiResponse<Page<EventResponse>> list(
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        return ApiResponse.success(eventService.list(keyword, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<EventResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(eventService.getById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<EventResponse> create(@Valid @RequestBody CreateEventRequest request) {
        return ApiResponse.success(eventService.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<EventResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEventRequest request) {
        return ApiResponse.success(eventService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        eventService.delete(id);
        return ApiResponse.success(null);
    }
}
