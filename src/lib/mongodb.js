import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('請添加MongoDB URI到環境變量');
}

if (process.env.NODE_ENV === 'development') {
  // 在開發模式中使用全局變量，這樣熱重載不會重新建立連接
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // 在生產模式中為每個請求創建新的連接
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;