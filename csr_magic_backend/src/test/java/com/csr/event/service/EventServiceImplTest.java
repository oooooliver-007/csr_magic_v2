package com.csr.event.service;

import com.csr.audit.service.AuditLogService;
import com.csr.event.dto.CreateEventRequest;
import com.csr.event.dto.EventResponse;
import com.csr.event.dto.UpdateEventRequest;
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
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private EventServiceImpl eventService;

    private Event testEvent;

    @BeforeEach
    void setUp() {
        testEvent = new Event();
        testEvent.setId(1L);
        testEvent.setName("2026春季CSR月");
        testEvent.setDescription("春季CSR活动集合");
        testEvent.setType("OFFLINE");
        testEvent.setStartDate(Instant.parse("2026-04-01T00:00:00Z"));
        testEvent.setEndDate(Instant.parse("2026-04-30T00:00:00Z"));
        testEvent.setVisible(true);
        ReflectionTestUtils.setField(testEvent, "createdAt", Instant.parse("2026-03-15T00:00:00Z"));
    }

    // === 列表查询测试 ===

    @Test
    @DisplayName("获取事件列表：无关键字返回全部分页")
    void list_noKeyword() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Event> page = new PageImpl<>(List.of(testEvent), pageable, 1);
        when(eventRepository.findAll(pageable)).thenReturn(page);

        Page<EventResponse> result = eventService.list(null, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("2026春季CSR月", result.getContent().get(0).name());
        verify(eventRepository).findAll(pageable);
    }

    @Test
    @DisplayName("获取事件列表：有关键字按名称模糊搜索")
    void list_withKeyword() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Event> page = new PageImpl<>(List.of(testEvent), pageable, 1);
        when(eventRepository.findByNameContainingIgnoreCase("春季", pageable)).thenReturn(page);

        Page<EventResponse> result = eventService.list("春季", pageable);

        assertEquals(1, result.getTotalElements());
        verify(eventRepository).findByNameContainingIgnoreCase("春季", pageable);
    }

    @Test
    @DisplayName("获取事件列表：空白关键字等同无关键字")
    void list_blankKeyword() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Event> page = new PageImpl<>(List.of(), pageable, 0);
        when(eventRepository.findAll(pageable)).thenReturn(page);

        Page<EventResponse> result = eventService.list("   ", pageable);

        assertEquals(0, result.getTotalElements());
        verify(eventRepository).findAll(pageable);
    }

    // === 详情查询测试 ===

    @Test
    @DisplayName("获取事件详情：存在时返回 EventResponse")
    void getById_success() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));

        EventResponse response = eventService.getById(1L);

        assertEquals(1L, response.id());
        assertEquals("2026春季CSR月", response.name());
        assertEquals("OFFLINE", response.type());
    }

    @Test
    @DisplayName("获取事件详情：不存在时抛出 EventNotFoundException")
    void getById_notFound() {
        when(eventRepository.findById(999L)).thenReturn(Optional.empty());

        EventNotFoundException ex = assertThrows(EventNotFoundException.class,
            () -> eventService.getById(999L));
        assertEquals(404, ex.getCode());
    }

    // === 创建测试 ===

    @Test
    @DisplayName("创建事件：全部字段正确保存")
    void create_success() {
        CreateEventRequest request = new CreateEventRequest(
            "新事件", "描述", "ONLINE",
            "2026-05-01T00:00:00Z", "2026-05-31T00:00:00Z",
            null, true
        );

        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> {
            Event e = inv.getArgument(0);
            e.setId(2L);
            ReflectionTestUtils.setField(e, "createdAt", Instant.now());
            return e;
        });

        EventResponse response = eventService.create(request);

        assertNotNull(response);
        assertEquals(2L, response.id());
        assertEquals("新事件", response.name());
        verify(eventRepository).save(any(Event.class));
    }

    @Test
    @DisplayName("创建事件：visible 为 null 时默认 true")
    void create_defaultVisible() {
        CreateEventRequest request = new CreateEventRequest(
            "默认显示事件", null, null, null, null, null, null
        );

        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> {
            Event e = inv.getArgument(0);
            e.setId(3L);
            ReflectionTestUtils.setField(e, "createdAt", Instant.now());
            return e;
        });

        EventResponse response = eventService.create(request);

        assertTrue(response.visible());
    }

    // === 更新测试 ===

    @Test
    @DisplayName("更新事件：部分字段更新成功")
    void update_success() {
        UpdateEventRequest request = new UpdateEventRequest(
            "更新后的名称", null, null, null, null, null, null
        );

        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(eventRepository.save(any(Event.class))).thenReturn(testEvent);

        EventResponse response = eventService.update(1L, request);

        assertNotNull(response);
        assertEquals("更新后的名称", testEvent.getName());
        assertEquals("春季CSR活动集合", testEvent.getDescription());
        verify(eventRepository).save(testEvent);
    }

    @Test
    @DisplayName("更新事件：不存在时抛出 EventNotFoundException")
    void update_notFound() {
        UpdateEventRequest request = new UpdateEventRequest(
            "不存在", null, null, null, null, null, null
        );
        when(eventRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(EventNotFoundException.class, () -> eventService.update(999L, request));
    }

    // === 删除测试 ===

    @Test
    @DisplayName("删除事件：存在时成功删除")
    void delete_success() {
        when(eventRepository.existsById(1L)).thenReturn(true);

        eventService.delete(1L);

        verify(eventRepository).deleteById(1L);
    }

    @Test
    @DisplayName("删除事件：不存在时抛出 EventNotFoundException")
    void delete_notFound() {
        when(eventRepository.existsById(999L)).thenReturn(false);

        assertThrows(EventNotFoundException.class, () -> eventService.delete(999L));
        verify(eventRepository, never()).deleteById(anyLong());
    }
}