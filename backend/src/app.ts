import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import fs from 'fs';

import { config } from './config/env';
import { errorHandler } from './middleware/error.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import certificateRoutes from './modules/certificates/certificates.routes';
import userRoutes from './modules/users/users.routes';
import auditRoutes from './modules/audit/audit.routes';

const app = express();

// Rate limit trust proxy
app.set('trust proxy', 1);

// Upload papkalarini yaratish
const uploadDirs = [
  './uploads',
  './uploads/certificates',
  './uploads/qrcodes',
];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Rate limiter (public verify uchun)
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 daqiqa
  max: 20,
  message: { success: false, message: 'Juda ko\'p so\'rov. 1 daqiqadan keyin urinib ko\'ring.' },
});

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // uploads uchun
}));
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(globalLimiter);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static fayllar (uploadlar)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);

// Public verify endpoint (rate limited)
app.get('/api/verify/:serialNumber', verifyLimiter, async (req, res) => {
  const { verifyCertificate } = await import('./modules/certificates/certificates.controller');
  return verifyCertificate(req, res);
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint topilmadi' });
});

// Error handler
app.use(errorHandler);

// Server ishga tushirish
app.listen(config.port, () => {
  console.log(`✅ Server ishga tushdi: http://localhost:${config.port}`);
  console.log(`📦 Muhit: ${config.nodeEnv}`);
});

export default app;
