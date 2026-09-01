import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, CalendarDays, ClipboardList, Users, UserCircle, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import AdminReviewTodoBell from './AdminReviewTodoBell';

const menuItems = [
  { path: '/admin', label: '数据看板', icon: BarChart3, end: true },
  { path: '/admin/events', label: '事件管理', icon: CalendarDays, end: false },
  { path: '/admin/activities', label: '活动管理', icon: ClipboardList, end: false },
  { path: '/admin/participations', label: '参与审核', icon: Users, end: false },
  { path: '/admin/surveys', label: '问卷管理', icon: ClipboardList, end: false },
  { path: '/admin/users', label: '用户管理', icon: UserCircle, end: false },
] as const;

export default function AdminLayout() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPage = menuItems.find((item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );

  // 侧栏内容（桌面固定侧栏与移动端抽屉共用）
  const sidebarContent = (
    <>
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2EB87A] rounded-lg flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="font-bold text-lg">CSR Admin</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive
                  ? 'bg-[#2EB87A]/10 text-[#2EB87A]'
                  : 'text-[#1A2E22]/70 hover:bg-gray-50 hover:text-[#1A2E22]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#2EB87A]' : 'text-[#1A2E22]/50'}`} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="text-left">
            <p className="text-sm font-bold">{user?.displayName}</p>
            <p className="text-xs text-[#1A2E22]/60">{user?.role === 'ADMIN' ? '系统管理员' : '员工'}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-[#1A2E22]/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F7FAF8] text-[#1A2E22] font-sans">
      {/* 桌面端固定左侧边栏（md 及以上显示） */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 flex-col z-20">
        {sidebarContent}
      </aside>

      {/* 移动端抽屉侧边栏 + 遮罩 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-[#1A2E22]/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 p-2 text-[#1A2E22]/60 hover:text-[#1A2E22] rounded-lg"
              aria-label="关闭菜单"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* 右侧主区域 */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* 顶部面包屑 */}
        <header className="h-16 bg-white/50 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 text-[#1A2E22]/60 hover:text-[#1A2E22] rounded-lg"
              aria-label="打开菜单"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center text-sm font-medium text-[#1A2E22]/60 min-w-0">
              <span className="hidden sm:inline">管理端</span>
              <span className="hidden sm:inline mx-2">/</span>
              <span className="text-[#1A2E22] truncate">{currentPage?.label ?? '未知页面'}</span>
            </div>
          </div>
          <AdminReviewTodoBell />
        </header>

        <div className="p-4 sm:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
