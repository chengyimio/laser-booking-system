// scripts/init-data.js
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' }); // 讀取本地環境變量

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('請在.env.local文件中設置MONGODB_URI環境變量');
  process.exit(1);
}

// 初始排班數據
const initialSchedules = [
  { 
    date: '3/10', 
    operatorName: '陳苡瑄', 
    operatorPhone: '0912345678',
    operatorConfirmed: false, 
    checkerName: '林甄彙', 
    checkerPhone: '0923456789',
    checkerConfirmed: false,
    userBooked: null,
    createdAt: new Date()
  },
  { 
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
    date: '3/14', 
    operatorName: '林俊遑', 
    operatorPhone: '0956789012',
    operatorConfirmed: false, 
    checkerName: '', 
    checkerPhone: '',
    checkerConfirmed: false,
    userBooked: { 
      name: '王小明', 
      phone: '0912345678', 
      email: 'wang@example.com',
      bookedAt: new Date()
    },
    createdAt: new Date()
  },
  { 
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
    date: '3/19', 
    operatorName: '張珉甄', 
    operatorPhone: '0989012345',
    operatorConfirmed: false, 
    checkerName: '', 
    checkerConfirmed: false,
    userBooked: null,
    createdAt: new Date()
  },
  { 
    date: '3/21', 
    operatorName: '蔡承嶧', 
    operatorPhone: '0901234567',
    operatorConfirmed: false, 
    checkerName: '', 
    checkerConfirmed: false,
    userBooked: null,
    createdAt: new Date()
  }
];

async function initData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('已連接到MongoDB');
    
    const db = client.db('laser-booking');
    const schedules = db.collection('schedules');
    
    // 先清空現有數據
    await schedules.deleteMany({});
    console.log('已清空現有排班數據');
    
    // 插入初始數據
    const result = await schedules.insertMany(initialSchedules);
    console.log(`成功插入 ${result.insertedCount} 筆排班數據`);
    
  } catch (error) {
    console.error('初始化數據時出錯:', error);
  } finally {
    await client.close();
    console.log('已關閉MongoDB連接');
  }
}

// 執行初始化
initData();