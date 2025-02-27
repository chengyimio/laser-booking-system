// 獲取單個排班數據
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

// 更新API路由以支持編輯排班
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
        // 處理其它更新類型...
        // 例如確認狀態更新等
        
        // 更新排班
        const updatedSchedule = { ...schedule, ...body };
        
        const result = await schedules.updateOne(
          { _id: objectId },
          { $set: updatedSchedule }
        );
        
        return Response.json(updatedSchedule, { status: 200 });
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