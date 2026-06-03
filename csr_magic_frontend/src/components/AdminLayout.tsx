import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, CalendarDays, ClipboardList, Users, UserCircle, LogOut } from 'lucide-react';
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

  const currentPage = menuItems.find((item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );

  return (
    <div className="min-h-screen bg-[#F7FAF8] text-[#1A2E22] font-sans flex">
      {/* 固定左侧边栏 */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2EB87A] rounded-lg flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="font-bold text-lg">CSR Admin</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
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
      </aside>

      {/* 右侧主区域 */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* 顶部面包屑 */}
        <header className="h-16 bg-white/50 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center text-sm font-medium text-[#1A2E22]/60">
            <span>管理端</span>
            <span className="mx-2">/</span>
            <span className="text-[#1A2E22]">{currentPage?.label ?? '未知页面'}</span>
          </div>
          <AdminReviewTodoBell />
        </header>

        <div className="p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
