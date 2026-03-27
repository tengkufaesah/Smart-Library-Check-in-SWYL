"use client";

import { useState, useMemo } from 'react';
import { Users as UsersIcon, Search } from 'lucide-react';
import { CheckinRecord } from '@/lib/types';

export default function Users({ records }: { records: CheckinRecord[] }) {
  const [search, setSearch] = useState('');

  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, any>();
    records.forEach(r => {
      const key = r.user_type === 'นักเรียน' ? r.student_id : r.name;
      if (!key) return;
      
      if (!userMap.has(key)) {
        userMap.set(key, {
          id: key,
          name: r.name,
          student_id: r.student_id,
          class_level: r.class_level,
          user_type: r.user_type,
          visits: 1,
          last_visit: r.check_in_time
        });
      } else {
        const user = userMap.get(key);
        user.visits += 1;
        if (new Date(r.check_in_time) > new Date(user.last_visit)) {
          user.last_visit = r.check_in_time;
        }
      }
    });
    return Array.from(userMap.values()).sort((a, b) => b.visits - a.visits);
  }, [records]);

  const filteredUsers = uniqueUsers.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    (u.student_id && u.student_id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page max-w-5xl mx-auto px-4 py-6 fade-in">
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 mb-5">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <UsersIcon className="w-6 h-6 text-blue-500" /> ข้อมูลผู้ใช้งานทั้งหมด
        </h2>
        
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ หรือรหัสนักเรียน..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">ชื่อ-นามสกุล</th>
                <th className="px-4 py-3">รหัส/ประเภท</th>
                <th className="px-4 py-3">ชั้นเรียน</th>
                <th className="px-4 py-3 text-center">จำนวนเข้าใช้</th>
                <th className="px-4 py-3 rounded-tr-lg">ใช้งานล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? filteredUsers.map((u, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3">
                    {u.user_type === 'นักเรียน' ? u.student_id : <span className="text-teal-600 text-xs bg-teal-50 px-2 py-1 rounded-full">ครู/บุคลากร</span>}
                  </td>
                  <td className="px-4 py-3">{u.class_level !== '-' ? u.class_level : ''}</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600">{u.visits}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(u.last_visit).toLocaleDateString('th-TH')} {new Date(u.last_visit).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">ไม่พบข้อมูลผู้ใช้งาน</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
