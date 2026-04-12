# 后端参考实现 — Event（事件）模块

> 以事件管理模块为参考，展示后端的标准分层结构和代码模式。

## 包结构

```
com.csr.event/
├── controller/
│   └── EventController.java
├── service/
│   ├── EventService.java          # 接口
│   └── EventServiceImpl.java      # 实现
├── repository/
│   └── EventRepository.java
├── entity/
│   └── Event.java
├── dto/
│   ├── CreateEventRequest.java
│   ├── UpdateEventRequest.java
│   └── EventResponse.java
└── exception/
    └── EventNotFoundException.java
```

## 1. Entity（entity/Event.java）

```java
package com.csr.event.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "event")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 20)
    private String type;  // OFFLINE / ONLINE / HYBRID

    private Instant startDate;
    private Instant endDate;

    @Column(columnDefinition = "TEXT")
    private String coverImage;

    @Column(nullable = false)
    private Boolean visible = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters ...
}
```

**关键模式**：
- 使用 `Instant` 存储时间（UTC）
- `@PrePersist` / `@PreUpdate` 自动设置时间戳
- 数据库字段 snake_case 由 JPA 自动映射（配置 `spring.jpa.hibernate.naming.physical-strategy`）

## 2. Repository（repository/EventRepository.java）

```java
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
```

**关键模式**：
- 继承 `JpaRepository<Entity, IdType>`
- 使用 Spring Data 方法命名约定
- 复杂查询使用 `@Query` 注解

## 3. DTO（dto/）

```java
// CreateEventRequest.java
package com.csr.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateEventRequest(
    @NotBlank @Size(max = 200) String name,
    String description,
    String type,
    String startDate,
    String endDate,
    String coverImage,
    Boolean visible
) {}
```

```java
// EventResponse.java
package com.csr.event.dto;

import com.csr.event.entity.Event;

public record EventResponse(
    Long id,
    String name,
    String description,
    String type,
    String startDate,
    String endDate,
    String coverImage,
    Boolean visible,
    String createdAt,
    String updatedAt
) {
    public static EventResponse from(Event entity) {
        return new EventResponse(
            entity.getId(),
            entity.getName(),
            entity.getDescription(),
            entity.getType(),
            entity.getStartDate() != null ? entity.getStartDate().toString() : null,
            entity.getEndDate() != null ? entity.getEndDate().toString() : null,
            entity.getCoverImage(),
            entity.getVisible(),
            entity.getCreatedAt().toString(),
            entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null
        );
    }
}
```

**关键模式**：
- 使用 Java record 作为 DTO（简洁不可变）
- 请求 DTO 使用 Jakarta Validation 注解
- 响应 DTO 提供 `from(Entity)` 静态工厂方法进行转换
- 时间字段转为 ISO 8601 字符串

## 4. Service（service/）

```java
// EventService.java — 接口
package com.csr.event.service;

import com.csr.event.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EventService {
    Page<EventResponse> list(String keyword, Pageable pageable);
    EventResponse getById(Long id);
    EventResponse create(CreateEventRequest request);
    EventResponse update(Long id, UpdateEventRequest request);
    void delete(Long id);
}
```

```java
// EventServiceImpl.java — 实现
package com.csr.event.service;

import com.csr.event.dto.*;
import com.csr.event.entity.Event;
import com.csr.event.exception.EventNotFoundException;
import com.csr.event.repository.EventRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;

    public EventServiceImpl(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
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
        // ... 设置其他字段
        Event saved = eventRepository.save(event);
        return EventResponse.from(saved);
    }

    @Override
    @Transactional
    public EventResponse update(Long id, UpdateEventRequest request) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> new EventNotFoundException(id));
        // ... 更新非 null 字段
        Event saved = eventRepository.save(event);
        return EventResponse.from(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new EventNotFoundException(id);
        }
        eventRepository.deleteById(id);
    }
}
```

**关键模式**：
- Service 接口 + Impl 实现分离
- 类级别 `@Transactional(readOnly = true)`，写方法单独 `@Transactional`
- 构造函数注入（不用 @Autowired）
- 查找不到时抛出自定义业务异常

## 5. Controller（controller/EventController.java）

```java
package com.csr.event.controller;

import com.csr.common.ApiResponse;
import com.csr.event.dto.*;
import com.csr.event.service.EventService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v2/events")
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
```

**关键模式**：
- `@RequestMapping("/api/v2/{resource}")` 统一前缀
- 所有响应使用 `ApiResponse<T>` 包装
- `@Valid` 触发 DTO 参数校验
- Controller 只做参数接收和响应包装，逻辑在 Service 层
- Pageable 由 Spring 自动解析 `?page=0&size=20&sort=createdAt,desc`

## 6. 统一响应（common/ApiResponse.java）

```java
package com.csr.common;

public record ApiResponse<T>(int code, String message, T data) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "success", data);
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }
}
```
