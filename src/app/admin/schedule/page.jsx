'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function AdminSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDate = searchParams.get('date');
  
  const [formData, setFormData] = useState({
    date: preselectedDate || '',
    role: '', // 'operator' 或 'checker'
    name: '',
    phone: '',
    notes: '',
  });
  
  // 模擬獲取的可排班日期
  const availableDates = [
    '4/2', '4/7', '4/9', '4/11', '4/14', '4/16', '4/18', '4/21', '4/23', '4/25', '4/28', '4/30',
    '5/2', '5/5', '5/7', '5/9', '5/12', '5/14', '5/16', '5/19', '5/21', '5/23', '5/26', '5/28', '5/30',
    '6/2', '6/4', '6/7', '6/9'
  ];
  
  // 已有部分角色的日期
  const [partialSchedules, setPartialSchedules] = useState([
    { date: '4/2', operatorName: '陳苡瑄', checkerName: '' },
    { date: '4/9', operatorName: '', checkerName: '林甄彙' },
  ]);
  
  // 找出當前選擇日期的已排班情況
  const [currentSchedule, setCurrentSchedule] = useState(null);
  
  useEffect(() => {
    if (formData.date) {
      const schedule = partialSchedules.find(s => s.date === formData.date);
      setCurrentSchedule(schedule || null);
      
      // 如果已有雷切機操作員，預設選擇環境檢查員角色；反之亦然
      if (schedule) {
        if (schedule.operatorName && !schedule.checkerName) {
          setFormData(prev => ({ ...prev, role: 'checker' }));
        } else if (!schedule.operatorName && schedule.checkerName) {
          setFormData(prev => ({ ...prev, role: 'operator' }));
        }
      }
    } else {
      setCurrentSchedule(null);
    }
  }, [formData.date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 基本表單驗證
    if (!formData.date || !formData.role || !formData.name) {
      alert('請填寫所有必填欄位');
      return;
    }
    
    // 在實際應用中,這裡會發送API請求儲存排班數據
    console.log('提交排班:', formData);
    
    // 顯示成功訊息並返回首頁
    alert(`排班成功!\n日期: ${formData.date}\n角色: ${formData.role === 'operator' ? '雷切機管理員' : '環境檢查人員'}\n姓名: ${formData.name}`);
    router.push('/');
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>管理員排班</h1>
        
        <form className={styles.scheduleForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="date">排班日期 *</label>
            <select 
              id="date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange}
              required
              className={styles.formControl}
            >
              <option value="">請選擇日期</option>
              {availableDates.map(date => (
                <option key={date} value={date}>
                  {date} (19:00-21:00)
                </option>
              ))}
            </select>
          </div>
          
          {currentSchedule && (
            <div className={styles.scheduleInfo}>
              <h3>當前排班狀態</h3>
              <div className={styles.scheduleStatus}>
                <div className={styles.roleStatus}>
                  <span className={styles.roleLabel}>雷切機管理員:</span>
                  <span className={currentSchedule.operatorName ? styles.filledStatus : styles.emptyStatus}>
                    {currentSchedule.operatorName || '尚未安排'}
                  </span>
                </div>
                <div className={styles.roleStatus}>
                  <span className={styles.roleLabel}>環境檢查人員:</span>
                  <span className={currentSchedule.checkerName ? styles.filledStatus : styles.emptyStatus}>
                    {currentSchedule.checkerName || '尚未安排'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label htmlFor="role">排班角色 *</label>
            <select 
              id="role" 
              name="role" 
              value={formData.role} 
              onChange={handleChange}
              required
              className={styles.formControl}
              disabled={currentSchedule && currentSchedule.operatorName && currentSchedule.checkerName}
            >
              <option value="">請選擇角色</option>
              <option 
                value="operator" 
                disabled={currentSchedule && currentSchedule.operatorName}
              >
                雷切機管理員
              </option>
              <option 
                value="checker" 
                disabled={currentSchedule && currentSchedule.checkerName}
              >
                環境檢查人員
              </option>
            </select>
            {currentSchedule && currentSchedule.operatorName && currentSchedule.checkerName && (
              <p className={styles.disabledNote}>此時段已排滿，請選擇其他日期</p>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="name">管理員姓名 *</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              required
              className={styles.formControl}
              placeholder="請輸入您的姓名"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="phone">聯絡電話</label>
            <input 
              type="tel" 
              id="phone" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange}
              className={styles.formControl}
              placeholder="請輸入您的聯絡電話"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="notes">備註</label>
            <textarea 
              id="notes" 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange}
              className={styles.formControl}
              rows="3"
              placeholder="有特殊情況請在此說明"
            ></textarea>
          </div>
          
          <div className={styles.agreement}>
            <input 
              type="checkbox" 
              id="agreement" 
              required 
            />
            <label htmlFor="agreement">
              我確認可以在所選時段出席並負責相關職務
            </label>
          </div>
          
          <div className={styles.formActions}>
            <Link href="/" className={styles.cancelButton}>
              取消
            </Link>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={currentSchedule && currentSchedule.operatorName && currentSchedule.checkerName}
            >
              確認排班
            </button>
          </div>
        </form>
        
        <div className={styles.infoBox}>
          <h3>排班須知</h3>
          <ul>
            <li>雷切機管理員負責協助使用者操作設備，確保安全</li>
            <li>環境檢查人員負責確認使用後的環境整潔</li>
            <li>請確保您可以準時出席，如有變動請提前通知</li>
            <li>每個時段必須有雷切機管理員和環境檢查人員才會開放預約</li>
          </ul>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>雷切機預約系統 © 2025</p>
      </footer>
    </div>
  );
}