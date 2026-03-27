"use client";

import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, BarChart3, Settings, LogOut, ClipboardList, Download, Save, Home, Shield, FileUp, Database, Trash2, Search } from 'lucide-react';
import { CheckinRecord, SystemSettings, Member } from '@/lib/types';
import { generateMockData } from '@/lib/mockData';
import { doc, deleteDoc, setDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

interface AdminProps {
  records: CheckinRecord[];
  adminName: string;
  onLogout: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  admins: any[];
  setAdmins: (admins: any[]) => void;
  settings: SystemSettings;
}

export default function Admin({ records, adminName, onLogout, showToast, admins, setAdmins, settings }: AdminProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [memberSearch, setMemberSearch] = useState('');
  const [dbSearch, setDbSearch] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  
  // Settings State
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [memberToDelete, setMemberToDelete] = useState<{idOrName: string, isStudent: boolean, name: string} | null>(null);
  const [dbMemberToDelete, setDbMemberToDelete] = useState<Member | null>(null);
  
  const [editSettings, setEditSettings] = useState<SystemSettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportingDb, setIsImportingDb] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setIsFetchingMembers(true);
    try {
      const q = query(collection(db, 'members'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      setMembers(list);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsFetchingMembers(false);
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        let importedCount = 0;
        for (const row of data) {
          const newRecord: Partial<CheckinRecord> = {
            type: 'checkin',
            name: String(row.name || row.ชื่อ || ''),
            student_id: String(row.student_id || row.เลขประจำตัว || ''),
            class_level: String(row.class_level || row.ชั้น || '-'),
            user_type: (row.user_type || row.ประเภท || 'นักเรียน') === 'ครู' ? 'ครู/บุคลากร' : 'นักเรียน',
            purpose: String(row.purpose || row.วัตถุประสงค์ || 'นำเข้าข้อมูล'),
            check_in_time: row.check_in_time || row.เวลาเข้า || new Date().toISOString(),
            check_out_time: row.check_out_time || row.เวลาออก || '',
            is_checked_out: !!(row.check_out_time || row.เวลาออก)
          };

          if (newRecord.name) {
            await addDoc(collection(db, 'checkins'), newRecord);
            importedCount++;
          }
        }
        showToast(`นำเข้าข้อมูลสำเร็จ ${importedCount} รายการ`, 'success');
      } catch (error) {
        console.error("Import Error:", error);
        showToast('เกิดข้อผิดพลาดในการนำเข้าข้อมูล', 'error');
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDbImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingDb(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        let importedCount = 0;
        for (const row of data) {
          const newMember: Partial<Member> = {
            name: String(row.name || row.ชื่อ || ''),
            student_id: String(row.student_id || row.เลขประจำตัว || ''),
            class_level: String(row.class_level || row.ชั้น || '-'),
            user_type: (row.user_type || row.ประเภท || 'นักเรียน') === 'ครู' ? 'ครู/บุคลากร' : 'นักเรียน',
          };

          if (newMember.name) {
            await addDoc(collection(db, 'members'), newMember);
            importedCount++;
          }
        }
        showToast(`นำเข้าฐานข้อมูลสำเร็จ ${importedCount} รายการ`, 'success');
        fetchMembers();
      } catch (error) {
        console.error("Import Error:", error);
        showToast('เกิดข้อผิดพลาดในการนำเข้าข้อมูล', 'error');
      } finally {
        setIsImportingDb(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadDbTemplate = () => {
    const templateData = [
      { 'ชื่อ': 'สมชาย ใจดี', 'เลขประจำตัว': '12345', 'ชั้น': 'ม.1', 'ประเภท': 'นักเรียน' },
      { 'ชื่อ': 'ครูสมศรี มีสุข', 'เลขประจำตัว': 'T001', 'ชั้น': '-', 'ประเภท': 'ครู' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "member_database_template.xlsx");
    showToast('ดาวน์โหลดไฟล์ตัวอย่างฐานข้อมูลสำเร็จ', 'success');
  };

  const handleDeleteDbMember = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'members', id));
      showToast('ลบข้อมูลสมาชิกสำเร็จ', 'success');
      fetchMembers();
      setDbMemberToDelete(null);
    } catch (error) {
      showToast('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
    }
  };
  
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'ชื่อ': 'สมชาย ใจดี',
        'เลขประจำตัว': '12345',
        'ชั้น': 'ม.1',
        'ประเภท': 'นักเรียน',
        'วัตถุประสงค์': 'อ่านหนังสือ',
        'เวลาเข้า': new Date().toISOString()
      },
      {
        'ชื่อ': 'ครูสมศรี มีสุข',
        'เลขประจำตัว': 'T001',
        'ชั้น': '-',
        'ประเภท': 'ครู',
        'วัตถุประสงค์': 'เตรียมการสอน',
        'เวลาเข้า': new Date().toISOString()
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "library_import_template.xlsx");
    showToast('ดาวน์โหลดไฟล์ตัวอย่างสำเร็จ', 'success');
  };

  const [classLevelsStr, setClassLevelsStr] = useState(settings.classLevels.join(', '));
  const [studentPurposesStr, setStudentPurposesStr] = useState(settings.studentPurposes.join(', '));
  const [teacherPurposesStr, setTeacherPurposesStr] = useState(settings.teacherPurposes.join(', '));

  useEffect(() => {
    setEditSettings(settings);
    setClassLevelsStr(settings.classLevels.join(', '));
    setStudentPurposesStr(settings.studentPurposes.join(', '));
    setTeacherPurposesStr(settings.teacherPurposes.join(', '));
  }, [settings]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const updatedSettings = {
        ...editSettings,
        classLevels: classLevelsStr.split(',').map(s => s.trim()).filter(Boolean),
        studentPurposes: studentPurposesStr.split(',').map(s => s.trim()).filter(Boolean),
        teacherPurposes: teacherPurposesStr.split(',').map(s => s.trim()).filter(Boolean),
      };
      await setDoc(doc(db, 'settings', 'general'), updatedSettings);
      showToast('บันทึกการตั้งค่าสำเร็จ', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStr = todayStr.slice(0, 7);
  
  const checkins = records.filter(r => r.type === 'checkin');
  const todayRecords = checkins.filter(r => r.check_in_time && r.check_in_time.startsWith(todayStr));
  const monthRecords = checkins.filter(r => r.check_in_time && r.check_in_time.startsWith(monthStr));
  const currentlyIn = checkins.filter(r => !r.is_checked_out);
  
  const completed = checkins.filter(r => r.check_out_time);
  const avgMin = completed.length > 0 
    ? Math.round(completed.reduce((s, r) => s + (new Date(r.check_out_time).getTime() - new Date(r.check_in_time).getTime()), 0) / completed.length / 60000)
    : 0;

  // Render Members Logic
  const uniqueUsers: Record<string, any> = {};
  checkins.forEach(r => {
    const key = r.student_id || r.name;
    if (!uniqueUsers[key]) uniqueUsers[key] = { name: r.name, student_id: r.student_id, user_type: r.user_type, class_level: r.class_level, visits: 0 };
    uniqueUsers[key].visits++;
  });
  let usersList = Object.values(uniqueUsers);
  if (memberSearch) {
    usersList = usersList.filter(u => u.name.toLowerCase().includes(memberSearch.toLowerCase()) || (u.student_id && u.student_id.toLowerCase().includes(memberSearch.toLowerCase())));
  }
  usersList.sort((a, b) => b.visits - a.visits);

  // Admin Actions
  const handleAddAdmin = () => {
    if (!newAdminName || !newAdminEmail || !newAdminPass) {
      showToast('กรุณากรอกข้อมูลให้ครบ', 'error');
      return;
    }
    const newAdmins = [...admins, { name: newAdminName, email: newAdminEmail, password: newAdminPass }];
    setAdmins(newAdmins);
    setNewAdminName(''); setNewAdminEmail(''); setNewAdminPass('');
    showToast('เพิ่มผู้ดูแลสำเร็จ', 'success');
  };

  const handleRemoveAdmin = (index: number) => {
    const newAdmins = [...admins];
    newAdmins.splice(index, 1);
    setAdmins(newAdmins);
    showToast('ลบผู้ดูแลสำเร็จ', 'success');
  };

  const handleConfirmDeleteAll = async () => {
    if (deleteConfirmText !== 'ยืนยัน') {
      showToast('กรุณาพิมพ์ "ยืนยัน"', 'error');
      return;
    }
    
    try {
      // Delete all checkin records
      for (const r of checkins) {
        if (r.id) {
          await deleteDoc(doc(db, 'checkins', r.id));
        }
      }
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      showToast('ลบข้อมูลทั้งหมดสำเร็จ', 'success');
    } catch (e) {
      showToast('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
    }
  };

  const exportCSV = () => {
    if (checkins.length === 0) { 
      showToast('ไม่มีข้อมูลสำหรับส่งออก', 'error'); 
      return; 
    }
    const headers = ['ชื่อ','เลขประจำตัว','ชั้นเรียน','ประเภท','วัตถุประสงค์','เวลาเข้า','เวลาออก','ระยะเวลา(นาที)'];
    const rows = checkins.map(r => {
      const dur = r.check_out_time ? Math.round((new Date(r.check_out_time).getTime() - new Date(r.check_in_time).getTime()) / 60000) : '';
      return [r.name, r.student_id, r.class_level, r.user_type, r.purpose, r.check_in_time, r.check_out_time || '', dur];
    });
    const BOM = '\uFEFF';
    const csv = BOM + [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `library-report-${todayStr}.csv`;
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('ดาวน์โหลด CSV สำเร็จ', 'success');
  };

  const handleGenerateMockData = async () => {
    try {
      await generateMockData(settings);
      showToast('สร้างข้อมูลจำลองสำเร็จ', 'success');
    } catch (e) {
      showToast('เกิดข้อผิดพลาดในการสร้างข้อมูลจำลอง', 'error');
    }
  };

  // Chart Data (reused logic)
  const classCounts: Record<string, number> = {};
  checkins.forEach(r => { if (r.class_level && r.class_level !== '-') classCounts[r.class_level] = (classCounts[r.class_level] || 0) + 1; });
  const classLabels = settings.classLevels;
  const classData = { labels: classLabels, datasets: [{ label: 'จำนวนครั้ง', data: classLabels.map(l => classCounts[l] || 0), backgroundColor: ['#10b981','#14b8a6','#06b6d4','#6366f1','#a855f7','#f59e0b'] }] };

  const purposeCounts: Record<string, number> = {};
  checkins.forEach(r => { if (r.purpose) purposeCounts[r.purpose] = (purposeCounts[r.purpose] || 0) + 1; });
  const purposeData = { labels: Object.keys(purposeCounts), datasets: [{ data: Object.values(purposeCounts), backgroundColor: ['#10b981','#06b6d4','#6366f1','#f59e0b','#ef4444','#a855f7','#ec4899'] }] };

  const hourCounts = new Array(24).fill(0);
  checkins.forEach(r => { if (r.check_in_time) { const h = new Date(r.check_in_time).getHours(); hourCounts[h]++; } });
  const hourData = { labels: Array.from({ length: 24 }, (_, i) => `${i}:00`), datasets: [{ label: 'จำนวนครั้ง', data: hourCounts, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.3 }] };

  const utCounts: Record<string, number> = {};
  checkins.forEach(r => { utCounts[r.user_type] = (utCounts[r.user_type] || 0) + 1; });
  const utData = { labels: Object.keys(utCounts), datasets: [{ data: Object.values(utCounts), backgroundColor: ['#10b981','#0d9488','#6366f1'] }] };

  const userVisits: Record<string, number> = {};
  checkins.forEach(r => { userVisits[r.name] = (userVisits[r.name] || 0) + 1; });
  const superUsers = Object.entries(userVisits).sort((a, b) => b[1] - a[1]).slice(0, 10);

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
    <div className="page fade-in min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-56 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <p className="text-xs text-slate-400">ผู้ดูแลระบบ</p>
          <p className="font-semibold text-sm truncate">{adminName}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`sidebar-link w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 ${activeTab === 'dashboard' ? 'active bg-white/15' : ''}`}>
            <LayoutDashboard className="w-4 h-4" /> แดชบอร์ด
          </button> 
          <button onClick={() => setActiveTab('members')} className={`sidebar-link w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 ${activeTab === 'members' ? 'active bg-white/15' : ''}`}>
            <Users className="w-4 h-4" /> จัดการผู้ใช้งาน
          </button> 
          <button onClick={() => setActiveTab('database')} className={`sidebar-link w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 ${activeTab === 'database' ? 'active bg-white/15' : ''}`}>
            <Database className="w-4 h-4" /> ฐานข้อมูลสมาชิก
          </button> 
          <button onClick={() => setActiveTab('reports')} className={`sidebar-link w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 ${activeTab === 'reports' ? 'active bg-white/15' : ''}`}>
            <BarChart3 className="w-4 h-4" /> รายงานสถิติ
          </button> 
          <button onClick={() => setActiveTab('settings')} className={`sidebar-link w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 ${activeTab === 'settings' ? 'active bg-white/15' : ''}`}>
            <Settings className="w-4 h-4" /> ตั้งค่าระบบ
          </button>
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button onClick={onLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white/10 text-slate-300">
            <Home className="w-4 h-4" /> กลับหน้าแรก
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-40 flex justify-around py-2">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center text-xs p-1 ${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'}`}><LayoutDashboard className="w-5 h-5" />แดชบอร์ด</button> 
        <button onClick={() => setActiveTab('members')} className={`flex flex-col items-center text-xs p-1 ${activeTab === 'members' ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'}`}><Users className="w-5 h-5" />ผู้ใช้งาน</button> 
        <button onClick={() => setActiveTab('database')} className={`flex flex-col items-center text-xs p-1 ${activeTab === 'database' ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'}`}><Database className="w-5 h-5" />ฐานข้อมูล</button> 
        <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center text-xs p-1 ${activeTab === 'reports' ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'}`}><BarChart3 className="w-5 h-5" />รายงาน</button> 
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center text-xs p-1 ${activeTab === 'settings' ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'}`}><Settings className="w-5 h-5" />ตั้งค่า</button> 
        <button onClick={onLogout} className="flex flex-col items-center text-xs text-slate-500 p-1"><Home className="w-5 h-5" />หน้าแรก</button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
        {/* Admin Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-600" /> 
              ระบบจัดการผู้ดูแล
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">ยินดีต้อนรับคุณ {adminName}</p>
          </div>
          <button 
            onClick={onLogout} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-xl text-sm font-bold transition shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>กลับหน้าแรก</span>
          </button>
        </div>
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="admin-tab fade-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><LayoutDashboard className="w-6 h-6 text-emerald-600" /> แดชบอร์ดภาพรวม</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">อยู่ในห้องสมุดตอนนี้</p>
                <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">{currentlyIn.length}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">เข้าใช้วันนี้</p>
                <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">{todayRecords.length}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">เข้าใช้เดือนนี้</p>
                <p className="text-3xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">{monthRecords.length}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">เวลาเฉลี่ย</p>
                <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">{avgMin} น.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" /> ผู้ใช้ที่อยู่ในห้องสมุดขณะนี้</h3>
              <div className="space-y-2 max-h-48 overflow-auto text-sm">
                {currentlyIn.length === 0 ? (
                  <p className="text-slate-400 text-center py-3">ไม่มีผู้ใช้ในขณะนี้</p>
                ) : (
                  currentlyIn.map(r => (
                    <div key={r.id} className="flex justify-between items-center py-2 px-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <div><span className="font-medium">{r.name}</span> <span className="text-xs text-slate-500">{r.user_type} {r.class_level !== '-' ? r.class_level : ''}</span></div>
                      <div className="text-xs text-slate-500">เข้า {new Date(r.check_in_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} | {r.purpose || '-'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-emerald-600" /> บันทึกวันนี้ทั้งหมด</h3>
              <div className="space-y-2 max-h-64 overflow-auto text-sm">
                {todayRecords.length === 0 ? (
                  <p className="text-slate-400 text-center py-3">ยังไม่มีข้อมูลวันนี้</p>
                ) : (
                  todayRecords.sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime()).map(r => (
                    <div key={r.id} className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>{r.is_checked_out ? '✅' : '🟢'} <span className="font-medium">{r.name}</span> <span className="text-xs text-slate-400">{r.user_type} {r.class_level !== '-' ? r.class_level : ''}</span></div>
                      <div className="text-xs text-slate-500">{new Date(r.check_in_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} → {r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'} | {r.purpose || '-'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="admin-tab fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-emerald-600" /> จัดการผู้ใช้งาน</h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleDownloadTemplate}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition text-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> โหลดไฟล์ตัวอย่าง
                </button>
                <label className={`cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition text-sm flex items-center gap-2 ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                  <FileUp className="w-4 h-4" /> {isImporting ? 'กำลังนำเข้า...' : 'นำเข้า Excel'}
                  <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleExcelImport} disabled={isImporting} />
                </label>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-5">
              <h3 className="font-bold mb-3">ผู้ใช้ที่เคยเช็คอิน</h3>
              <div className="mb-3">
                <input type="text" placeholder="ค้นหาชื่อหรือเลขประจำตัว..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="space-y-2 max-h-96 overflow-auto text-sm">
                {usersList.length === 0 ? (
                  <p className="text-slate-400 text-center py-3">ยังไม่มีข้อมูล</p>
                ) : (
                  usersList.map(u => {
                    const idOrName = u.user_type === 'นักเรียน' ? u.student_id : u.name;
                    return (
                      <div key={idOrName} className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div><span className="font-medium">{u.name}</span> <span className="text-xs text-slate-400">{u.student_id || '-'} | {u.user_type} {u.class_level !== '-' ? u.class_level : ''}</span></div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">{u.visits} ครั้ง</span>
                          <button 
                            onClick={() => setMemberToDelete({ idOrName, isStudent: u.user_type === 'นักเรียน', name: u.name })}
                            className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition"
                          >
                            ลบประวัติ
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Delete Member Modal */}
            {memberToDelete && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
                  <h3 className="text-lg font-bold text-red-600 mb-2">ยืนยันการลบประวัติ</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    คุณต้องการลบประวัติการเช็คอินทั้งหมดของ <strong>{memberToDelete.name}</strong> ใช่หรือไม่? การกระทำนี้ไม่สามารถกู้คืนได้
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => setMemberToDelete(null)}
                      className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                    >
                      ยกเลิก
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          const recordsToDelete = checkins.filter(r => 
                            memberToDelete.isStudent 
                              ? r.student_id === memberToDelete.idOrName 
                              : r.name === memberToDelete.idOrName
                          );
                          
                          for (const r of recordsToDelete) {
                            if (r.id) {
                              await deleteDoc(doc(db, 'checkins', r.id));
                            }
                          }
                          showToast(`ลบประวัติของ ${memberToDelete.name} สำเร็จ`, 'success');
                          setMemberToDelete(null);
                        } catch (error) {
                          showToast('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
                        }
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition"
                    >
                      ยืนยันลบ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Database Tab */}
        {activeTab === 'database' && (
          <div className="admin-tab fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Database className="w-6 h-6 text-emerald-600" /> ฐานข้อมูลสมาชิก</h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleDownloadDbTemplate}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition text-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> โหลดตัวอย่าง
                </button>
                <label className={`cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition text-sm flex items-center gap-2 ${isImportingDb ? 'opacity-50 pointer-events-none' : ''}`}>
                  <FileUp className="w-4 h-4" /> {isImportingDb ? 'กำลังนำเข้า...' : 'นำเข้าฐานข้อมูล'}
                  <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleDbImport} disabled={isImportingDb} />
                </label>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-5">
              <h3 className="font-bold mb-3">รายชื่อสมาชิกในฐานข้อมูล</h3>
              <div className="mb-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ค้นหาชื่อหรือเลขประจำตัว..." 
                  value={dbSearch} 
                  onChange={e => setDbSearch(e.target.value)} 
                  className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
              </div>
              <div className="space-y-2 max-h-[500px] overflow-auto text-sm">
                {isFetchingMembers ? (
                  <p className="text-slate-400 text-center py-10">กำลังโหลดข้อมูล...</p>
                ) : members.length === 0 ? (
                  <p className="text-slate-400 text-center py-10">ยังไม่มีข้อมูลในฐานข้อมูล</p>
                ) : (
                  members
                    .filter(m => m.name.toLowerCase().includes(dbSearch.toLowerCase()) || m.student_id.toLowerCase().includes(dbSearch.toLowerCase()))
                    .map(m => (
                      <div key={m.id} className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div>
                          <span className="font-medium">{m.name}</span> 
                          <span className="text-xs text-slate-400 ml-2">{m.student_id || '-'} | {m.user_type} {m.class_level !== '-' ? m.class_level : ''}</span>
                        </div>
                        <button 
                          onClick={() => setDbMemberToDelete(m)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Delete DB Member Modal */}
            {dbMemberToDelete && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
                  <h3 className="text-lg font-bold text-red-600 mb-2">ยืนยันการลบข้อมูล</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    คุณต้องการลบข้อมูลของ <strong>{dbMemberToDelete.name}</strong> ออกจากฐานข้อมูลหลักใช่หรือไม่?
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => setDbMemberToDelete(null)}
                      className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                    >
                      ยกเลิก
                    </button>
                    <button 
                      onClick={() => dbMemberToDelete.id && handleDeleteDbMember(dbMemberToDelete.id)}
                      className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition"
                    >
                      ยืนยันลบ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="admin-tab fade-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-emerald-600" /> รายงานสถิติ</h2>
            
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
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h3 className="font-bold mb-3 text-sm">📊 จำนวนผู้เข้าใช้แยกตามชั้นเรียน</h3>
                <div className="h-48"><Bar data={classData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h3 className="font-bold mb-3 text-sm">📊 วัตถุประสงค์การเข้าใช้</h3>
                <div className="h-48 flex justify-center"><Doughnut data={purposeData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h3 className="font-bold mb-3 text-sm">📊 ช่วงเวลายอดนิยม (Peak Hours)</h3>
                <div className="h-48"><Line data={hourData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h3 className="font-bold mb-3 text-sm">📊 ประเภทผู้ใช้</h3>
                <div className="h-48 flex justify-center"><Pie data={utData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">🏆 Super Users (มาบ่อยที่สุด)</h3>
              <div className="space-y-2 text-sm">
                {superUsers.length === 0 ? (
                  <p className="text-slate-400">ยังไม่มีข้อมูล</p>
                ) : (
                  superUsers.map(([name, count], i) => {
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                    return (
                      <div key={name} className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span>{medal} {name}</span>
                        <span className="font-bold text-emerald-600">{count} ครั้ง</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-bold mb-3">📥 ส่งออกข้อมูล</h3>
              <button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm flex items-center gap-2">
                <Download className="w-4 h-4" /> ดาวน์โหลด CSV
              </button>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="admin-tab fade-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings className="w-6 h-6 text-emerald-600" /> ตั้งค่าระบบ</h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">ตั้งค่าทั่วไป</h3>
                <button 
                  onClick={handleSaveSettings} 
                  disabled={isSavingSettings}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg transition text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {isSavingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </button>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">ชื่อโรงเรียน / ห้องสมุด</label>
                  <input 
                    type="text" 
                    value={editSettings.schoolName} 
                    onChange={e => setEditSettings({...editSettings, schoolName: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">ข้อความส่วนท้าย (Footer)</label>
                  <input 
                    type="text" 
                    value={editSettings.footerText} 
                    onChange={e => setEditSettings({...editSettings, footerText: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">ระดับชั้นเรียน (คั่นด้วยลูกน้ำ)</label>
                    <textarea 
                      value={classLevelsStr} 
                      onChange={e => setClassLevelsStr(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]" 
                      placeholder="ม.1, ม.2, ม.3..."
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">วัตถุประสงค์ (นักเรียน) (คั่นด้วยลูกน้ำ)</label>
                    <textarea 
                      value={studentPurposesStr} 
                      onChange={e => setStudentPurposesStr(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]" 
                      placeholder="ยืมหนังสือ, คืนหนังสือ..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">วัตถุประสงค์ (ครู/บุคลากร) (คั่นด้วยลูกน้ำ)</label>
                    <textarea 
                      value={teacherPurposesStr} 
                      onChange={e => setTeacherPurposesStr(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]" 
                      placeholder="จัดการเรียนการสอน, คุมนักเรียน..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-5">
              <h3 className="font-bold mb-3">จัดการผู้ดูแลระบบ</h3>
              <div className="space-y-2 mb-4 text-sm">
                {admins.map((a, i) => (
                  <div key={i} className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div><span className="font-medium">{a.name}</span> <span className="text-xs text-slate-400">{a.email}</span></div>
                    {admins.length > 1 && (
                      <button onClick={() => handleRemoveAdmin(i)} className="text-red-500 hover:text-red-700 text-xs font-bold">ลบ</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t dark:border-slate-700 pt-4 mt-4">
                <h4 className="font-medium text-sm mb-2">เพิ่มผู้ดูแลใหม่</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input type="text" placeholder="ชื่อ" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" /> 
                  <input type="email" placeholder="อีเมล" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" /> 
                  <input type="text" placeholder="รหัสผ่าน" value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <button onClick={handleAddAdmin} className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg transition text-sm">เพิ่มผู้ดูแล</button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-5">
              <h3 className="font-bold mb-3 text-indigo-600">🛠️ ข้อมูลจำลอง (Mock Data)</h3>
              <p className="text-sm text-slate-500 mb-3">สร้างข้อมูลจำลองเพื่อทดสอบระบบ (20 รายการ)</p>
              <button onClick={handleGenerateMockData} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg transition text-sm">
                สร้างข้อมูลจำลอง
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-bold mb-3 text-red-600">⚠️ ลบข้อมูลทั้งหมด</h3>
              <p className="text-sm text-slate-500 mb-3">การดำเนินการนี้จะลบข้อมูลการเช็คอินทั้งหมดอย่างถาวร</p>
              <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg transition text-sm">
                ลบข้อมูลทั้งหมด
              </button>
              
              {showDeleteConfirm && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-2">คุณแน่ใจหรือไม่? พิมพ์ &quot;ยืนยัน&quot; เพื่อดำเนินการ</p>
                  <div className="flex gap-2">
                    <input type="text" placeholder="พิมพ์ ยืนยัน" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className="flex-1 border border-red-300 rounded-lg px-3 py-2 text-sm outline-none" /> 
                    <button onClick={handleConfirmDeleteAll} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold">ยืนยันลบ</button> 
                    <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold">ยกเลิก</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
