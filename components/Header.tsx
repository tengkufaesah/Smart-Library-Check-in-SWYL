"use client";

import { Home, BarChart3, Shield, Settings, Moon, Sun, Info, LogOut, Users } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { SystemSettings } from '@/lib/types';
import Image from 'next/image';

interface HeaderProps {
  currentPage: string;
  setPage: (page: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  settings: SystemSettings;
}

export default function Header({ currentPage, setPage, isDarkMode, toggleDarkMode, settings }: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showAboutInfo = () => {
    alert('ระบบเช็คอินห้องสมุด (Smart Library Check-in)\n\nเวอร์ชัน: 1.0\nพัฒนาโดย: นางสาวเต็งกูฟาอีซะห์ พระศรีณวงค์\n\nระบบนี้ใช้เพื่อบันทึกการเข้าใช้บริการห้องสมุดของโรงเรียนเฉลิมพระเกียรติสมเด็จพระศรีนครินทร์ ยะลา');
    setSettingsOpen(false);
  };

  if (currentPage === 'admin') return null;

  return (
    <header className="shadow-lg relative z-50" style={{ background: 'linear-gradient(to right, #982598, #FFDBFD, #BDA6CE)' }}>
      {/* Top Right Actions */}
      <div className="absolute top-3 right-3 md:top-4 md:right-6 flex items-center gap-2 z-10">
        <button onClick={() => setPage('users')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${currentPage === 'users' ? 'bg-black/10 border-black/20 text-black' : 'border-black/10 text-black/70 hover:bg-black/5'}`}>
          <Users className="w-4 h-4" /><span className="hidden sm:inline">ผู้ใช้งาน</span>
        </button> 
        <button onClick={() => setPage('admin')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${currentPage === 'admin' ? 'bg-black/10 border-black/20 text-black' : 'border-black/10 text-black/70 hover:bg-black/5'}`}>
          <Shield className="w-4 h-4" /><span className="hidden sm:inline">ผู้ดูแลระบบ</span>
        </button> 
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col items-center justify-center text-center mt-6 md:mt-0">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 md:w-20 md:h-20 relative">
            <Image 
              src="https://img2.imgbiz.com/imgbiz/logo-design.png" 
              alt="School Logo" 
              fill
              className="object-contain" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: '#4a3a5a' }}>
              Smart Library Check-in
            </h1>
            <p className="text-lg md:text-2xl font-bold leading-tight" style={{ color: '#ffffff' }}>
              {settings.schoolName}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-3 flex-wrap justify-center">
          <button onClick={() => setPage('home')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${currentPage === 'home' ? 'bg-black/10 border-black/20 text-black' : 'border-black/10 text-black/70 hover:bg-black/5'}`}>
            <Home className="w-4 h-4" /><span>หน้าแรก</span>
          </button> 
          <button onClick={() => setPage('stats')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${currentPage === 'stats' ? 'bg-black/10 border-black/20 text-black' : 'border-black/10 text-black/70 hover:bg-black/5'}`}>
            <BarChart3 className="w-4 h-4" /><span>สถิติ</span>
          </button> 
          <div className="relative" ref={menuRef}>
            <button onClick={() => setSettingsOpen(!settingsOpen)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition border border-black/10 text-black/70 hover:bg-black/5">
              <Settings className="w-4 h-4" /><span>ตั้งค่า</span>
            </button>
            
            {settingsOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white dark:bg-[#C8AAAA] rounded-lg shadow-lg border border-slate-200 dark:border-white/20 z-50 min-w-48 text-slate-800 dark:text-white">
                <div className="p-2">
                  <button 
                    onClick={() => !isDarkMode && toggleDarkMode()} 
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${isDarkMode ? 'bg-black/20 text-white font-bold' : 'hover:bg-slate-100 text-slate-600'}`}
                  >
                    <Moon className="w-4 h-4" /><span>โหมดมืด</span>
                  </button> 
                  <button 
                    onClick={() => isDarkMode && toggleDarkMode()} 
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${!isDarkMode ? 'bg-slate-100 text-slate-900 font-bold' : 'hover:bg-black/10 text-white/70'}`}
                  >
                    <Sun className="w-4 h-4" /><span>โหมดสว่าง</span>
                  </button> 
                  <button onClick={() => { setPage('home'); setSettingsOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-black/10 transition flex items-center gap-2">
                    <Home className="w-4 h-4" /><span>กลับหน้าแรก</span>
                  </button>
                  <hr className="my-2 dark:border-white/20" />
                  <button onClick={showAboutInfo} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-black/10 transition flex items-center gap-2">
                    <Info className="w-4 h-4" /><span>เกี่ยวกับระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
