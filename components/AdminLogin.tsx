"use client";

import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface AdminLoginProps {
  onLogin: (email: string, pass: string) => boolean;
  onBack: () => void;
}

export default function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(email, pass);
    if (!success) {
      setError(true);
    }
  };

  return (
    <div className="page max-w-md mx-auto px-4 py-12 fade-in">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
        <div className="text-center mb-5">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold">เข้าสู่ระบบผู้ดูแล</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">ชื่อผู้ใช้งาน</label> 
            <input 
              type="text" 
              required 
              placeholder="อีเมล" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">รหัสผ่าน</label> 
            <input 
              type="password" 
              required 
              placeholder="••••••" 
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm text-center mb-3">
              ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง
            </div>
          )}
          
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition text-sm">
            เข้าสู่ระบบ
          </button>
        </form>
        
        <button onClick={onBack} className="w-full mt-3 text-slate-500 hover:text-slate-700 text-sm font-medium py-2">
          ← กลับหน้าแรก
        </button>
      </div>
    </div>
  );
}
