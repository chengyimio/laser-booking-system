import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const updates = await request.json();
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return Response.json({ message: '無效的更新數據' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('laser-booking');
    const schedules = db.collection('schedules');
    
    // 執行批量更新
    const operations = updates.map(update => {
      const { id, operatorConfirmed, checkerConfirmed } = update;
      return {
        updateOne: {
          filter: { _id: new ObjectId(id) },
          update: { 
            $set: { 
              operatorConfirmed, 
              checkerConfirmed,
              updatedAt: new Date() 
            } 
          }
        }
      };
    });
    
    const result = await schedules.bulkWrite(operations);
    
    return Response.json({ 
      message: '批量更新成功', 
      modifiedCount: result.modifiedCount 
    }, { status: 200 });
    
  } catch (error) {
    console.error('批量更新錯誤:', error);
    return Response.json({ message: '服務器錯誤' }, { status: 500 });
  }
}