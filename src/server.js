import app from './app.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import cors from "cors";

dotenv.config();
connectDB();

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true,
}));

app.get('/', (req, res) => {
  res.send('Hello, e-commerce Backend!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

