import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { SystemSettings } from './types';

export const generateMockData = async (settings: SystemSettings) => {
  const purposesStudent = settings.studentPurposes;
  const purposesTeacher = settings.teacherPurposes;
  const classes = settings.classLevels;
  const prefixes = ['เด็กชาย', 'เด็กหญิง', 'นาย', 'นางสาว'];

  for (let i = 0; i < 20; i++) {
    const isStudent = Math.random() > 0.2;
    const checkInDate = new Date();
    // Randomize over the last 3 days
    checkInDate.setHours(checkInDate.getHours() - Math.floor(Math.random() * 72)); 

    const checkOutDate = new Date(checkInDate);
    checkOutDate.setMinutes(checkOutDate.getMinutes() + 15 + Math.floor(Math.random() * 120));

    // 80% chance they have checked out if it's not today
    const isCheckedOut = Math.random() > 0.2 || checkInDate.getDate() !== new Date().getDate();

    await addDoc(collection(db, 'checkins'), {
      type: 'checkin',
      name: isStudent ? `${prefixes[Math.floor(Math.random()*prefixes.length)]} ทดสอบ ${i}` : `ครู ทดสอบ ${i}`,
      student_id: isStudent ? `100${i}` : '',
      class_level: isStudent ? classes[Math.floor(Math.random()*classes.length)] : '-',
      user_type: isStudent ? 'นักเรียน' : 'ครู/บุคลากร',
      purpose: isStudent ? purposesStudent[Math.floor(Math.random()*purposesStudent.length)] : purposesTeacher[Math.floor(Math.random()*purposesTeacher.length)],
      check_in_time: checkInDate.toISOString(),
      check_out_time: isCheckedOut ? checkOutDate.toISOString() : '',
      is_checked_out: isCheckedOut
    });
  }
};
