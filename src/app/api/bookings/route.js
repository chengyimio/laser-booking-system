import clientPromise from '@/lib/mongodb';

// GET 請求處理 - 獲取排班
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const available = searchParams.get('available');
    
    const client = await clientPromise;
    const db = client.db('laser-booking');
    const schedules = db.collection('schedules');
    
    // 構建查詢條件
    let query = {};
    if (date) {
      query.date = date;
    }
    
   // 如果只需要可預約的時段
    if (available === 'true') {
    query.operatorName = { $ne: '' }; // 只要有雷切機管理員
    query.userBooked = null;
    }
    
    const result = await schedules.find(query).toArray();
    return Response.json(result);
  } catch (error) {
    console.error('數據庫錯誤:', error);
    return Response.json({ message: '服務器錯誤' }, { status: 500 });
  }
}

// POST 請求處理 - 創建預約或排班
export async function POST(request) {
  try {
    const body = await request.json();
    const isBookingRequest = body.type === 'booking';
    
    const client = await clientPromise;
    const db = client.db('laser-booking');
    const schedules = db.collection('schedules');
    
    if (isBookingRequest) {
      return handleBookingRequest(body, schedules);
    } else {
      return handleScheduleRequest(body, schedules);
    }
  } catch (error) {
    console.error('數據庫錯誤:', error);
    return Response.json({ message: '服務器錯誤' }, { status: 500 });
  }
}

// 處理預約請求
async function handleBookingRequest(data, schedules) {
  const { date, userName, phone, email, purpose, notes } = data;
  
  // 基本數據驗證
  if (!date || !userName || !phone) {
    return Response.json(
      { message: '缺少必要欄位' }, 
      { status: 400 }
    );
  }
  
    // 查找可預約的時段
    const schedule = await schedules.findOne({
      date: date,
      operatorName: { $ne: '' }, // 只需要雷切機管理員
      userBooked: null
    });

  
  if (!schedule) {
    return Response.json(
      { message: '該日期不可預約或已被預約' }, 
      { status: 400 }
    );
  }
  
  // 更新預約信息
  const result = await schedules.updateOne(
    { _id: schedule._id },
    { 
      $set: { 
        userBooked: {
          name: userName,
          phone,
          email: email || '',
          purpose: purpose || '',
          notes: notes || '',
          bookedAt: new Date()
        }
      } 
    }
  );
  
  if (result.modifiedCount === 1) {
    return Response.json(
      { message: '預約成功' }, 
      { status: 200 }
    );
  } else {
    return Response.json(
      { message: '預約失敗，請稍後再試' }, 
      { status: 500 }
    );
  }
}

// 處理排班請求
async function handleScheduleRequest(data, schedules) {
  const { date, role, name, phone, notes } = data;
  
  // 基本數據驗證
  if (!date || !role || !name) {
    return Response.json(
      { message: '缺少必要欄位' }, 
      { status: 400 }
    );
  }
  
  // 查找該日期是否已有排班
  const existingSchedule = await schedules.findOne({ date });
  
  if (!existingSchedule) {
    // 創建新排班
    const newSchedule = {
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
    
    const result = await schedules.insertOne(newSchedule);
    
    if (result.insertedId) {
      return Response.json(
        { message: '排班創建成功', schedule: newSchedule }, 
        { status: 201 }
      );
    } else {
      return Response.json(
        { message: '排班創建失敗，請稍後再試' }, 
        { status: 500 }
      );
    }
  } else {
    // 檢查該角色是否已被排班
    if (role === 'operator' && existingSchedule.operatorName) {
      return Response.json(
        { message: '此日期的雷切機管理員已排班' }, 
        { status: 400 }
      );
    }
    
    if (role === 'checker' && existingSchedule.checkerName) {
      return Response.json(
        { message: '此日期的環境檢查人員已排班' }, 
        { status: 400 }
      );
    }
    
    // 更新排班
    const update = {};
    if (role === 'operator') {
      update.operatorName = name;
      update.operatorPhone = phone || '';
    } else {
      update.checkerName = name;
      update.checkerPhone = phone || '';
    }
    
    const result = await schedules.updateOne(
      { _id: existingSchedule._id },
      { $set: update }
    );
    
    if (result.modifiedCount === 1) {
      return Response.json(
        { message: '排班更新成功' }, 
        { status: 200 }
      );
    } else {
      return Response.json(
        { message: '排班更新失敗，請稍後再試' }, 
        { status: 500 }
      );
    }
  }
}