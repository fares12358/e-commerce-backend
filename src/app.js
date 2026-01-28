import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import cookieParser from 'cookie-parser';
// import errorHandler from './middlewares/error.middleware.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: true,
  credentials: true
}));

app.use('/api', routes);
// app.use(errorHandler);

export default app;
