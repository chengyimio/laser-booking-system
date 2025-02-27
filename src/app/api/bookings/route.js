import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET 請求處理 - 獲取排班
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const date = searchParams.get('date');
    const available = searchParams.get('available');
    
    const client = await clientPromise;
    const db = client.db('laser-booking');
    const schedules = db.collection('schedules');
    
    // 如果指定了ID，返回該ID的排班
    if (id) {
      try {
        const objectId = new ObjectId(id);
        const schedule = await schedules.findOne({ _id: objectId });
        
        if (!schedule) {
          return Response.json({ message: '找不到排班數據' }, { status: 404 });
        }
        
        return Response.json(schedule);
      } catch (error) {
        return Response.json({ message: '無效的ID格式' }, { status: 400 });
      }
    }
    
    // 構建查詢條件
    let query = {};
    if (date) {
      query.date = date;
    }
    
    // 如果只需要可預約的時段
    if (available === 'true') {
      query.operatorName = { $ne: '' }; // 只需要雷切機管理員
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

// 更新排班確認狀態
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return Response.json({ message: '缺少ID參數' }, { status: 400 });
    }
    
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('laser-booking');
    const schedules = db.collection('schedules');
    
    try {
      const objectId = new ObjectId(id);
      const schedule = await schedules.findOne({ _id: objectId });
      
      if (!schedule) {
        return Response.json({ message: '找不到排班數據' }, { status: 404 });
      }
      
      // 處理排班更新
      if (body.type === 'schedule') {
        const { role, name, phone, date, notes } = body;
        
        // 基本數據驗證
        if (!role || !name || !date) {
          return Response.json({ message: '缺少必要欄位' }, { status: 400 });
        }
        
        // 準備更新數據
        const update = {};
        
        // 如果日期變更，檢查新日期是否已被使用
        if (date !== schedule.date) {
          const existingSchedule = await schedules.findOne({ 
            date,
            _id: { $ne: objectId }
          });
          
          if (existingSchedule) {
            return Response.json({ message: '該日期已有其他排班' }, { status: 400 });
          }
          
          update.date = date;
        }
        
        // 更新角色相關欄位
        if (role === 'operator') {
          update.operatorName = name;
          update.operatorPhone = phone || '';
        } else {
          update.checkerName = name;
          update.checkerPhone = phone || '';
        }
        
        if (notes !== undefined) {
          update.notes = notes;
        }
        
        update.updatedAt = new Date();
        
        const result = await schedules.updateOne(
          { _id: objectId },
          { $set: update }
        );
        
        if (result.modifiedCount === 1) {
          return Response.json({ message: '排班更新成功' }, { status: 200 });
        } else {
          return Response.json({ message: '排班未更改' }, { status: 200 });
        }
      } else {
        // 處理其它更新類型，例如確認狀態更新
        const updatedFields = {};
        
        // 只允許更新特定字段
        if ('operatorConfirmed' in body) {
          updatedFields.operatorConfirmed = body.operatorConfirmed;
        }
        
        if ('checkerConfirmed' in body) {
          updatedFields.checkerConfirmed = body.checkerConfirmed;
        }
        
        if (Object.keys(updatedFields).length === 0) {
          return Response.json({ message: '沒有可更新的字段' }, { status: 400 });
        }
        
        updatedFields.updatedAt = new Date();
        
        const result = await schedules.updateOne(
          { _id: objectId },
          { $set: updatedFields }
        );
        
        if (result.modifiedCount === 1) {
          return Response.json({ message: '更新成功' }, { status: 200 });
        } else {
          return Response.json({ message: '無變更' }, { status: 200 });
        }
      }
    } catch (error) {
      console.error('更新錯誤:', error);
      return Response.json({ message: '無效的ID格式或更新操作失敗' }, { status: 400 });
    }
  } catch (error) {
    console.error('數據庫錯誤:', error);
    return Response.json({ message: '服務器錯誤' }, { status: 500 });
  }
}

// 刪除排班
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return Response.json({ message: '缺少ID參數' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('laser-booking');
    const schedules = db.collection('schedules');
    
    try {
      const objectId = new ObjectId(id);
      const schedule = await schedules.findOne({ _id: objectId });
      
      if (!schedule) {
        return Response.json({ message: '找不到排班數據' }, { status: 404 });
      }
      
      // 檢查是否已有人預約
      if (schedule.userBooked) {
        return Response.json(
          { message: '此排班已有人預約，無法刪除' }, 
          { status: 400 }
        );
      }
      
      // 從列表中移除
      const result = await schedules.deleteOne({ _id: objectId });
      
      if (result.deletedCount === 1) {
        return Response.json({ message: '排班已刪除' }, { status: 200 });
      } else {
        return Response.json({ message: '刪除失敗' }, { status: 500 });
      }
    } catch (error) {
      console.error('刪除錯誤:', error);
      return Response.json({ message: '無效的ID格式或刪除操作失敗' }, { status: 400 });
    }
  } catch (error) {
    console.error('數據庫錯誤:', error);
    return Response.json({ message: '服務器錯誤' }, { status: 500 });
  }
}