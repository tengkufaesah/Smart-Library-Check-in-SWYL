"use client";

import { BarChart3 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import { CheckinRecord, SystemSettings } from '@/lib/types';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

interface StatsProps {
  records: CheckinRecord[];
  settings: SystemSettings;
}

export default function Stats({ records, settings }: StatsProps) {
  const checkins = records.filter(r => r.type === 'checkin');
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStr = todayStr.slice(0, 7);
  
  const todayRecords = checkins.filter(r => r.check_in_time && r.check_in_time.startsWith(todayStr));
  const monthRecords = checkins.filter(r => r.check_in_time && r.check_in_time.startsWith(monthStr));
  
  const completed = checkins.filter(r => r.check_out_time);
  const avgMin = completed.length > 0 
    ? Math.round(completed.reduce((s, r) => s + (new Date(r.check_out_time).getTime() - new Date(r.check_in_time).getTime()), 0) / completed.length / 60000)
    : 0;

  // Class Chart Data
  const classCounts: Record<string, number> = {};
  checkins.forEach(r => { 
    if (r.class_level && r.class_level !== '-') {
      classCounts[r.class_level] = (classCounts[r.class_level] || 0) + 1; 
    }
  });
  const classLabels = settings.classLevels;
  const classData = {
    labels: classLabels,
    datasets: [{
      label: 'จำนวนครั้ง',
      data: classLabels.map(l => classCounts[l] || 0),
      backgroundColor: ['#10b981','#14b8a6','#06b6d4','#6366f1','#a855f7','#f59e0b']
    }]
  };

  // Purpose Chart Data
  const purposeCounts: Record<string, number> = {};
  checkins.forEach(r => { 
    if (r.purpose) purposeCounts[r.purpose] = (purposeCounts[r.purpose] || 0) + 1; 
  });
  const purposeData = {
    labels: Object.keys(purposeCounts),
    datasets: [{
      data: Object.values(purposeCounts),
      backgroundColor: ['#10b981','#06b6d4','#6366f1','#f59e0b','#ef4444','#a855f7','#ec4899']
    }]
  };

  // Peak Hours Chart Data
  const hourCounts = new Array(24).fill(0);
  checkins.forEach(r => { 
    if (r.check_in_time) { 
      const h = new Date(r.check_in_time).getHours(); 
      hourCounts[h]++; 
    } 
  });
  const hourData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [{
      label: 'จำนวนครั้ง',
      data: hourCounts,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.1)',
      fill: true,
      tension: 0.3
    }]
  };

  // User Type Chart Data
  const utCounts: Record<string, number> = {};
  checkins.forEach(r => { 
    utCounts[r.user_type] = (utCounts[r.user_type] || 0) + 1; 
  });
  const utData = {
    labels: Object.keys(utCounts),
    datasets: [{
      data: Object.values(utCounts),
      backgroundColor: ['#10b981','#0d9488','#6366f1']
    }]
  };

  // Super Users
  const userVisits: Record<string, number> = {};
  checkins.forEach(r => { 
    userVisits[r.name] = (userVisits[r.name] || 0) + 1; 
  });
  const superUsers = Object.entries(userVisits).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).slice(0, 10);

  // Daily Usage Comparison (Last 7 Days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const dailyCounts = last7Days.map(date => 
    checkins.filter(r => r.check_in_time && r.check_in_time.startsWith(date)).length
  );
  const dailyData = {
    labels: last7Days.map(d => {
      const date = new Date(d);
      return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    }),
    datasets: [{
      label: 'จำนวนผู้เข้าใช้',
      data: dailyCounts,
      backgroundColor: '#10b981',
      borderRadius: 6,
    }]
  };

  return (
    <div className="page max-w-5xl mx-auto px-4 py-6 fade-in">
      <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 dark:text-white">
        <BarChart3 className="w-6 h-6 text-emerald-600" /> สถิติการใช้บริการ
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-black/10 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 p-4 text-center">
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{todayRecords.length}</p>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">เข้าใช้วันนี้</p>
        </div>
        <div className="bg-white dark:bg-black/10 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 p-4 text-center">
          <p className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">{monthRecords.length}</p>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">เข้าใช้เดือนนี้</p>
        </div>
        <div className="bg-white dark:bg-black/10 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 p-4 text-center">
          <p className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">{avgMin} นาที</p>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">เวลาเฉลี่ย</p>
        </div>
        <div className="bg-white dark:bg-black/10 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 p-4 text-center">
          <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{checkins.length}</p>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">เข้าใช้ทั้งหมด</p>
        </div>
      </div>

      <div className="bg-white dark:bg-black/10 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 p-5 mb-5">
        <h3 className="font-bold mb-4 text-sm flex items-center gap-2">📊 สถิติการเข้าใช้รายวัน (7 วันล่าสุด)</h3>
        <div className="h-64">
          <Bar 
            data={dailyData} 
            options={{ 
              responsive: true, 
              maintainAspectRatio: false, 
              plugins: { 
                legend: { display: false } 
              }, 
              scales: { 
                y: { 
                  beginAtZero: true, 
                  ticks: { stepSize: 1, color: '#94a3b8' },
                  grid: { color: 'rgba(148, 163, 184, 0.1)' }
                },
                x: {
                  ticks: { color: '#94a3b8' },
                  grid: { display: false }
                }
              } 
            }} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white dark:bg-black/10 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 p-5">
          <h3 className="font-bold mb-3 text-sm">📊 จำนวนผู้เข้าใช้แยกตามชั้นเรียน</h3>
          <div className="h-48">
            <Bar data={classData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }, x: { ticks: { color: '#94a3b8' } } } }} />
          </div>
        </div>
        <div className="bg-white dark:bg-black/10 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 p-5">
          <h3 className="font-bold mb-3 text-sm">📊 วัตถุประสงค์การเข้าใช้</h3>
          <div className="h-48 flex justify-center">
            <Doughnut data={purposeData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } } }} />
          </div>
        </div>
        <div className="bg-white dark:bg-black/10 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 p-5">
          <h3 className="font-bold mb-3 text-sm">📊 ช่วงเวลายอดนิยม (Peak Hours)</h3>
          <div className="h-48">
            <Line data={hourData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }, x: { ticks: { color: '#94a3b8' } } } }} />
          </div>
        </div>
        <div className="bg-white dark:bg-black/10 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 p-5">
          <h3 className="font-bold mb-3 text-sm">📊 ประเภทผู้ใช้</h3>
          <div className="h-48 flex justify-center">
            <Pie data={utData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } } }} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-black/10 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 p-5 mb-5">
        <h3 className="font-bold mb-3 flex items-center gap-2 dark:text-white">🏆 Super Users (มาบ่อยที่สุด)</h3>
        <div className="space-y-2 text-sm">
          {superUsers.length === 0 ? (
            <p className="text-slate-400">ยังไม่มีข้อมูล</p>
          ) : (
            superUsers.map(([name, count], i) => {
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
              return (
                <div key={name} className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                  <span className="dark:text-slate-200">{medal} {name}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{count} ครั้ง</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
