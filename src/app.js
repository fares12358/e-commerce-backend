import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import cookieParser from 'cookie-parser';
// import errorHandler from './middlewares/error.middleware.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: ["https://e-commerce-templete-mu.vercel.app", "http://localhost:3000"],
  credentials: true
}));

app.use('/api', routes);
// app.use(errorHandler);

export default app;
