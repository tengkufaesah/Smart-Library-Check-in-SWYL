"use client";

import { useState, useEffect, useRef } from 'react';
import { UserCheck, LogIn, LogOut, History, List, Search, User } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckinRecord, SystemSettings, Member } from '@/lib/types';

interface HomeProps {
  records: CheckinRecord[];
  showToast: (msg: string, type: 'success' | 'error') => void;
  settings: SystemSettings;
}

export default function Home({ records, showToast, settings }: HomeProps) {
  const [userType, setUserType] = useState<'student' | 'teacher'>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Database State
  const [members, setMembers] = useState<Member[]>([]);
  const [suggestions, setSuggestions] = useState<Member[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeInput, setActiveInput] = useState<'student' | 'teacher' | null>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'members'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      setMembers(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value: string, type: 'student' | 'teacher') => {
    if (type === 'student') setSName(value);
    else setTName(value);

    if (value.trim().length > 1) {
      const filtered = members.filter(m => 
        (m.name.toLowerCase().includes(value.toLowerCase()) || m.student_id.toLowerCase().includes(value.toLowerCase())) &&
        (type === 'student' ? m.user_type === 'นักเรียน' : m.user_type === 'ครู/บุคลากร')
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
      setActiveInput(type);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectMember = (m: Member) => {
    if (m.user_type === 'นักเรียน') {
      setSId(m.student_id);
      setSName(m.name);
      setSClass(m.class_level);
      // Try to extract prefix if possible, or just keep as is
      if (m.name.startsWith('เด็กชาย')) setSPrefix('เด็กชาย');
      else if (m.name.startsWith('เด็กหญิง')) setSPrefix('เด็กหญิง');
      else if (m.name.startsWith('นาย')) setSPrefix('นาย');
      else if (m.name.startsWith('นางสาว')) setSPrefix('นางสาว');
    } else {
      setTName(m.name);
      if (m.name.startsWith('นาย')) setTPrefix('นาย');
      else if (m.name.startsWith('นางสาว')) setTPrefix('นางสาว');
      else if (m.name.startsWith('นาง')) setTPrefix('นาง');
    }
    setShowSuggestions(false);
  };
  
  // Student Form State
  const [sId, setSId] = useState('');
  const [sPrefix, setSPrefix] = useState('');
  const [sName, setSName] = useState('');
  const [sClass, setSClass] = useState('');
  const [sPurpose, setSPurpose] = useState('');

  // Teacher Form State
  const [tPrefix, setTPrefix] = useState('');
  const [tName, setTName] = useState('');
  const [tPurpose, setTPurpose] = useState('');

  // Checkout & History State
  const [checkoutQuery, setCheckoutQuery] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyResults, setHistoryResults] = useState<CheckinRecord[] | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter(r => r.check_in_time && r.check_in_time.startsWith(todayStr));
  const monthRecords = records.filter(r => r.check_in_time && r.check_in_time.startsWith(todayStr.slice(0, 7)));
  
  const completed = records.filter(r => r.check_out_time);
  const avgMin = completed.length > 0 
    ? Math.round(completed.reduce((s, r) => s + (new Date(r.check_out_time).getTime() - new Date(r.check_in_time).getTime()), 0) / completed.length / 60000)
    : 0;

  const handleStudentCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sId || !sPrefix || !sName || !sClass || !sPurpose) {
      showToast('กรุณากรอกข้อมูลให้ครบทุกช่อง', 'error');
      return;
    }

    const fullName = `${sPrefix} ${sName}`;
    const existing = records.find(r => r.student_id === sId && r.check_in_time.startsWith(todayStr) && !r.is_checked_out);
    
    if (existing) {
      showToast('นักเรียนคนนี้เช็คอินอยู่แล้ว กรุณาเช็คเอาท์ก่อน', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'checkins'), {
        type: 'checkin',
        name: fullName,
        student_id: sId,
        class_level: sClass,
        user_type: 'นักเรียน',
        purpose: sPurpose,
        check_in_time: new Date().toISOString(),
        check_out_time: '',
        is_checked_out: false
      });
      showToast(`✅ เช็คอินสำเร็จ: ${fullName}`, 'success');
      setSId(''); setSPrefix(''); setSName(''); setSClass(''); setSPurpose('');
    } catch (error) {
      showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTeacherCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tPrefix || !tName || !tPurpose) {
      showToast('กรุณากรอกข้อมูลให้ครบทุกช่อง', 'error');
      return;
    }

    const fullName = `${tPrefix} ${tName}`;
    const existing = records.find(r => r.name === fullName && r.user_type === 'ครู/บุคลากร' && r.check_in_time.startsWith(todayStr) && !r.is_checked_out);
    
    if (existing) {
      showToast('ท่านเช็คอินอยู่แล้ว กรุณาเช็คเอาท์ก่อน', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'checkins'), {
        type: 'checkin',
        name: fullName,
        student_id: '',
        class_level: '-',
        user_type: 'ครู/บุคลากร',
        purpose: tPurpose,
        check_in_time: new Date().toISOString(),
        check_out_time: '',
        is_checked_out: false
      });
      showToast(`✅ เช็คอินสำเร็จ: ${fullName}`, 'success');
      setTPrefix(''); setTName(''); setTPurpose('');
    } catch (error) {
      showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    const query = checkoutQuery.trim().toLowerCase();
    if (!query) {
      showToast('กรุณากรอกเลขประจำตัว หรือชื่อ', 'error');
      return;
    }

    const record = records.find(r => !r.is_checked_out && 
      (r.student_id.toLowerCase() === query || r.name.toLowerCase().includes(query)));

    if (!record || !record.id) {
      showToast('ไม่พบผู้ใช้ที่กำลังเช็คอินอยู่', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'checkins', record.id), {
        check_out_time: new Date().toISOString(),
        is_checked_out: true
      });
      showToast(`👋 เช็คเอาท์สำเร็จ: ${record.name}`, 'success');
      setCheckoutQuery('');
    } catch (error) {
      showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const searchActivity = () => {
    const query = historyQuery.trim().toLowerCase();
    if (!query) {
      setHistoryResults(null);
      return;
    }
    const results = records.filter(r => 
      r.student_id.toLowerCase() === query || r.name.toLowerCase().includes(query)
    ).sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime());
    
    setHistoryResults(results);
  };

  return (
    <div className="page max-w-5xl mx-auto px-4 py-6 fade-in">
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold mb-1 dark:text-white">ยินดีต้อนรับสู่ห้องสมุดโรงเรียน</h2>
        <p className="text-slate-500 dark:text-slate-300 text-sm mt-1">กรอกเลขประจำตัว หรือลงชื่อเพื่อเช็คอินเข้าใช้บริการ</p>
      </div>

      <div className="flex justify-center mb-5 gap-2">
        <button 
          onClick={() => setUserType('student')} 
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition border-2 ${userType === 'student' ? 'border-[#B4D3D9] bg-[#E8F5F7] text-[#0f172a] dark:bg-emerald-800 dark:text-emerald-50 dark:border-emerald-700' : 'bg-white text-slate-600 border-slate-200'}`}
        >
          🎓 นักเรียน
        </button> 
        <button 
          onClick={() => setUserType('teacher')} 
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition border-2 ${userType === 'teacher' ? 'border-[#B4D3D9] bg-[#E8F5F7] text-[#0f172a] dark:bg-emerald-800 dark:text-emerald-50 dark:border-emerald-700' : 'bg-white text-slate-600 border-slate-200'}`}
        >
          👨‍🏫 ครู/บุคลากร
        </button>
      </div>

      {/* Student Form */}
      {userType === 'student' && (
        <div className="bg-white dark:bg-black/10 rounded-2xl shadow-md border border-slate-100 dark:border-white/10 p-5 mb-5">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><UserCheck className="w-5 h-5 text-emerald-600" /> เช็คอินนักเรียน</h3>
          <form onSubmit={handleStudentCheckin}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">เลขประจำตัว <span className="text-red-500">*</span></label> 
                <input type="text" maxLength={10} required placeholder="เช่น 12345" value={sId} onChange={e => setSId(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">คำนำหน้าชื่อ <span className="text-red-500">*</span></label> 
                <select required value={sPrefix} onChange={e => setSPrefix(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white">
                  <option value="">-- เลือกคำนำหน้า --</option> 
                  <option>เด็กชาย</option> <option>เด็กหญิง</option> <option>นาย</option> <option>นางสาว</option>
                </select>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label> 
                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    placeholder="ค้นหาชื่อ หรือระบุเอง..." 
                    value={sName} 
                    onChange={e => handleSearch(e.target.value, 'student')} 
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
                  />
                  {showSuggestions && activeInput === 'student' && suggestions.length > 0 && (
                    <div ref={suggestionRef} className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                      {suggestions.map(m => (
                        <button key={m.id} type="button" onClick={() => selectMember(m)} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 transition">
                          <p className="font-bold text-sm">{m.name}</p>
                          <p className="text-xs text-slate-400">{m.student_id} | {m.class_level}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">ชั้นเรียน <span className="text-red-500">*</span></label> 
              <select required value={sClass} onChange={e => setSClass(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white">
                <option value="">-- เลือกชั้นเรียน --</option> 
                {settings.classLevels.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">วัตถุประสงค์ <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {settings.studentPurposes.map(p => (
                  <button 
                    key={p} type="button" 
                    onClick={() => setSPurpose(p)} 
                    className={`p-3 rounded-xl border-2 transition text-sm font-medium flex flex-col items-center gap-1 ${sPurpose === p ? 'border-[#B4D3D9] bg-[#E8F5F7] text-slate-800 dark:bg-emerald-800 dark:border-emerald-600 dark:text-white' : 'border-slate-300 text-slate-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-700'}`}
                  >
                    <span className="text-lg">{p.split(' ')[0]}</span> <span>{p.split(' ').slice(1).join(' ')}</span>
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-70">
              <LogIn className="w-5 h-5" /> {isSubmitting ? 'กำลังบันทึก...' : 'เช็คอินเข้าใช้บริการ'}
            </button>
          </form>
        </div>
      )}

      {/* Teacher Form */}
      {userType === 'teacher' && (
        <div className="bg-white dark:bg-black/10 rounded-2xl shadow-md border border-slate-100 dark:border-white/10 p-5 mb-5">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><UserCheck className="w-5 h-5 text-teal-600" /> เช็คอินครู/บุคลากร</h3>
          <form onSubmit={handleTeacherCheckin}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">คำนำหน้าชื่อ <span className="text-red-500">*</span></label> 
                <select required value={tPrefix} onChange={e => setTPrefix(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white">
                  <option value="">-- เลือกคำนำหน้า --</option> 
                  <option>นาย</option> <option>นาง</option> <option>นางสาว</option>
                </select>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label> 
                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    placeholder="ค้นหาชื่อ หรือระบุเอง..." 
                    value={tName} 
                    onChange={e => handleSearch(e.target.value, 'teacher')} 
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" 
                  />
                  {showSuggestions && activeInput === 'teacher' && suggestions.length > 0 && (
                    <div ref={suggestionRef} className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                      {suggestions.map(m => (
                        <button key={m.id} type="button" onClick={() => selectMember(m)} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 transition">
                          <p className="font-bold text-sm">{m.name}</p>
                          <p className="text-xs text-slate-400">{m.user_type}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">วัตถุประสงค์ <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 gap-2">
                {settings.teacherPurposes.map(p => (
                  <button 
                    key={p} type="button" 
                    onClick={() => setTPurpose(p)} 
                    className={`p-3 rounded-xl border-2 transition text-sm font-medium flex flex-col items-center gap-1 ${tPurpose === p ? 'border-[#B4D3D9] bg-[#E8F5F7] text-slate-800 dark:bg-teal-800 dark:border-teal-600 dark:text-white' : 'border-slate-300 text-slate-600 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-slate-700'}`}
                  >
                    <span className="text-lg">{p.split(' ')[0]}</span> <span>{p.split(' ').slice(1).join(' ')}</span>
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-70">
              <LogIn className="w-5 h-5" /> {isSubmitting ? 'กำลังบันทึก...' : 'เช็คอินเข้าใช้บริการ'}
            </button>
          </form>
        </div>
      )}

      {/* Checkout */}
      <div className="bg-white dark:bg-black/10 rounded-2xl shadow-md border border-slate-100 dark:border-white/10 p-5 mb-5">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><LogOut className="w-5 h-5 text-orange-500" /> เช็คเอาท์ (ออกจากห้องสมุด)</h3>
        <div className="flex gap-2">
          <input type="text" placeholder="กรอกเลขประจำตัว หรือชื่อ" value={checkoutQuery} onChange={e => setCheckoutQuery(e.target.value)} className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" /> 
          <button onClick={handleCheckout} disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm flex items-center gap-1.5 disabled:opacity-70">
            <LogOut className="w-4 h-4" /> เช็คเอาท์
          </button>
        </div>
      </div>

      {/* History */}
      <div className="bg-white dark:bg-black/10 rounded-2xl shadow-md border border-slate-100 dark:border-white/10 p-5 mb-5">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><History className="w-5 h-5 text-indigo-500" /> ดูประวัติการใช้งาน</h3>
        <div className="flex gap-2 mb-3">
          <input type="text" placeholder="กรอกเลขประจำตัว หรือชื่อ เพื่อดูประวัติ" value={historyQuery} onChange={e => setHistoryQuery(e.target.value)} className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" /> 
          <button onClick={searchActivity} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">ค้นหา</button>
        </div>
        <div className="text-sm text-slate-500 text-center py-2">
          {!historyResults && "กรุณากรอกข้อมูลเพื่อค้นหาประวัติ"}
          {historyResults && historyResults.length === 0 && "ไม่พบประวัติ"}
          {historyResults && historyResults.length > 0 && (
            <div className="text-left">
              <p className="text-slate-600 font-medium mb-2">พบ {historyResults.length} รายการ</p>
              {historyResults.slice(0, 20).map(r => {
                const d = new Date(r.check_in_time);
                const co = r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'ยังไม่ออก';
                const dur = r.check_out_time ? Math.round((new Date(r.check_out_time).getTime() - d.getTime()) / 60000) + ' นาที' : '-';
                return (
                  <div key={r.id} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                    <div>
                      <span className="font-medium">{d.toLocaleDateString('th-TH')}</span> 
                      <span className="text-slate-500 ml-2">{d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} → {co}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{r.purpose || '-'}</span> 
                      <span className="text-xs text-slate-400 ml-1">{dur}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white dark:bg-black/10 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 p-4 text-center">
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{todayRecords.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">เข้าใช้วันนี้</p>
        </div>
        <div className="bg-white dark:bg-black/10 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 p-4 text-center">
          <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">{monthRecords.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">เข้าใช้เดือนนี้</p>
        </div>
        <div className="bg-white dark:bg-black/10 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 p-4 text-center">
          <p className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400">{avgMin} นาที</p>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">เวลาเฉลี่ย</p>
        </div>
        <div className="bg-white dark:bg-black/10 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 p-4 text-center">
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{records.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">เข้าใช้ทั้งหมด</p>
        </div>
      </div>

      {/* Today's Log */}
      <div className="bg-white dark:bg-black/10 rounded-2xl shadow-md border border-slate-100 dark:border-white/10 p-5 mb-5">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><List className="w-5 h-5 text-emerald-600" /> รายการเข้าใช้วันนี้</h3>
        <div className="space-y-2 max-h-64 overflow-auto text-sm">
          {todayRecords.length === 0 ? (
            <p className="text-slate-400 text-center py-4">ยังไม่มีข้อมูลวันนี้</p>
          ) : (
            todayRecords.sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime()).map(r => (
              <div key={r.id} className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{new Date(r.check_in_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span> 
                  <span className="font-medium">{r.name}</span> 
                  <span className="text-xs text-slate-400">{r.class_level !== '-' ? r.class_level : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{r.purpose || '-'}</span> 
                  {r.is_checked_out ? (
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">ออกแล้ว</span>
                  ) : (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">อยู่ในห้องสมุด</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
