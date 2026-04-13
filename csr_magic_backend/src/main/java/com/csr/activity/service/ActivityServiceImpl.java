package com.csr.activity.service;

import com.csr.activity.dto.ActivityResponse;
import com.csr.activity.dto.CreateActivityRequest;
import com.csr.activity.dto.UpdateActivityRequest;
import com.csr.activity.entity.Activity;
import com.csr.activity.exception.ActivityNotFoundException;
import com.csr.activity.repository.ActivityRepository;
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
public class ActivityServiceImpl implements ActivityService {

    private static final Logger log = LoggerFactory.getLogger(ActivityServiceImpl.class);

    private final ActivityRepository activityRepository;
    private final EventRepository eventRepository;

    public ActivityServiceImpl(ActivityRepository activityRepository, EventRepository eventRepository) {
        this.activityRepository = activityRepository;
        this.eventRepository = eventRepository;
    }

    @Override
    public Page<ActivityResponse> list(Long eventId, String status, String keyword, Pageable pageable) {
        boolean hasEvent = eventId != null;
        boolean hasStatus = status != null && !status.isBlank();
        boolean hasKeyword = keyword != null && !keyword.isBlank();

        Page<Activity> page;
        if (hasEvent && hasStatus && hasKeyword) {
            page = activityRepository.findByEventIdAndStatusAndNameContainingIgnoreCase(eventId, status, keyword, pageable);
        } else if (hasEvent && hasStatus) {
            page = activityRepository.findByEventIdAndStatus(eventId, status, pageable);
        } else if (hasEvent && hasKeyword) {
            page = activityRepository.findByEventIdAndNameContainingIgnoreCase(eventId, keyword, pageable);
        } else if (hasStatus && hasKeyword) {
            page = activityRepository.findByStatusAndNameContainingIgnoreCase(status, keyword, pageable);
        } else if (hasEvent) {
            page = activityRepository.findByEventId(eventId, pageable);
        } else if (hasStatus) {
            page = activityRepository.findByStatus(status, pageable);
        } else if (hasKeyword) {
            page = activityRepository.findByNameContainingIgnoreCase(keyword, pageable);
        } else {
            page = activityRepository.findAll(pageable);
        }
        return page.map(ActivityResponse::from);
    }

    @Override
    public ActivityResponse getById(Long id) {
        Activity activity = activityRepository.findById(id)
            .orElseThrow(() -> new ActivityNotFoundException(id));
        return ActivityResponse.from(activity);
    }

    @Override
    @Transactional
    public ActivityResponse create(CreateActivityRequest request) {
        Event event = eventRepository.findById(request.eventId())
            .orElseThrow(() -> new EventNotFoundException(request.eventId()));

        Activity activity = new Activity();
        activity.setEvent(event);
        activity.setName(request.name());
        activity.setDescription(request.description());
        activity.setTemplateType(request.templateType());
        activity.setStartTime(parseInstant(request.startTime()));
        activity.setEndTime(parseInstant(request.endTime()));
        activity.setMaxParticipants(request.maxParticipants());
        activity.setCoverImage(request.coverImage());
        if (request.status() != null && !request.status().isBlank()) {
            activity.setStatus(request.status());
        }

        Activity saved = activityRepository.save(activity);
        log.info("创建活动成功，ID: {}, 名称: {}, 所属事件: {}", saved.getId(), saved.getName(), event.getName());
        return ActivityResponse.from(saved);
    }

    @Override
    @Transactional
    public ActivityResponse update(Long id, UpdateActivityRequest request) {
        Activity activity = activityRepository.findById(id)
            .orElseThrow(() -> new ActivityNotFoundException(id));

        if (request.eventId() != null) {
            Event event = eventRepository.findById(request.eventId())
                .orElseThrow(() -> new EventNotFoundException(request.eventId()));
            activity.setEvent(event);
        }
        if (request.name() != null) {
            activity.setName(request.name());
        }
        if (request.description() != null) {
            activity.setDescription(request.description());
        }
        if (request.templateType() != null) {
            activity.setTemplateType(request.templateType());
        }
        if (request.startTime() != null) {
            activity.setStartTime(parseInstant(request.startTime()));
        }
        if (request.endTime() != null) {
            activity.setEndTime(parseInstant(request.endTime()));
        }
        if (request.maxParticipants() != null) {
            activity.setMaxParticipants(request.maxParticipants());
        }
        if (request.coverImage() != null) {
            activity.setCoverImage(request.coverImage());
        }
        if (request.status() != null) {
            activity.setStatus(request.status());
        }

        Activity saved = activityRepository.save(activity);
        log.info("更新活动成功，ID: {}", saved.getId());
        return ActivityResponse.from(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!activityRepository.existsById(id)) {
            throw new ActivityNotFoundException(id);
        }
        activityRepository.deleteById(id);
        log.info("删除活动成功，ID: {}", id);
    }

    private Instant parseInstant(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return null;
        }
        return Instant.parse(dateStr);
    }
}
