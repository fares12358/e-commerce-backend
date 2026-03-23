import app from './app.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import cors from "cors";

dotenv.config();
connectDB();

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://fares-dev.com',
    'https://store.fares-dev.com',
    'https://store2.fares-dev.com',
    'https://store3.fares-dev.com',
    'https://store4.fares-dev.com',
    'https://store5.fares-dev.com',
    'https://dashboard.fares-dev.com'
  ],
  credentials: true,
}));

app.get('/', (req, res) => {
  res.send('Hello, e-commerce Backend!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

