import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './components/AdminLayout';
import EmployeeLayout from './components/EmployeeLayout';
import EventManagementPage from './pages/admin/EventManagementPage';
import ActivityManagementPage from './pages/admin/ActivityManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import ActivityListPage from './pages/ActivityListPage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import { useAuthStore } from './stores/authStore';

function HomePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-[#F7FAF8] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-[#1A2E22] mb-4">
          欢迎回来，{user?.displayName}
        </h1>
        <p className="text-[#1A2E22]/60 mb-6">
          角色：{user?.role === 'ADMIN' ? '管理员' : '员工'}
        </p>
        <button
          onClick={logout}
          className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 受保护路由 */}
      <Route element={<PrivateRoute />}>
        {/* 员工端路由 */}
        <Route element={<EmployeeLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/activities" element={<ActivityListPage />} />
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
        </Route>

        {/* 管理端路由 */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<HomePage />} />
          <Route path="events" element={<EventManagementPage />} />
          <Route path="activities" element={<ActivityManagementPage />} />
          <Route path="users" element={<UserManagementPage />} />
        </Route>
      </Route>

      {/* 兜底重定向 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
