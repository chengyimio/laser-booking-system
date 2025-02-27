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
            if (schedule.operatorName === formData.name) {
              initialRole = 'operator';
            } else if (schedule.checkerName === formData.name) {
              initialRole = 'checker';
            }
            
            setFormData({
              date: schedule.date,
              role: initialRole,
              name: schedule.operatorName || schedule.checkerName || '',
              phone: schedule.operatorPhone || schedule.checkerPhone || '',
              notes: schedule.notes || '',
            });
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
    
    // 處理自定義日期
    const toggleCustomDate = () => {
      setIsCustomDate(!isCustomDate);
    };
    
    // 其它代碼保持不變...
    
    // 修改表單提交處理
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
    
    // 渲染表單
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
            
            {/* 其它表單欄位保持不變 */}
            
            <div className={styles.formActions}>
              <Link href="/" className={styles.cancelButton}>
                取消
              </Link>
              <button 
                type="submit" 
                className={styles.submitButton}
              >
                {isEditMode ? '更新排班' : '確認排班'}
              </button>
            </div>
          </form>
          
          {/* 其它內容保持不變 */}
        </main>
      </div>
    );
  }