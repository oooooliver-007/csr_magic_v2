# 前端参考实现 — Event（事件）模块

> 以事件管理模块为参考，展示前端的标准分层结构和代码模式。

## 文件结构

```
csr_magic_frontend/src/
├── services/
│   ├── apiClient.ts          # Axios 实例（统一 baseURL + 拦截器）
│   └── eventApi.ts           # 事件模块 API 封装
├── types/
│   └── event.ts              # 事件相关类型定义
├── pages/admin/
│   └── EventManagementPage.tsx  # 事件管理页面（表格+搜索+CRUD）
├── components/admin/
│   └── EventFormDrawer.tsx   # 事件创建/编辑抽屉组件
└── hooks/
    └── useEvents.ts          # 事件相关自定义 Hook（可选）
```

## 1. 类型定义（types/event.ts）

```typescript
export interface Event {
  id: number;
  name: string;
  description: string;
  type: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  startDate: string;      // ISO 8601
  endDate: string;
  coverImage: string | null;
  visible: boolean;
  activityCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  type: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  startDate: string;
  endDate: string;
  coverImage?: string;
  visible?: boolean;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {}

export interface EventListParams {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
}
```

## 2. API Service 封装（services/eventApi.ts）

```typescript
import apiClient from './apiClient';
import type { Event, CreateEventRequest, UpdateEventRequest, EventListParams } from '../types/event';
import type { PageResponse, ApiResponse } from '../types/common';

const BASE = '/api/v2/events';

export const eventApi = {
  list: (params: EventListParams = {}) =>
    apiClient.get<ApiResponse<PageResponse<Event>>>(BASE, { params }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Event>>(`${BASE}/${id}`),

  create: (data: CreateEventRequest) =>
    apiClient.post<ApiResponse<Event>>(BASE, data),

  update: (id: number, data: UpdateEventRequest) =>
    apiClient.put<ApiResponse<Event>>(`${BASE}/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`${BASE}/${id}`),
};
```

**关键模式**：
- 所有 API 通过 `apiClient`（Axios 实例）调用
- 返回类型使用泛型 `ApiResponse<T>` 包装
- 分页列表使用 `PageResponse<T>`
- 方法名使用动词：`list`、`getById`、`create`、`update`、`delete`

## 3. Axios 实例（services/apiClient.ts）

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：附加 Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一错误处理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## 4. 页面组件模式（pages/admin/EventManagementPage.tsx）

```tsx
import { useState, useEffect } from 'react';
import { eventApi } from '../../services/eventApi';
import type { Event } from '../../types/event';

export default function EventManagementPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventApi.list({ page, size: 20, keyword });
      setEvents(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch (error) {
      console.error('获取事件列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, keyword]);

  // ... 渲染表格、搜索栏、分页、操作按钮
}
```

**关键模式**：
- 通过 `services/` 层调用 API，不直接用 axios
- 完整的 loading + error 处理
- useEffect 依赖数组正确声明
- 中文注释说明关键逻辑

## 5. 响应式适配模式

```tsx
{/* 桌面端：表格 */}
<div className="hidden md:block">
  <table> ... </table>
</div>

{/* 移动端：卡片列表 */}
<div className="md:hidden space-y-3">
  {events.map((event) => (
    <div key={event.id} className="rounded-lg border p-4">
      <h3 className="font-medium">{event.name}</h3>
      {/* ... */}
    </div>
  ))}
</div>
```

**关键模式**：
- `md:` 为主断点（768px）
- 桌面用 `hidden md:block`，移动用 `md:hidden`
- 表格 → 卡片的切换模式
