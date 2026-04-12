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

const REGIONS = [
  '北京', '上海', '广州', '深圳', '杭州',
  '成都', '武汉', '南京', '西安', '重庆',
];

const registerSchema = z.object({
  displayName: z.string().min(1, '姓名不能为空'),
  username: z.string().min(1, '用户名不能为空').max(50, '用户名最长50字符'),
  password: z.string().min(6, '密码至少6位'),
  region: z.string().optional(),
  gender: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError('');
    try {
      const res = await authApi.register(data);
      const { accessToken, refreshToken, user } = res.data.data;
      setAuth(accessToken, refreshToken, user);

      // 注册成功自动登录，跳转首页
      navigate('/', { replace: true });
    } catch (err) {
      const axiosErr = err as AxiosError<ApiResponse<null>>;
      const msg = axiosErr.response?.data?.message || '注册失败，请重试';
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
          <h1 className="text-2xl font-bold text-[#1A2E22] mb-2">创建账号</h1>
          <p className="text-[#1A2E22]/60 leading-relaxed">
            加入 CSR Magic，开始参与公益活动
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
          {/* 姓名 */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-[#1A2E22] mb-1.5">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              id="displayName"
              type="text"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2EB87A]/30 focus:border-[#2EB87A] transition-colors"
              placeholder="请输入真实姓名"
              {...register('displayName')}
            />
            {errors.displayName && (
              <p className="mt-1 text-xs text-red-500">{errors.displayName.message}</p>
            )}
          </div>

          {/* 用户名 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[#1A2E22] mb-1.5">
              用户名 <span className="text-red-500">*</span>
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

          {/* 密码 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#1A2E22] mb-1.5">
              密码 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2EB87A]/30 focus:border-[#2EB87A] transition-colors"
                placeholder="至少6位"
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

          {/* 地区 */}
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-[#1A2E22] mb-1.5">
              所在地区
            </label>
            <select
              id="region"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2EB87A]/30 focus:border-[#2EB87A] transition-colors bg-white"
              {...register('region')}
            >
              <option value="">请选择地区</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* 性别 */}
          <div>
            <label className="block text-sm font-medium text-[#1A2E22] mb-1.5">
              性别
            </label>
            <div className="flex gap-4">
              {(['男', '女'] as const).map((g) => (
                <label key={g} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={g}
                    className="w-4 h-4 text-[#2EB87A] focus:ring-[#2EB87A]"
                    {...register('gender')}
                  />
                  <span className="text-sm text-[#1A2E22]">{g}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#2EB87A] text-white py-3.5 rounded-xl font-medium hover:bg-[#2EB87A]/90 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '注册中...' : '注册'}
          </button>
        </form>

        {/* 登录链接 */}
        <p className="mt-6 text-center text-sm text-[#1A2E22]/60">
          已有账号？{' '}
          <Link to="/login" className="text-[#2EB87A] font-medium hover:underline">
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
