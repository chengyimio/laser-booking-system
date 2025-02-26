// 這是一個簡單的API處理預約和排班請求
// 在實際應用中，這裡會連接到數據庫

// 模擬的排班和預約數據 - 實際應用會使用數據庫
let schedules = [
  { 
    id: 1, 
    date: '3/10', 
    operatorName: '陳苡瑄', 
    operatorPhone: '0912345678', 
    operatorConfirmed: false, 
    checkerName: '林甄彙', 
    checkerPhone: '0923456789', 
    checkerConfirmed: false, 
    userBooked: null, // 預約者資訊，null表示尚未被預約
    createdAt: new Date() 
  },
  { 
    id: 2, 
    date: '3/12', 
    operatorName: '陳佳儀', 
    operatorPhone: '0934567890', 
    operatorConfirmed: false, 
    checkerName: '張珮玲', 
    checkerPhone: '0945678901', 
    checkerConfirmed: false,
    userBooked: null,
    createdAt: new Date() 
  },
  { 
    id: 3, 
    date: '3/14', 
    operatorName: '林俊遑', 
    operatorPhone: '0956789012', 
    operatorConfirmed: false, 
    checkerName: '', 
    checkerPhone: '', 
    checkerConfirmed: false,
    userBooked: { name: '王小明', phone: '0912345678', email: 'wang@example.com' },
    createdAt: new Date() 
  },
  { 
    id: 4, 
    date: '3/17', 
    operatorName: '戴婕茵', 
    operatorPhone: '0967890123', 
    operatorConfirmed: false, 
    checkerName: '趙翊伶', 
    checkerPhone: '0978901234', 
    checkerConfirmed: false,
    userBooked: null,
    createdAt: new Date() 
  },
  { 
    id: 5, 
    date: '3/19', 
    operatorName: '張珉甄', 
    operatorPhone: '0989012345', 
    operatorConfirmed: false, 
    checkerName: '林芸均', 
    checkerPhone: '0990123456', 
    checkerConfirmed: false,
    userBooked: null,
    createdAt: new Date() 
  },
  { 
    id: 6, 
    date: '3/21', 
    operatorName: '蔡承嶧', 
    operatorPhone: '0901234567', 
    operatorConfirmed: false, 
    checkerName: '陳妍羽', 
    checkerPhone: '0912345678', 
    checkerConfirmed: false,
    userBooked: null,
    createdAt: new Date() 
  },
  {
    id: 7,
    date: '4/2',
    operatorName: '陳苡瑄',
    operatorPhone: '0912345678',
    operatorConfirmed: false,
    checkerName: '',
    checkerPhone: '',
    checkerConfirmed: false,
    userBooked: null,
    createdAt: new Date()
  },
  {
    id: 8,
    date: '4/9',
    operatorName: '',
    operatorPhone: '',
    operatorConfirmed: false,
    checkerName: '林甄彙',
    checkerPhone: '0923456789',
    checkerConfirmed: false,
    userBooked: null,
    createdAt: new Date()
  }
];

// Next.js App Router API路由處理 - 獲取排班
export async function GET(request) {
  // 解析URL參數
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const available = searchParams.get('available');
  
  // 過濾結果
  let result = [...schedules];
  
  // 如果指定日期，返回特定日期的排班
  if (date) {
    result = result.filter(schedule => schedule.date === date);
  }
  
  // 如果只需要可預約的時段（有操作員和檢查員且未被預約）
  if (available === 'true') {
    result = result.filter(schedule => 
      schedule.operatorName && 
      schedule.checkerName && 
      !schedule.userBooked
    );
  }
  
  return Response.json(result);
}

// 新增/更新排班
export async function POST(request) {
  const body = await request.json();
  
  // 檢查是否為預約請求或排班請求
  const isBookingRequest = body.type === 'booking';
  
  if (isBookingRequest) {
    // 處理預約請求
    return handleBookingRequest(body);
  } else {
    // 處理排班請求
    return handleScheduleRequest(body);
  }
}

// 處理預約請求
async function handleBookingRequest(data) {
  const { date, userName, phone, email, purpose, notes } = data;
  
  // 基本數據驗證
  if (!date || !userName || !phone) {
    return Response.json(
      { message: '缺少必要欄位' }, 
      { status: 400 }
    );
  }
  
  // 檢查日期是否存在且可預約
  const scheduleIndex = schedules.findIndex(
    s => s.date === date && s.operatorName && s.checkerName && !s.userBooked
  );
  
  if (scheduleIndex === -1) {
    return Response.json(
      { message: '該日期不可預約或已被預約' }, 
      { status: 400 }
    );
  }
  
  // 更新預約信息
  schedules[scheduleIndex].userBooked = {
    name: userName,
    phone,
    email: email || '',
    purpose: purpose || '',
    notes: notes || '',
    bookedAt: new Date()
  };
  
  return Response.json(
    { message: '預約成功', schedule: schedules[scheduleIndex] }, 
    { status: 200 }
  );
}

// 處理排班請求
async function handleScheduleRequest(data) {
  const { date, role, name, phone, notes } = data;
  
  // 基本數據驗證
  if (!date || !role || !name) {
    return Response.json(
      { message: '缺少必要欄位' }, 
      { status: 400 }
    );
  }
  
  // 檢查日期是否已存在排班
  let scheduleIndex = schedules.findIndex(s => s.date === date);
  
  if (scheduleIndex === -1) {
    // 創建新排班
    const newSchedule = {
      id: schedules.length + 1,
      date,
      operatorName: role === 'operator' ? name : '',
      operatorPhone: role === 'operator' ? phone || '' : '',
      operatorConfirmed: false,
      checkerName: role === 'checker' ? name : '',
      checkerPhone: role === 'checker' ? phone || '' : '',
      checkerConfirmed: false,
      userBooked: null,
      notes: notes || '',
      createdAt: new Date()
    };
    
    schedules.push(newSchedule);
    
    return Response.json(
      { message: '排班創建成功', schedule: newSchedule }, 
      { status: 201 }
    );
  } else {
    // 檢查該角色是否已被排班
    const schedule = schedules[scheduleIndex];
    
    if (role === 'operator' && schedule.operatorName) {
      return Response.json(
        { message: '此日期的雷切機管理員已排班' }, 
        { status: 400 }
      );
    }
    
    if (role === 'checker' && schedule.checkerName) {
      return Response.json(
        { message: '此日期的環境檢查人員已排班' }, 
        { status: 400 }
      );
    }
    
    // 更新排班
    if (role === 'operator') {
      schedules[scheduleIndex].operatorName = name;
      schedules[scheduleIndex].operatorPhone = phone || '';
    } else {
      schedules[scheduleIndex].checkerName = name;
      schedules[scheduleIndex].checkerPhone = phone || '';
    }
    
    return Response.json(
      { message: '排班更新成功', schedule: schedules[scheduleIndex] }, 
      { status: 200 }
    );
  }
}

// 更新排班確認狀態
export async function PUT(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const body = await request.json();
  
  // 查找排班
  const index = schedules.findIndex(schedule => schedule.id === parseInt(id));
  
  if (index === -1) {
    return Response.json(
      { message: '排班不存在' }, 
      { status: 404 }
    );
  }
  
  // 更新排班
  const updatedSchedule = { ...schedules[index], ...body };
  schedules[index] = updatedSchedule;
  
  return Response.json(updatedSchedule, { status: 200 });
}

// 刪除排班
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  // 檢查排班是否存在
  const index = schedules.findIndex(schedule => schedule.id === parseInt(id));
  
  if (index === -1) {
    return Response.json(
      { message: '排班不存在' }, 
      { status: 404 }
    );
  }
  
  // 檢查是否已有人預約
  if (schedules[index].userBooked) {
    return Response.json(
      { message: '此排班已有人預約，無法刪除' }, 
      { status: 400 }
    );
  }
  
  // 從列表中移除
  schedules.splice(index, 1);
  
  return Response.json({ message: '排班已刪除' }, { status: 200 });
}