import app from './app.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import cors from "cors";

dotenv.config();
connectDB();

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://192.168.8.26:3000', 'http://192.168.8.26:3001','http://localhost:3000','http://localhost:3001','store.fares-dev.com','dashboard.fares-dev.com'],
  credentials: true,
}));

app.get('/', (req, res) => {
  res.send('Hello, e-commerce Backend!');
});

app.listen(PORT,  () => { 
  console.log(`Server running on port ${PORT}`);
});

