'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

// 創建一個包含 useSearchParams 的組件
function BookingParamsReader({ onDateSelected }) {
  const searchParams = useSearchParams();
  const preselectedDate = searchParams.get('date');
  
  useEffect(() => {
    if (preselectedDate) {
      onDateSelected(preselectedDate);
    }
  }, [preselectedDate, onDateSelected]);
  
  return null;
}

export default function BookingPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState('');
  
  const [formData, setFormData] = useState({
    date: '',
    userName: '',
    phone: '',
    email: '',
    purpose: '',
    notes: '',
  });
  
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  }, [selectedDate]);
  
  // 模擬從API獲取的數據 - 這些是已排班但尚未被預約的時段
  const [availableSlots, setAvailableSlots] = useState([
    { 
      date: '3/10', 
      operatorName: '陳苡瑄', 
      checkerName: '林甄彙'
    },
    { 
      date: '3/12', 
      operatorName: '陳佳儀', 
      checkerName: '張珮玲'
    },
    { 
      date: '3/17', 
      operatorName: '戴婕茵', 
      checkerName: '趙翊伶'
    },
    { 
      date: '3/19', 
      operatorName: '張珉甄', 
      checkerName: '林芸均'
    },
    { 
      date: '3/21', 
      operatorName: '蔡承嶧', 
      checkerName: '陳妍羽'
    },
  ]);

  const [selectedSlotInfo, setSelectedSlotInfo] = useState(null);

  useEffect(() => {
    // 當日期改變時，更新選中時段的信息
    if (formData.date) {
      const slot = availableSlots.find(slot => slot.date === formData.date);
      setSelectedSlotInfo(slot);
    } else {
      setSelectedSlotInfo(null);
    }
  }, [formData.date, availableSlots]);

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
    if (!formData.date || !formData.userName || !formData.phone) {
      alert('請填寫所有必填欄位');
      return;
    }
    
    // 在實際應用中,這裡會發送API請求儲存預約數據
    console.log('提交預約:', formData);
    
    // 顯示成功訊息並返回首頁
    alert(`預約成功!\n日期: ${formData.date}\n預約者: ${formData.userName}\n請於使用前繳納押金`);
    router.push('/');
  };

  return (
    <div className={styles.container}>
      <Suspense fallback={null}>
        <BookingParamsReader onDateSelected={setSelectedDate} />
      </Suspense>

      <main className={styles.main}>
        <h1 className={styles.title}>預約雷切機使用</h1>
        
        <form className={styles.bookingForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="date">預約日期 *</label>
            <select 
              id="date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange}
              required
              className={styles.formControl}
            >
              <option value="">請選擇日期</option>
              {availableSlots.map(slot => (
                <option key={slot.date} value={slot.date}>
                  {slot.date} (19:00-21:00)
                </option>
              ))}
            </select>
          </div>
          
          {selectedSlotInfo && (
            <div className={styles.slotInfo}>
              <h3>值班人員</h3>
              <div className={styles.staffInfo}>
                <div>
                  <span className={styles.staffLabel}>雷切機管理員:</span>
                  <span className={styles.staffName}>{selectedSlotInfo.operatorName}</span>
                </div>
                <div>
                  <span className={styles.staffLabel}>環境檢查人員:</span>
                  <span className={styles.staffName}>{selectedSlotInfo.checkerName}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label htmlFor="userName">預約者姓名 *</label>
            <input 
              type="text" 
              id="userName" 
              name="userName" 
              value={formData.userName} 
              onChange={handleChange}
              required
              className={styles.formControl}
              placeholder="請輸入您的姓名"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="phone">聯絡電話 *</label>
            <input 
              type="tel" 
              id="phone" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange}
              required
              className={styles.formControl}
              placeholder="請輸入您的聯絡電話"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email">電子郵件</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange}
              className={styles.formControl}
              placeholder="請輸入您的電子郵件"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="purpose">使用目的</label>
            <select 
              id="purpose" 
              name="purpose" 
              value={formData.purpose} 
              onChange={handleChange}
              className={styles.formControl}
            >
              <option value="">請選擇使用目的</option>
              <option value="課程作業">課程作業</option>
              <option value="個人專案">個人專案</option>
              <option value="社團活動">社團活動</option>
              <option value="其他">其他</option>
            </select>
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
              placeholder="有特殊需求請在此說明"
            ></textarea>
          </div>
          
          <div className={styles.agreement}>
            <input 
              type="checkbox" 
              id="agreement" 
              required 
            />
            <label htmlFor="agreement">
              我了解並同意使用雷切機規定,包括繳納押金及使用完畢後清理環境
            </label>
          </div>
          
          <div className={styles.formActions}>
            <Link href="/" className={styles.cancelButton}>
              取消
            </Link>
            <button type="submit" className={styles.submitButton}>
              確認預約
            </button>
          </div>
        </form>
        
        <div className={styles.infoBox}>
          <h3>預約須知</h3>
          <ul>
            <li>雷切機使用時間為晚上 19:00-21:00</li>
            <li>預約成功後需在使用前繳納押金</li>
            <li>使用完畢請檢查環境：清理機台木屑、檢查垃圾、確認無個人物品、工具歸位</li>
            <li>雷切機管理員將協助您操作設備</li>
            <li>環境檢查人員將在使用結束後確認場地狀況</li>
          </ul>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>雷切機預約系統 © 2025</p>
      </footer>
    </div>
  );
}