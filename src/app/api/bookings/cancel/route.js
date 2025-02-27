import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
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
        return Response.json({ message: '找不到預約數據' }, { status: 404 });
      }
      
      if (!schedule.userBooked) {
        return Response.json({ message: '此時段尚未預約' }, { status: 400 });
      }
      
      // 清除預約信息
      const result = await schedules.updateOne(
        { _id: objectId },
        { $set: { userBooked: null, updatedAt: new Date() } }
      );
      
      if (result.modifiedCount === 1) {
        return Response.json({ message: '預約已成功取消' }, { status: 200 });
      } else {
        return Response.json({ message: '取消失敗' }, { status: 500 });
      }
    } catch (error) {
      console.error('取消預約錯誤:', error);
      return Response.json({ message: '無效的ID格式或操作失敗' }, { status: 400 });
    }
  } catch (error) {
    console.error('數據庫錯誤:', error);
    return Response.json({ message: '服務器錯誤' }, { status: 500 });
  }
}