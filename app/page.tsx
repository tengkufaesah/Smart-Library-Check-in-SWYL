"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckinRecord, SystemSettings, defaultSettings } from '@/lib/types';

import Header from '@/components/Header';
import HomeTab from '@/components/Home';
import StatsTab from '@/components/Stats';
import AdminLogin from '@/components/AdminLogin';
import AdminTab from '@/components/Admin';
import UsersTab from '@/components/Users';
import Toast from '@/components/Toast';

export default function Page() {
  const [currentPage, setCurrentPage] = useState('home');
  const [records, setRecords] = useState<CheckinRecord[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lib_dark_mode') === 'true';
    }
    return false;
  });
  
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', visible: false });
  
  const [admins, setAdmins] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedAdmins = localStorage.getItem('lib_admins');
      return savedAdmins ? JSON.parse(savedAdmins) : [
        { name: 'Admin', email: 'tengkufaesah@swyl.ac.th', password: '12345' }
      ];
    }
    return [
      { name: 'Admin', email: 'tengkufaesah@swyl.ac.th', password: '12345' }
    ];
  });
  const [loggedInAdmin, setLoggedInAdmin] = useState('');

  useEffect(() => {
    // Apply dark mode class on initial load
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    }

    // Subscribe to Firestore
    const q = query(collection(db, 'checkins'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CheckinRecord[];
      setRecords(data);
    }, (error) => {
      console.error("Firestore Error: ", error);
    });

    // Subscribe to Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SystemSettings;
        const oldPurposes = ['📚 ยืม-คืนหนังสือ', '🔍 สืบค้นข้อมูล', '📝 ติว/ทำการบ้าน', '✨ อื่น ๆ'];
        
        const needsPurposesUpdate = data.studentPurposes && JSON.stringify(data.studentPurposes) === JSON.stringify(oldPurposes);
        const needsWelcomeUpdate = data.welcomeText === 'Smart Library Check-in';

        if (needsPurposesUpdate || needsWelcomeUpdate) {
          const updatedSettings = { 
            ...defaultSettings, 
            ...data, 
            studentPurposes: needsPurposesUpdate ? defaultSettings.studentPurposes : data.studentPurposes,
            welcomeText: needsWelcomeUpdate ? defaultSettings.welcomeText : data.welcomeText
          };
          setDoc(doc(db, 'settings', 'general'), updatedSettings);
          setSettings(updatedSettings);
        } else {
          setSettings({ ...defaultSettings, ...data });
        }
      } else {
        setSettings(defaultSettings);
      }
    });

    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('lib_dark_mode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleAdminLogin = (email: string, pass: string) => {
    const admin = admins.find(a => a.email === email && a.password === pass);
    if (admin) {
      setLoggedInAdmin(admin.name);
      setCurrentPage('admin');
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setLoggedInAdmin('');
    setCurrentPage('home');
  };

  const handleSetAdmins = (newAdmins: any[]) => {
    setAdmins(newAdmins);
    localStorage.setItem('lib_admins', JSON.stringify(newAdmins));
  };

  return (
    <div 
      className={`min-h-screen w-full flex flex-col ${isDarkMode ? 'dark text-white' : 'text-slate-900'}`}
      style={{ backgroundColor: isDarkMode ? '#C8AAAA' : '#FDCFFA' }}
    >
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      
      <Header 
        currentPage={currentPage} 
        setPage={setCurrentPage} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        settings={settings}
      />

      <main className="flex-1 w-full">
        {currentPage === 'home' && (
          <HomeTab records={records} showToast={showToast} settings={settings} />
        )}
        
        {currentPage === 'stats' && (
          <StatsTab records={records} settings={settings} />
        )}
        
        {currentPage === 'users' && (
          <UsersTab records={records} />
        )}
        
        {currentPage === 'admin-login' && (
          <AdminLogin onLogin={handleAdminLogin} onBack={() => setCurrentPage('home')} />
        )}
        
        {currentPage === 'admin' && (
          <AdminTab 
            records={records} 
            adminName={loggedInAdmin} 
            onLogout={handleAdminLogout} 
            showToast={showToast}
            admins={admins}
            setAdmins={handleSetAdmins}
            settings={settings}
          />
        )}
      </main>

      {currentPage !== 'admin' && (
        <footer 
          className="text-center py-4 text-xs border-t border-slate-300/50 font-medium" 
          style={{ 
            backgroundColor: isDarkMode ? '#1e293b' : '#F2EAE0',
            color: isDarkMode ? '#cbd5e1' : '#6b5a7a'
          }}
        >
          {settings.footerText}
        </footer>
      )}
    </div>
  );
}
