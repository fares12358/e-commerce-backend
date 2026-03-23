import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import cookieParser from 'cookie-parser';
// import errorHandler from './middlewares/error.middleware.js';

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

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman / server-side

    if (allowedOrigins.includes(origin)) {
      callback(null, origin); // ✅ return the exact origin
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.options('*', cors());

app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);
// app.use(errorHandler);

export default app;
