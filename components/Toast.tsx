"use client";

import { CheckCircle, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

export default function Toast({ message, type, visible }: ToastProps) {
  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]">
      <div className={`px-6 py-3 rounded-xl shadow-lg font-medium text-sm toast-show flex items-center gap-2 text-white ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
        {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        <span>{message}</span>
      </div>
    </div>
  );
}
