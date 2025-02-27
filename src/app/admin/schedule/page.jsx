'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

// 移除 MongoDB 導入
// import { ObjectId } from 'mongodb'; // ← 刪除這一行

// 創建一個包含 useSearchParams 的組件
function ScheduleForm({ onDateSelected, onScheduleIdLoaded }) {
  const searchParams = useSearchParams();
  const preselectedDate = searchParams.get('date');
  const isEditMode = searchParams.get('edit') === 'true';
  const scheduleId = searchParams.get('id');
  
  useEffect(() => {
    if (preselectedDate) {
      onDateSelected(preselectedDate);
    }
    
    if (isEditMode && scheduleId) {
      onScheduleIdLoaded(scheduleId);
    }
  }, [preselectedDate, isEditMode, scheduleId, onDateSelected, onScheduleIdLoaded]);
  
  return null;
}

export default function AdminSchedulePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState('');
  const [editScheduleId, setEditScheduleId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCustomDate, setIsCustomDate] = useState(false);
  
  const [formData, setFormData] = useState({
    date: '',
    role: '',
    name: '',
    phone: '',
    notes: '',
  });
  
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  }, [selectedDate]);
  
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
  
  // 加載編輯數據
  useEffect(() => {
    async function fetchScheduleForEdit() {
      if (!editScheduleId) return;
      
      try {
        const response = await fetch(`/api/bookings?id=${editScheduleId}`);
        if (response.ok) {
          const schedule = await response.json();
          setIsEditMode(true);
          
          // 設置初始角色
          let initialRole = '';
          if (formData.name === schedule.operatorName) {
            initialRole = 'operator';
          } else if (formData.name === schedule.checkerName) {
            initialRole = 'checker';
          }
          
          setFormData({
            date: schedule.date,
            role: initialRole,
            name: schedule.operatorName || schedule.checkerName || '',
            phone: schedule.operatorPhone || schedule.checkerPhone || '',
            notes: schedule.notes || '',
          });
          
          // 設置當前排班
          setCurrentSchedule(schedule);
        } else {
          alert('獲取排班數據失敗');
        }
      } catch (error) {
        console.error('獲取排班數據錯誤:', error);
        alert('獲取數據時發生錯誤');
      }
    }
    
    fetchScheduleForEdit();
  }, [editScheduleId]);
  
  useEffect(() => {
    if (formData.date && !isEditMode) {
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
    }
  }, [formData.date, isEditMode, partialSchedules]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // 處理自定義日期
  const toggleCustomDate = () => {
    setIsCustomDate(!isCustomDate);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 基本表單驗證
    if (!formData.date || !formData.role || !formData.name) {
      alert('請填寫所有必填欄位');
      return;
    }
    
    try {
      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode ? `/api/bookings?id=${editScheduleId}` : '/api/bookings';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'schedule',
          date: formData.date,
          role: formData.role,
          name: formData.name,
          phone: formData.phone,
          notes: formData.notes
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(isEditMode ? '排班更新成功!' : '排班創建成功!');
        router.push('/');
      } else {
        alert(`操作失敗: ${result.message}`);
      }
    } catch (error) {
      console.error('提交排班錯誤:', error);
      alert('排班過程中出現錯誤，請稍後再試');
    }
  };

  return (
    <div className={styles.container}>
      <Suspense fallback={null}>
        <ScheduleForm 
          onDateSelected={setSelectedDate} 
          onScheduleIdLoaded={setEditScheduleId}
        />
      </Suspense>
      
      <main className={styles.main}>
        <h1 className={styles.title}>
          {isEditMode ? '編輯排班' : '管理員排班'}
        </h1>
        
        <form className={styles.scheduleForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="date">排班日期 *</label>
            {isCustomDate ? (
              <input 
                type="text" 
                id="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange}
                placeholder="格式: M/D (例如 3/15)"
                required
                className={styles.formControl}
              />
            ) : (
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
            )}
            <button 
              type="button" 
              onClick={toggleCustomDate} 
              className={styles.customDateToggle}
            >
              {isCustomDate ? '使用預設日期' : '使用自定義日期'}
            </button>
          </div>
          
          {currentSchedule && !isEditMode && (
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
              disabled={currentSchedule && currentSchedule.operatorName && currentSchedule.checkerName && !isEditMode}
            >
              <option value="">請選擇角色</option>
              <option 
                value="operator" 
                disabled={currentSchedule && currentSchedule.operatorName && !isEditMode}
              >
                雷切機管理員 (必填)
              </option>
              <option 
                value="checker" 
                disabled={currentSchedule && currentSchedule.checkerName && !isEditMode}
              >
                環境檢查人員 (選填)
              </option>
            </select>
            {currentSchedule && currentSchedule.operatorName && currentSchedule.checkerName && !isEditMode && (
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
              disabled={currentSchedule && currentSchedule.operatorName && currentSchedule.checkerName && !isEditMode}
            >
              {isEditMode ? '更新排班' : '確認排班'}
            </button>
          </div>
        </form>
        
        <div className={styles.infoBox}>
          <h3>排班須知</h3>
          <ul>
            <li>雷切機管理員負責協助使用者操作設備，確保安全</li>
            <li>環境檢查人員負責確認使用後的環境整潔 (選填)</li>
            <li>只要有雷切機管理員，該時段即可開放預約</li>
            <li>請確保您可以準時出席，如有變動請提前通知</li>
          </ul>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>雷切機預約系統 © 2025</p>
      </footer>
    </div>
  );
}