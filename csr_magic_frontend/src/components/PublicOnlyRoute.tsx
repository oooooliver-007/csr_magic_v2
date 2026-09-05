import { useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * 公开页守卫（登录/注册）：仅在「挂载时」已是登录态才重定向首页，
 * 避免登录表单提交过程中（setAuth 之后、navigate 之前）被本守卫抢先
 * 弹回首页，与登录后的目标页跳转产生竞态（BUG-04 防呆 + 管理员落地修复）。
 */
export default function PublicOnlyRoute() {
  // 挂载时快照登录态；之后不再响应变化（登录成功的跳转交给 LoginPage）
  const authenticatedAtMount = useRef(useAuthStore.getState().isAuthenticated).current;

  if (authenticatedAtMount) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}