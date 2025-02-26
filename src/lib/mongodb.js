import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
// 移除已棄用的選項
const options = {
  // 不再需要這些選項，它們在MongoDB驅動4.0+中已經默認啟用
  // useUnifiedTopology: true,
  // useNewUrlParser: true,
};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('請添加MongoDB URI到環境變量');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;