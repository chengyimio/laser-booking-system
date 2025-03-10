'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  // 管理員排班資料 - 從API獲取
  const [schedules, setSchedules] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentManager, setCurrentManager] = useState('');

  // 獲取排班數據
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/bookings');
        
        if (!response.ok) {
          throw new Error('獲取數據失敗');
        }
        
        const data = await response.json();
        setSchedules(data);
        
        // 生成未排班日期列表
        const bookedDates = new Set(data.map(schedule => schedule.date));
        const availableDates = [];
        
        // 生成接下來2個月的日期
        const now = new Date();
        for (let i = 0; i < 60; i++) {
          const date = new Date(now);
          date.setDate(now.getDate() + i);
          
          // 只考慮未來日期
          if (date > now) {
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
            
            // 如果該日期還沒有排班記錄，添加到可用日期列表
            if (!bookedDates.has(formattedDate)) {
              availableDates.push(formattedDate);
            }
          }
        }
        
        setAvailableDates(availableDates);
        setError(null);
      } catch (err) {
        console.error('獲取數據錯誤:', err);
        setError('獲取數據時出錯，請刷新頁面重試');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);
  const handleDeleteSchedule = async (id) => {
    if (!confirm('確定要刪除此排班嗎？')) return;
    
    try {
      const response = await fetch(`/api/bookings?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // 從UI中移除被刪除的排班
        setSchedules(schedules.filter(schedule => schedule._id !== id));
        alert('排班已成功刪除');
      } else {
        const error = await response.json();
        alert(`刪除失敗: ${error.message || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('刪除排班錯誤:', error);
      alert('刪除時發生錯誤');
    }
  };
  
  const toggleConfirm = async (index, type) => {
    if (!isAdmin) return;
    
    // 獲取要更新的排班
    const schedule = schedules[index];
    
    // 創建更新後的狀態
    const updatedSchedules = [...schedules];
    
    // 根據點擊的類型更新本地狀態
    if (type === 'operator') {
      updatedSchedules[index].operatorConfirmed = !schedule.operatorConfirmed;
    } else {
      updatedSchedules[index].checkerConfirmed = !schedule.checkerConfirmed;
    }
    
    // 立即更新UI（樂觀更新）
    setSchedules(updatedSchedules);
    
    try {
      // 發送API請求更新數據庫
      const response = await fetch(`/api/bookings?id=${schedule._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorConfirmed: type === 'operator' ? !schedule.operatorConfirmed : schedule.operatorConfirmed,
          checkerConfirmed: type === 'checker' ? !schedule.checkerConfirmed : schedule.checkerConfirmed
        }),
      });
      
      if (!response.ok) {
        // 如果請求失敗，還原UI狀態
        console.error('更新確認狀態失敗');
        // 還原為原始狀態
        if (type === 'operator') {
          updatedSchedules[index].operatorConfirmed = schedule.operatorConfirmed;
        } else {
          updatedSchedules[index].checkerConfirmed = schedule.checkerConfirmed;
        }
        setSchedules([...updatedSchedules]);
      }
    } catch (error) {
      console.error('更新確認狀態出錯:', error);
      // 還原為原始狀態
      if (type === 'operator') {
        updatedSchedules[index].operatorConfirmed = schedule.operatorConfirmed;
      } else {
        updatedSchedules[index].checkerConfirmed = schedule.checkerConfirmed;
      }
      setSchedules([...updatedSchedules]);
    }
  };

// 添加刪除預約功能
  const handleDeleteBooking = async (scheduleId) => {
    if (!confirm('確定要刪除此預約嗎？')) return;
    
    try {
      const response = await fetch(`/api/bookings/cancel?id=${scheduleId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // 更新UI，移除預約信息
        const updatedSchedules = schedules.map(schedule => {
          if (schedule._id === scheduleId) {
            return { ...schedule, userBooked: null };
          }
          return schedule;
        });
        
        setSchedules(updatedSchedules);
        alert('預約已成功取消');
      } else {
        const error = await response.json();
        alert(`取消失敗: ${error.message || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('取消預約錯誤:', error);
      alert('取消預約時發生錯誤');
    }
  };

  // 修改登入功能使用密碼
  const handleAdminLogin = () => {
    const password = prompt('請輸入管理員密碼:');
    if (password === 'ipta78802') { // 這裡設置您的管理員密碼
      setIsLoggedIn(true);
      setIsAdmin(true);
      setCurrentManager('管理員');
      localStorage.setItem('admin', 'true'); // 儲存登入狀態
    } else {
      alert('密碼錯誤');
    }
  };

  const handleLogout = async () => {
    // 準備所有需要更新的數據
    const updates = schedules.map(schedule => ({
      id: schedule._id,
      operatorConfirmed: schedule.operatorConfirmed,
      checkerConfirmed: schedule.checkerConfirmed
    }));
    
    // 將當前狀態保存到數據庫
    try {
      const response = await fetch('/api/bookings/batch-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('批量更新失敗');
      }
      
      console.log('所有狀態已成功保存到數據庫');
      
    } catch (error) {
      console.error('保存狀態時出錯:', error);
      alert('登出前保存狀態失敗，部分變更可能未保存');
    }
    
    // 然後清除登入狀態
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentManager('');
    localStorage.removeItem('admin');
  };
  
  // 檢查之前的登入狀態
  useEffect(() => {
    const savedAdmin = localStorage.getItem('admin');
    if (savedAdmin === 'true') {
      setIsLoggedIn(true);
      setIsAdmin(true);
      setCurrentManager('管理員');
    }
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.loading}>載入中...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.error}>{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>雷切機預約系統</h1>
          <div className={styles.actions}>
            {isLoggedIn ? (
              <>
                <span className={styles.welcomeText}>
                  {isAdmin ? '管理員' : '用戶'}: {currentManager}
                </span>
                <Link href="/admin/schedule" className={styles.adminButton}>
                  管理排班
                </Link>
                <button onClick={handleLogout} className={styles.logoutButton}>
                  登出
                </button>
              </>
            ) : (
              <>
                <Link href="/booking" className={styles.bookButton}>
                  我要預約
                </Link>
                <button onClick={handleAdminLogin} className={styles.adminButton}>
                  管理員登入
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.bookingTable}>
          <thead>
            <tr>
              <th>日期</th>
              <th>雷切機管理員 (19:00-21:00)</th>
              <th>確認</th>
              <th>環境檢查人員</th>
              <th>確認</th>
              <th>預約狀態</th>
              {isAdmin && <th>操作</th>}
            </tr>
          </thead>
            <tbody>
            {/* 已排班時段 */}
            {schedules.map((schedule, index) => (
              <tr key={`schedule-${schedule._id || index}`}>
                <td>{schedule.date}</td>
                <td>{schedule.operatorName}</td>
                <td className={styles.checkboxCell} onClick={() => toggleConfirm(index, 'operator')}>
                  <div className={`${styles.checkbox} ${schedule.operatorConfirmed ? styles.checked : ''}`}>
                    {schedule.operatorConfirmed ? '✓' : ''}
                  </div>
                </td>
                <td>{schedule.checkerName || '尚無人員'}</td>
                <td className={styles.checkboxCell} onClick={() => toggleConfirm(index, 'checker')}>
                  <div className={`${styles.checkbox} ${schedule.checkerConfirmed ? styles.checked : ''}`}>
                    {schedule.checkerConfirmed ? '✓' : ''}
                  </div>
                </td>
                <td>
                {schedule.userBooked ? (
                  <div className={styles.bookedInfo}>
                    <span className={styles.bookedTag}>已預約 ({schedule.userBooked.name})</span>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteBooking(schedule._id)} 
                        className={styles.cancelBookingButton}
                      >
                        取消預約
                      </button>
                    )}
                  </div>
                ) : !schedule.operatorName ? (
                  <span className={styles.waitingTag}>待安排雷切機管理員</span>
                ) : (
                  <Link href={`/booking?date=${schedule.date}`} className={styles.bookLink}>
                    可預約
                  </Link>
                )}
                </td>
                {isAdmin && (
                  <td className={styles.actionCell}>
                    <Link href={`/admin/schedule?edit=true&id=${schedule._id}`} className={styles.editLink}>
                      編輯
                    </Link>
                    <button 
                      onClick={() => handleDeleteSchedule(schedule._id)} 
                      className={styles.deleteButton}
                    >
                      刪除
                    </button>
                  </td>
                )}
              </tr>
            ))}
              
              {/* 未排班時段 - 只有管理員可見 */}
              {isAdmin && availableDates.map((date, index) => (
                <tr key={`available-${index}`} className={styles.availableRow}>
                  <td>{date}</td>
                  <td className={styles.emptyCell}>尚未排班</td>
                  <td className={styles.checkboxCell}>
                    <div className={styles.checkbox}></div>
                  </td>
                  <td className={styles.emptyCell}>尚未排班</td>
                  <td className={styles.checkboxCell}>
                    <div className={styles.checkbox}></div>
                  </td>
                  <td>
                    <Link href={`/admin/schedule?date=${date}`} className={styles.scheduleLink}>
                      安排排班
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.infoBox}>
          <h3>使用說明</h3>
          <ul>
            <li>雷切機使用時間為晚上 19:00 - 21:00</li>
            <li>每個時段需要有雷切機管理員和環境檢查人員才能開放預約</li>
            <li>使用前需繳納押金</li>
            <li>使用完畢請檢查環境：清理機台木屑、檢查垃圾、確認無個人物品、工具歸位</li>
          </ul>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>雷切機預約系統 © 2025</p>
      </footer>
    </div>
  );
}