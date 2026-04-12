import React from 'react';
import { Leaf } from 'lucide-react';

interface LoginPageProps {
  onLogin: (role: 'employee' | 'admin') => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="min-h-screen bg-[#F7FAF8] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[#2EB87A]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Leaf className="w-8 h-8 text-[#2EB87A]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A2E22] mb-2">Welcome to CSR Hub</h1>
        <p className="text-[#1A2E22]/60 mb-8 leading-relaxed">
          Join our community of changemakers. Log in to explore activities or manage the platform.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => onLogin('employee')}
            className="w-full bg-[#2EB87A] text-white py-3.5 rounded-xl font-medium hover:bg-[#2EB87A]/90 transition-colors shadow-sm"
          >
            Log in as Employee
          </button>
          <button
            onClick={() => onLogin('admin')}
            className="w-full bg-white text-[#1A2E22] border-2 border-[#E5E7EB] py-3.5 rounded-xl font-medium hover:border-[#2EB87A] hover:text-[#2EB87A] transition-colors"
          >
            Log in as Admin
          </button>
        </div>
      </div>
    </div>
  );
}
