'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  // 管理員排班資料 - 在實際應用中,這裡會從API獲取
  const [schedules, setSchedules] = useState([
    { 
      date: '3/10', 
      operatorName: '陳苡瑄', 
      operatorConfirmed: false, 
      checkerName: '林甄彙', 
      checkerConfirmed: false,
      userBooked: null // 預約者資訊，null表示尚未被預約
    },
    { 
      date: '3/12', 
      operatorName: '陳佳儀', 
      operatorConfirmed: false, 
      checkerName: '', 
      checkerConfirmed: false,
      userBooked: null 
    },
    { 
      date: '3/14', 
      operatorName: '林俊遑', 
      operatorConfirmed: false, 
      checkerName: '', 
      checkerConfirmed: false,
      userBooked: '王小明' // 已被預約
    },
    { 
      date: '3/17', 
      operatorName: '戴婕茵', 
      operatorConfirmed: false, 
      checkerName: '趙翊伶', 
      checkerConfirmed: false,
      userBooked: null
    },
    { 
      date: '3/19', 
      operatorName: '張珉甄', 
      operatorConfirmed: false, 
      checkerName: '', 
      checkerConfirmed: false,
      userBooked: null
    },
    { 
      date: '3/21', 
      operatorName: '蔡承嶧', 
      operatorConfirmed: false, 
      checkerName: '', 
      checkerConfirmed: false,
      userBooked: null
    },
  ]);

  // 可排班的日期列表 (尚未有管理員排班的日期)
  const availableDates = [
    '4/2', '4/7', '4/9', '4/11', '4/14', '4/16', '4/18', '4/21', '4/23', '4/25', '4/28', '4/30',
    '5/2', '5/5', '5/7', '5/9', '5/12', '5/14', '5/16', '5/19', '5/21', '5/23', '5/26', '5/28', '5/30',
    '6/2', '6/4', '6/7', '6/9'
  ];

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentManager, setCurrentManager] = useState('');

  const toggleConfirm = (index, type) => {
    if (!isAdmin) return;
    
    const updatedSchedules = [...schedules];
    if (type === 'operator') {
      updatedSchedules[index].operatorConfirmed = !updatedSchedules[index].operatorConfirmed;
    } else {
      updatedSchedules[index].checkerConfirmed = !updatedSchedules[index].checkerConfirmed;
    }
    setSchedules(updatedSchedules);

    // 在實際應用中,這裡會發送API請求更新資料庫
  };

  // 簡易登入功能（在真實應用中會使用更安全的方法）
  const handleAdminLogin = () => {
    const name = prompt('請輸入管理員姓名:');
    if (name) {
      setIsLoggedIn(true);
      setIsAdmin(true);
      setCurrentManager(name);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentManager('');
  };

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
              </tr>
            </thead>
            <tbody>
              {/* 已排班時段 */}
              {schedules.map((schedule, index) => (
                <tr key={`schedule-${index}`} className={!schedule.checkerName ? styles.incompleteRow : ''}>
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
                      <span className={styles.bookedTag}>已預約 ({schedule.userBooked})</span>
                    ) : !schedule.checkerName ? (
                      <span className={styles.waitingTag}>待安排檢查人員</span>
                    ) : (
                      <Link href={`/booking?date=${schedule.date}`} className={styles.bookLink}>
                        可預約
                      </Link>
                    )}
                  </td>
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