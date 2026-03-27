export interface CheckinRecord {
  id?: string;
  type: 'checkin';
  name: string;
  student_id: string;
  class_level: string;
  user_type: 'นักเรียน' | 'ครู/บุคลากร';
  purpose: string;
  check_in_time: string;
  check_out_time: string;
  is_checked_out: boolean;
}

export interface Member {
  id?: string;
  name: string;
  student_id: string;
  class_level: string;
  user_type: 'นักเรียน' | 'ครู/บุคลากร';
}

export interface SystemSettings {
  schoolName: string;
  welcomeText: string;
  footerText: string;
  studentPurposes: string[];
  teacherPurposes: string[];
  classLevels: string[];
}

export const defaultSettings: SystemSettings = {
  schoolName: 'ห้องสมุด โรงเรียนเฉลิมพระเกียรติสมเด็จพระศรีนครินทร์ ยะลา',
  welcomeText: 'ยินดีต้อนรับสู่ห้องสมุดโรงเรียน',
  footerText: 'พัฒนาระบบโดย :: นางสาวเต็งกูฟาอีซะห์ พระศรีณวงค์',
  studentPurposes: ['📚 ยืม-คืนหนังสือ', '📖 อ่านหนังสือ', '🔍 สืบค้นข้อมูล', '📝 ทำการบ้าน', '👥 ทำงานกลุ่ม / ติวสอบ', '✨ อื่น ๆ'],
  teacherPurposes: ['👨‍🏫 จัดการเรียนการสอน / คุมนักเรียน', '📚 เตรียมการสอน / งานวิจัย', '📋 ยืม-คืน / ติดต่อธุรการ'],
  classLevels: ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6']
};
