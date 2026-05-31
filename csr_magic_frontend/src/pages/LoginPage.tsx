import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../services/authApi';
import { useAuthStore } from '../stores/authStore';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '../types/common';

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    try {
      const res = await authApi.login(data);
      const { accessToken, user } = res.data.data;
      setAuth(accessToken, user);

      // 根据角色跳转
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      const axiosErr = err as AxiosError<ApiResponse<null>>;
      const msg = axiosErr.response?.data?.message || '登录失败，请重试';
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#2EB87A]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-8 h-8 text-[#2EB87A]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A2E22] mb-2">Welcome to CSR Magic</h1>
          <p className="text-[#1A2E22]/60 leading-relaxed">
            登录以参与 CSR 活动或管理平台
          </p>
        </div>

        {/* 错误提示 */}
        {serverError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {serverError}
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[#1A2E22] mb-1.5">
              用户名
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2EB87A]/30 focus:border-[#2EB87A] transition-colors"
              placeholder="请输入用户名"
              {...register('username')}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#1A2E22] mb-1.5">
              密码
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2EB87A]/30 focus:border-[#2EB87A] transition-colors"
                placeholder="请输入密码"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#2EB87A] text-white py-3.5 rounded-xl font-medium hover:bg-[#2EB87A]/90 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '登录中...' : '登录'}
          </button>
        </form>

        {/* 注册链接 */}
        <p className="mt-6 text-center text-sm text-[#1A2E22]/60">
          还没有账号？{' '}
          <Link to="/register" className="text-[#2EB87A] font-medium hover:underline">
            去注册
          </Link>
        </p>
      </div>
    </div>
  );
}
