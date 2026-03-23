import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import cookieParser from 'cookie-parser';

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://fares-dev.com',
  'https://store.fares-dev.com',
  'https://store2.fares-dev.com',
  'https://store3.fares-dev.com',
  'https://store4.fares-dev.com',
  'https://store5.fares-dev.com',
  'https://dashboard.fares-dev.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

export default app;