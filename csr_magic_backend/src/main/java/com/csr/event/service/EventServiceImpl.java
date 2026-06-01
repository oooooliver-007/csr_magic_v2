package com.csr.event.service;

import com.csr.audit.service.AuditLogService;
import com.csr.event.dto.CreateEventRequest;
import com.csr.event.dto.EventResponse;
import com.csr.event.dto.UpdateEventRequest;
import com.csr.event.entity.Event;
import com.csr.event.exception.EventNotFoundException;
import com.csr.event.repository.EventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Transactional(readOnly = true)
public class EventServiceImpl implements EventService {

    private static final Logger log = LoggerFactory.getLogger(EventServiceImpl.class);

    private final EventRepository eventRepository;
    private final AuditLogService auditLogService;

    public EventServiceImpl(EventRepository eventRepository, AuditLogService auditLogService) {
        this.eventRepository = eventRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    public Page<EventResponse> list(String keyword, Pageable pageable) {
        Page<Event> page;
        if (keyword != null && !keyword.isBlank()) {
            page = eventRepository.findByNameContainingIgnoreCase(keyword, pageable);
        } else {
            page = eventRepository.findAll(pageable);
        }
        return page.map(EventResponse::from);
    }

    @Override
    public EventResponse getById(Long id) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> new EventNotFoundException(id));
        return EventResponse.from(event);
    }

    @Override
    @Transactional
    public EventResponse create(CreateEventRequest request) {
        Event event = new Event();
        event.setName(request.name());
        event.setDescription(request.description());
        event.setType(request.type());
        event.setStartDate(parseInstant(request.startDate()));
        event.setEndDate(parseInstant(request.endDate()));
        event.setCoverImage(request.coverImage());
        event.setVisible(request.visible() != null ? request.visible() : true);

        Event saved = eventRepository.save(event);
        auditLogService.log(null, "CREATE", "EVENT", saved.getId(), "创建事件: " + saved.getName());
        log.info("创建事件成功，ID: {}, 名称: {}", saved.getId(), saved.getName());
        return EventResponse.from(saved);
    }

    @Override
    @Transactional
    public EventResponse update(Long id, UpdateEventRequest request) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> new EventNotFoundException(id));

        if (request.name() != null) {
            event.setName(request.name());
        }
        if (request.description() != null) {
            event.setDescription(request.description());
        }
        if (request.type() != null) {
            event.setType(request.type());
        }
        if (request.startDate() != null) {
            event.setStartDate(parseInstant(request.startDate()));
        }
        if (request.endDate() != null) {
            event.setEndDate(parseInstant(request.endDate()));
        }
        if (request.coverImage() != null) {
            event.setCoverImage(request.coverImage());
        }
        if (request.visible() != null) {
            event.setVisible(request.visible());
        }

        Event saved = eventRepository.save(event);
        auditLogService.log(null, "UPDATE", "EVENT", saved.getId(), "更新事件: " + saved.getName());
        log.info("更新事件成功，ID: {}", saved.getId());
        return EventResponse.from(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new EventNotFoundException(id);
        }
        auditLogService.log(null, "DELETE", "EVENT", id, "删除事件");
        eventRepository.deleteById(id);
        log.info("删除事件成功，ID: {}", id);
    }

    private Instant parseInstant(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return null;
        }
        return Instant.parse(dateStr);
    }
}