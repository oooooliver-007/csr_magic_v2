package com.csr.activity.service;

import com.csr.activity.dto.ActivityDetailResponse;
import com.csr.activity.dto.ActivityResponse;
import com.csr.activity.dto.CreateActivityRequest;
import com.csr.activity.dto.UpdateActivityRequest;
import com.csr.activity.entity.Activity;
import com.csr.activity.entity.TemplateType;
import com.csr.activity.exception.ActivityNotFoundException;
import com.csr.activity.repository.ActivityRepository;
import com.csr.common.BusinessException;
import com.csr.event.entity.Event;
import com.csr.event.exception.EventNotFoundException;
import com.csr.event.repository.EventRepository;
import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.repository.UserActivityRepository;
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
    private final UserActivityRepository userActivityRepository;

    public ActivityServiceImpl(ActivityRepository activityRepository,
                               EventRepository eventRepository,
                               UserActivityRepository userActivityRepository) {
        this.activityRepository = activityRepository;
        this.eventRepository = eventRepository;
        this.userActivityRepository = userActivityRepository;
    }

    @Override
    public Page<ActivityResponse> list(Long eventId, String status, String templateType, String keyword, Pageable pageable) {
        String effectiveStatus = (status != null && !status.isBlank()) ? status : null;
        String effectiveKeyword = (keyword != null && !keyword.isBlank()) ? keyword : null;
        String effectiveTemplateType = null;
        if (templateType != null && !templateType.isBlank()) {
            try {
                TemplateType.valueOf(templateType);
                effectiveTemplateType = templateType;
            } catch (IllegalArgumentException e) {
                log.warn("无效的模板类型筛选值: {}", templateType);
            }
        }
        Page<Activity> page = activityRepository.findByFilters(eventId, effectiveStatus, effectiveTemplateType, effectiveKeyword, pageable);
        return page.map(ActivityResponse::from);
    }

    @Override
    public ActivityResponse getById(Long id) {
        Activity activity = activityRepository.findById(id)
            .orElseThrow(() -> new ActivityNotFoundException(id));
        return ActivityResponse.from(activity);
    }

    @Override
    public ActivityDetailResponse getDetail(Long id, Long currentUserId) {
        Activity activity = activityRepository.findById(id)
            .orElseThrow(() -> new ActivityNotFoundException(id));

        long participantCount = userActivityRepository.countByActivityId(id);

        ParticipationResponse participation = null;
        if (currentUserId != null) {
            participation = userActivityRepository.findByUserIdAndActivityId(currentUserId, id)
                .map(ParticipationResponse::from)
                .orElse(null);
        }

        return ActivityDetailResponse.from(activity, participantCount, participation);
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
        activity.setFormSchema(resolveFormSchema(request.templateType(), request.formSchema()));

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
            activity.setFormSchema(resolveFormSchema(request.templateType(), request.formSchema()));
        } else if (request.formSchema() != null && activity.getTemplateType() == TemplateType.CUSTOM) {
            activity.setFormSchema(resolveFormSchema(TemplateType.CUSTOM, request.formSchema()));
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

    /**
     * 根据模板类型解析 formSchema：预设模板使用硬编码 schema，CUSTOM 模板使用前端传入的 schema
     */
    private String resolveFormSchema(TemplateType templateType, String customSchema) {
        return switch (templateType) {
            case BASIC -> "[{\"name\":\"note\",\"type\":\"text\",\"required\":false,\"label\":\"文字说明\"}]";
            case DONATION -> "[{\"name\":\"amount\",\"type\":\"number\",\"required\":true,\"label\":\"捐赠金额\"},{\"name\":\"message\",\"type\":\"text\",\"required\":false,\"label\":\"留言\"}]";
            case VOLUNTEER -> "[{\"name\":\"hours\",\"type\":\"number\",\"required\":true,\"label\":\"服务时长(小时)\"},{\"name\":\"photos\",\"type\":\"image\",\"required\":false,\"max\":5,\"label\":\"活动照片\"}]";
            case CHECKIN -> "[{\"name\":\"photo\",\"type\":\"image\",\"required\":false,\"max\":1,\"label\":\"签到照片\"}]";
            case CUSTOM -> {
                validateCustomFormSchema(customSchema);
                yield customSchema;
            }
        };
    }

    /**
     * 校验 CUSTOM 模板的 formSchema 格式
     */
    private void validateCustomFormSchema(String schema) {
        if (schema == null || schema.isBlank()) {
            throw new BusinessException(400, "自定义模板必须提供 formSchema");
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(schema);
            if (!root.isArray() || root.isEmpty()) {
                throw new BusinessException(400, "formSchema 必须是非空的 JSON 数组");
            }
            for (com.fasterxml.jackson.databind.JsonNode field : root) {
                if (!field.has("name") || !field.has("type")) {
                    throw new BusinessException(400, "formSchema 每个字段必须包含 name 和 type");
                }
                String type = field.get("type").asText();
                if (!type.equals("text") && !type.equals("number") && !type.equals("image") && !type.equals("boolean")) {
                    throw new BusinessException(400, "formSchema 字段类型只支持 text/number/image/boolean，不支持: " + type);
                }
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(400, "formSchema 格式错误，必须是有效的 JSON 数组");
        }
    }

    private Instant parseInstant(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return null;
        }
        return Instant.parse(dateStr);
    }
}
