package com.csr.activity.service;

import com.csr.activity.dto.ActivityDetailResponse;
import com.csr.activity.dto.ActivityResponse;
import com.csr.activity.dto.CreateActivityRequest;
import com.csr.activity.dto.UpdateActivityRequest;
import com.csr.activity.entity.Activity;
import com.csr.activity.entity.TemplateType;
import com.csr.activity.exception.ActivityNotFoundException;
import com.csr.activity.repository.ActivityRepository;
import com.csr.auth.entity.User;
import com.csr.common.BusinessException;
import com.csr.event.entity.Event;
import com.csr.event.exception.EventNotFoundException;
import com.csr.event.repository.EventRepository;
import com.csr.participation.entity.ParticipationState;
import com.csr.participation.entity.UserActivity;
import com.csr.participation.repository.UserActivityRepository;
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

    @Mock
    private UserActivityRepository userActivityRepository;

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
        testActivity.setTemplateType(TemplateType.VOLUNTEER);
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
        when(activityRepository.findByFilters(isNull(), isNull(), isNull(), isNull(), eq(pageable))).thenReturn(page);

        Page<ActivityResponse> result = activityService.list(null, null, null, null, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("春季植树活动", result.getContent().get(0).name());
        verify(activityRepository).findByFilters(isNull(), isNull(), isNull(), isNull(), eq(pageable));
    }

    @Test
    @DisplayName("获取活动列表：按事件筛选")
    void list_byEventId() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Activity> page = new PageImpl<>(List.of(testActivity), pageable, 1);
        when(activityRepository.findByFilters(eq(1L), isNull(), isNull(), isNull(), eq(pageable))).thenReturn(page);

        Page<ActivityResponse> result = activityService.list(1L, null, null, null, pageable);

        assertEquals(1, result.getTotalElements());
        verify(activityRepository).findByFilters(eq(1L), isNull(), isNull(), isNull(), eq(pageable));
    }

    @Test
    @DisplayName("获取活动列表：按状态+关键字组合筛选")
    void list_byStatusAndKeyword() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Activity> page = new PageImpl<>(List.of(testActivity), pageable, 1);
        when(activityRepository.findByFilters(isNull(), eq("UPCOMING"), isNull(), eq("植树"), eq(pageable))).thenReturn(page);

        Page<ActivityResponse> result = activityService.list(null, "UPCOMING", null, "植树", pageable);

        assertEquals(1, result.getTotalElements());
        verify(activityRepository).findByFilters(isNull(), eq("UPCOMING"), isNull(), eq("植树"), eq(pageable));
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
            1L, "新活动", TemplateType.DONATION, "捐赠活动描述",
            "2026-05-01T00:00:00Z", "2026-05-31T00:00:00Z",
            100, null, null, null
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
            999L, "新活动", TemplateType.BASIC, null, null, null, null, null, null, null
        );
        when(eventRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(EventNotFoundException.class, () -> activityService.create(request));
        verify(activityRepository, never()).save(any());
    }

    @Test
    @DisplayName("创建活动：status 为 null 时默认 UPCOMING")
    void create_defaultStatus() {
        CreateActivityRequest request = new CreateActivityRequest(
            1L, "默认状态活动", TemplateType.BASIC, null, null, null, null, null, null, null
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
            null, "更新后的名称", null, null, null, null, null, null, "ONGOING", null
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
            2L, null, null, null, null, null, null, null, null, null
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
            null, "不存在", null, null, null, null, null, null, null, null
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

    // === 模板系统测试 ===

    @Test
    @DisplayName("创建活动：BASIC 模板自动设置默认 formSchema")
    void create_basicTemplateAutoSchema() {
        CreateActivityRequest request = new CreateActivityRequest(
            1L, "基础活动", TemplateType.BASIC, null, null, null, null, null, null, null
        );
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(activityRepository.save(any(Activity.class))).thenAnswer(inv -> {
            Activity a = inv.getArgument(0);
            a.setId(10L);
            ReflectionTestUtils.setField(a, "createdAt", Instant.now());
            return a;
        });

        ActivityResponse response = activityService.create(request);

        assertNotNull(response.formSchema());
        assertTrue(response.formSchema().contains("note"));
    }

    @Test
    @DisplayName("创建活动：DONATION 模板 formSchema 包含 amount 和 message")
    void create_donationTemplateSchema() {
        CreateActivityRequest request = new CreateActivityRequest(
            1L, "捐赠活动", TemplateType.DONATION, null, null, null, null, null, null, null
        );
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(activityRepository.save(any(Activity.class))).thenAnswer(inv -> {
            Activity a = inv.getArgument(0);
            a.setId(11L);
            ReflectionTestUtils.setField(a, "createdAt", Instant.now());
            return a;
        });

        ActivityResponse response = activityService.create(request);

        assertNotNull(response.formSchema());
        assertTrue(response.formSchema().contains("amount"));
        assertTrue(response.formSchema().contains("message"));
    }

    @Test
    @DisplayName("创建活动：VOLUNTEER 模板 formSchema 包含 hours 和 photos")
    void create_volunteerTemplateSchema() {
        CreateActivityRequest request = new CreateActivityRequest(
            1L, "志愿者活动", TemplateType.VOLUNTEER, null, null, null, null, null, null, null
        );
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(activityRepository.save(any(Activity.class))).thenAnswer(inv -> {
            Activity a = inv.getArgument(0);
            a.setId(12L);
            ReflectionTestUtils.setField(a, "createdAt", Instant.now());
            return a;
        });

        ActivityResponse response = activityService.create(request);

        assertNotNull(response.formSchema());
        assertTrue(response.formSchema().contains("hours"));
        assertTrue(response.formSchema().contains("photos"));
    }

    @Test
    @DisplayName("创建活动：CHECKIN 模板 formSchema 包含 photo")
    void create_checkinTemplateSchema() {
        CreateActivityRequest request = new CreateActivityRequest(
            1L, "签到活动", TemplateType.CHECKIN, null, null, null, null, null, null, null
        );
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(activityRepository.save(any(Activity.class))).thenAnswer(inv -> {
            Activity a = inv.getArgument(0);
            a.setId(13L);
            ReflectionTestUtils.setField(a, "createdAt", Instant.now());
            return a;
        });

        ActivityResponse response = activityService.create(request);

        assertNotNull(response.formSchema());
        assertTrue(response.formSchema().contains("photo"));
    }

    @Test
    @DisplayName("创建活动：CUSTOM 模板无 formSchema 时抛出 BusinessException")
    void create_customTemplateNoSchema() {
        CreateActivityRequest request = new CreateActivityRequest(
            1L, "自定义活动", TemplateType.CUSTOM, null, null, null, null, null, null, null
        );
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> activityService.create(request));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("formSchema"));
    }

    @Test
    @DisplayName("创建活动：CUSTOM 模板 formSchema 格式错误时抛出 BusinessException")
    void create_customTemplateInvalidSchema() {
        CreateActivityRequest request = new CreateActivityRequest(
            1L, "自定义活动", TemplateType.CUSTOM, null, null, null, null, null, null, "invalid-json"
        );
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> activityService.create(request));
        assertEquals(400, ex.getCode());
    }

    @Test
    @DisplayName("创建活动：CUSTOM 模板有效 formSchema 正确保存")
    void create_customTemplateValidSchema() {
        String validSchema = "[{\"name\":\"feedback\",\"type\":\"text\",\"required\":true}]";
        CreateActivityRequest request = new CreateActivityRequest(
            1L, "自定义活动", TemplateType.CUSTOM, null, null, null, null, null, null, validSchema
        );
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(activityRepository.save(any(Activity.class))).thenAnswer(inv -> {
            Activity a = inv.getArgument(0);
            a.setId(14L);
            ReflectionTestUtils.setField(a, "createdAt", Instant.now());
            return a;
        });

        ActivityResponse response = activityService.create(request);

        assertNotNull(response.formSchema());
        assertTrue(response.formSchema().contains("feedback"));
    }

    @Test
    @DisplayName("更新活动：切换模板类型时自动更新 formSchema")
    void update_changeTemplateType() {
        UpdateActivityRequest request = new UpdateActivityRequest(
            null, null, TemplateType.DONATION, null, null, null, null, null, null, null
        );
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(activityRepository.save(any(Activity.class))).thenReturn(testActivity);

        activityService.update(1L, request);

        assertEquals(TemplateType.DONATION, testActivity.getTemplateType());
        assertNotNull(testActivity.getFormSchema());
        assertTrue(testActivity.getFormSchema().contains("amount"));
    }

    // === getDetail 测试 ===

    @Test
    @DisplayName("getDetail：存在活动且用户未参与时返回 participation 为 null")
    void getDetail_noParticipation() {
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.countByActivityId(1L)).thenReturn(5L);
        when(userActivityRepository.findByUserIdAndActivityId(100L, 1L)).thenReturn(Optional.empty());

        ActivityDetailResponse response = activityService.getDetail(1L, 100L);

        assertEquals(1L, response.id());
        assertEquals("春季植树活动", response.name());
        assertEquals(5L, response.currentParticipants());
        assertNull(response.currentUserParticipation());
    }

    @Test
    @DisplayName("getDetail：存在活动且用户已参与时返回 participation")
    void getDetail_withParticipation() {
        User testUser = new User();
        testUser.setId(100L);

        UserActivity ua = new UserActivity();
        ua.setId(1L);
        ua.setUser(testUser);
        ua.setActivity(testActivity);
        ua.setState(ParticipationState.PENDING);
        ReflectionTestUtils.setField(ua, "createdAt", Instant.parse("2026-04-10T00:00:00Z"));

        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.countByActivityId(1L)).thenReturn(10L);
        when(userActivityRepository.findByUserIdAndActivityId(100L, 1L)).thenReturn(Optional.of(ua));

        ActivityDetailResponse response = activityService.getDetail(1L, 100L);

        assertEquals(1L, response.id());
        assertEquals(10L, response.currentParticipants());
        assertNotNull(response.currentUserParticipation());
        assertEquals("PENDING", response.currentUserParticipation().state());
        assertEquals(100L, response.currentUserParticipation().userId());
    }

    @Test
    @DisplayName("getDetail：currentUserId 为 null 时不查询参与状态")
    void getDetail_nullUser() {
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.countByActivityId(1L)).thenReturn(0L);

        ActivityDetailResponse response = activityService.getDetail(1L, null);

        assertNull(response.currentUserParticipation());
        verify(userActivityRepository, never()).findByUserIdAndActivityId(anyLong(), anyLong());
    }

    @Test
    @DisplayName("getDetail：活动不存在时抛出 ActivityNotFoundException")
    void getDetail_notFound() {
        when(activityRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ActivityNotFoundException.class, () -> activityService.getDetail(999L, 100L));
    }

    // === 家属同行测试 ===

    @Test
    @DisplayName("创建活动：allowFamily=true 且 maxFamilyPerUser 有效时正确保存")
    void create_allowFamilyWithValidMax() {
        CreateActivityRequest request = new CreateActivityRequest(
            1L, "家属活动", TemplateType.BASIC, null, null, null, null, null, null, null,
            true, 3
        );
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(activityRepository.save(any(Activity.class))).thenAnswer(inv -> {
            Activity a = inv.getArgument(0);
            a.setId(20L);
            ReflectionTestUtils.setField(a, "createdAt", Instant.now());
            return a;
        });

        ActivityResponse response = activityService.create(request);

        assertTrue(response.allowFamily());
        assertEquals(3, response.maxFamilyPerUser());
    }

    @Test
    @DisplayName("创建活动：allowFamily=true 但 maxFamilyPerUser < 1 时抛出 BusinessException")
    void create_allowFamilyInvalidMax() {
        CreateActivityRequest request = new CreateActivityRequest(
            1L, "家属活动", TemplateType.BASIC, null, null, null, null, null, null, null,
            true, 0
        );
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> activityService.create(request));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("家属"));
    }

    @Test
    @DisplayName("创建活动：allowFamily=false 时 maxFamilyPerUser 被清空为 null")
    void create_allowFamilyFalseClearsMax() {
        CreateActivityRequest request = new CreateActivityRequest(
            1L, "普通活动", TemplateType.BASIC, null, null, null, null, null, null, null,
            false, 5
        );
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(activityRepository.save(any(Activity.class))).thenAnswer(inv -> {
            Activity a = inv.getArgument(0);
            a.setId(21L);
            ReflectionTestUtils.setField(a, "createdAt", Instant.now());
            return a;
        });

        ActivityResponse response = activityService.create(request);

        assertFalse(response.allowFamily());
        assertNull(response.maxFamilyPerUser());
    }

    @Test
    @DisplayName("更新活动：开启 allowFamily 并设置有效上限")
    void update_enableAllowFamily() {
        UpdateActivityRequest request = new UpdateActivityRequest(
            null, null, null, null, null, null, null, null, null, null,
            true, 2
        );
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(activityRepository.save(any(Activity.class))).thenReturn(testActivity);

        activityService.update(1L, request);

        assertTrue(testActivity.isAllowFamily());
        assertEquals(2, testActivity.getMaxFamilyPerUser());
    }

    @Test
    @DisplayName("更新活动：关闭 allowFamily 时 maxFamilyPerUser 被清空")
    void update_disableAllowFamily() {
        testActivity.setAllowFamily(true);
        testActivity.setMaxFamilyPerUser(3);

        UpdateActivityRequest request = new UpdateActivityRequest(
            null, null, null, null, null, null, null, null, null, null,
            false, null
        );
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(activityRepository.save(any(Activity.class))).thenReturn(testActivity);

        activityService.update(1L, request);

        assertFalse(testActivity.isAllowFamily());
        assertNull(testActivity.getMaxFamilyPerUser());
    }
}
