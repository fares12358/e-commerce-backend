import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import cookieParser from 'cookie-parser';

const app = express();
app.set('trust proxy', 1);

const corsOptions = {
  origin: true, // ✅ reflects whatever origin is sent — allows all
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

export default app;