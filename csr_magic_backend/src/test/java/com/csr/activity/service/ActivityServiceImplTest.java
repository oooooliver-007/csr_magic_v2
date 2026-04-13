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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityServiceImplTest {

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private EventRepository eventRepository;

    @InjectMocks
    private ActivityServiceImpl activityService;

    private Event testEvent;
    private Activity testActivity;

    @BeforeEach
    void setUp() {
        testEvent = new Event();
        testEvent.setId(1L);
        testEvent.setName("2026春季CSR月");
        ReflectionTestUtils.setField(testEvent, "createdAt", Instant.parse("2026-03-15T00:00:00Z"));

        testActivity = new Activity();
        testActivity.setId(1L);
        testActivity.setEvent(testEvent);
        testActivity.setName("春季植树活动");
        testActivity.setDescription("参与植树造林");
        testActivity.setTemplateType("VOLUNTEER");
        testActivity.setStartTime(Instant.parse("2026-04-15T00:00:00Z"));
        testActivity.setEndTime(Instant.parse("2026-04-16T00:00:00Z"));
        testActivity.setMaxParticipants(50);
        testActivity.setStatus("UPCOMING");
        ReflectionTestUtils.setField(testActivity, "createdAt", Instant.parse("2026-04-01T00:00:00Z"));
    }

    // === 列表查询测试 ===

    @Test
    @DisplayName("获取活动列表：无筛选条件返回全部分页")
    void list_noFilters() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Activity> page = new PageImpl<>(List.of(testActivity), pageable, 1);
        when(activityRepository.findAll(pageable)).thenReturn(page);

        Page<ActivityResponse> result = activityService.list(null, null, null, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("春季植树活动", result.getContent().get(0).name());
        verify(activityRepository).findAll(pageable);
    }

    @Test
    @DisplayName("获取活动列表：按事件筛选")
    void list_byEventId() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Activity> page = new PageImpl<>(List.of(testActivity), pageable, 1);
        when(activityRepository.findByEventId(1L, pageable)).thenReturn(page);

        Page<ActivityResponse> result = activityService.list(1L, null, null, pageable);

        assertEquals(1, result.getTotalElements());
        verify(activityRepository).findByEventId(1L, pageable);
    }

    @Test
    @DisplayName("获取活动列表：按状态+关键字组合筛选")
    void list_byStatusAndKeyword() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Activity> page = new PageImpl<>(List.of(testActivity), pageable, 1);
        when(activityRepository.findByStatusAndNameContainingIgnoreCase("UPCOMING", "植树", pageable)).thenReturn(page);

        Page<ActivityResponse> result = activityService.list(null, "UPCOMING", "植树", pageable);

        assertEquals(1, result.getTotalElements());
        verify(activityRepository).findByStatusAndNameContainingIgnoreCase("UPCOMING", "植树", pageable);
    }

    // === 详情查询测试 ===

    @Test
    @DisplayName("获取活动详情：存在时返回 ActivityResponse")
    void getById_success() {
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));

        ActivityResponse response = activityService.getById(1L);

        assertEquals(1L, response.id());
        assertEquals("春季植树活动", response.name());
        assertEquals("VOLUNTEER", response.templateType());
        assertEquals(1L, response.eventId());
        assertEquals("2026春季CSR月", response.eventName());
    }

    @Test
    @DisplayName("获取活动详情：不存在时抛出 ActivityNotFoundException")
    void getById_notFound() {
        when(activityRepository.findById(999L)).thenReturn(Optional.empty());

        ActivityNotFoundException ex = assertThrows(ActivityNotFoundException.class,
            () -> activityService.getById(999L));
        assertEquals(404, ex.getCode());
    }

    // === 创建测试 ===

    @Test
    @DisplayName("创建活动：全部字段正确保存")
    void create_success() {
        CreateActivityRequest request = new CreateActivityRequest(
            1L, "新活动", "DONATION", "捐赠活动描述",
            "2026-05-01T00:00:00Z", "2026-05-31T00:00:00Z",
            100, null, null
        );

        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(activityRepository.save(any(Activity.class))).thenAnswer(inv -> {
            Activity a = inv.getArgument(0);
            a.setId(2L);
            ReflectionTestUtils.setField(a, "createdAt", Instant.now());
            return a;
        });

        ActivityResponse response = activityService.create(request);

        assertNotNull(response);
        assertEquals(2L, response.id());
        assertEquals("新活动", response.name());
        assertEquals("DONATION", response.templateType());
        verify(eventRepository).findById(1L);
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    @DisplayName("创建活动：所属事件不存在时抛出 EventNotFoundException")
    void create_eventNotFound() {
        CreateActivityRequest request = new CreateActivityRequest(
            999L, "新活动", "BASIC", null, null, null, null, null, null
        );
        when(eventRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(EventNotFoundException.class, () -> activityService.create(request));
        verify(activityRepository, never()).save(any());
    }

    @Test
    @DisplayName("创建活动：status 为 null 时默认 UPCOMING")
    void create_defaultStatus() {
        CreateActivityRequest request = new CreateActivityRequest(
            1L, "默认状态活动", "BASIC", null, null, null, null, null, null
        );

        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(activityRepository.save(any(Activity.class))).thenAnswer(inv -> {
            Activity a = inv.getArgument(0);
            a.setId(3L);
            // 模拟 @PrePersist 行为
            ReflectionTestUtils.setField(a, "createdAt", Instant.now());
            if (a.getStatus() == null) {
                a.setStatus("UPCOMING");
            }
            return a;
        });

        ActivityResponse response = activityService.create(request);

        assertEquals("UPCOMING", response.status());
    }

    // === 更新测试 ===

    @Test
    @DisplayName("更新活动：部分字段更新成功")
    void update_partialFields() {
        UpdateActivityRequest request = new UpdateActivityRequest(
            null, "更新后的名称", null, null, null, null, null, null, "ONGOING"
        );

        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(activityRepository.save(any(Activity.class))).thenReturn(testActivity);

        ActivityResponse response = activityService.update(1L, request);

        assertNotNull(response);
        assertEquals("更新后的名称", testActivity.getName());
        assertEquals("ONGOING", testActivity.getStatus());
        assertEquals("参与植树造林", testActivity.getDescription()); // 未修改
        verify(activityRepository).save(testActivity);
    }

    @Test
    @DisplayName("更新活动：切换所属事件")
    void update_changeEvent() {
        Event newEvent = new Event();
        newEvent.setId(2L);
        newEvent.setName("新事件");
        ReflectionTestUtils.setField(newEvent, "createdAt", Instant.now());

        UpdateActivityRequest request = new UpdateActivityRequest(
            2L, null, null, null, null, null, null, null, null
        );

        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(eventRepository.findById(2L)).thenReturn(Optional.of(newEvent));
        when(activityRepository.save(any(Activity.class))).thenReturn(testActivity);

        activityService.update(1L, request);

        assertEquals(newEvent, testActivity.getEvent());
    }

    @Test
    @DisplayName("更新活动：不存在时抛出 ActivityNotFoundException")
    void update_notFound() {
        UpdateActivityRequest request = new UpdateActivityRequest(
            null, "不存在", null, null, null, null, null, null, null
        );
        when(activityRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ActivityNotFoundException.class, () -> activityService.update(999L, request));
    }

    // === 删除测试 ===

    @Test
    @DisplayName("删除活动：存在时成功删除")
    void delete_success() {
        when(activityRepository.existsById(1L)).thenReturn(true);

        activityService.delete(1L);

        verify(activityRepository).deleteById(1L);
    }

    @Test
    @DisplayName("删除活动：不存在时抛出 ActivityNotFoundException")
    void delete_notFound() {
        when(activityRepository.existsById(999L)).thenReturn(false);

        assertThrows(ActivityNotFoundException.class, () -> activityService.delete(999L));
        verify(activityRepository, never()).deleteById(anyLong());
    }
}
