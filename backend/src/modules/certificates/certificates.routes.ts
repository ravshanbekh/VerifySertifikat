import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import {
  verifyCertificate,
  getCertificates,
  getCertificateById,
  createCertificate,
  uploadCertificate,
  updateCertificate,
  revokeCertificate,
  reissueCertificate,
  downloadCertificate,
  deleteCertificate,
} from './certificates.controller';

// Multer sozlamasi
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, './uploads/certificates');
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `cert-${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Faqat PDF, JPG, PNG formatlar qabul qilinadi'));
    }
  },
});

const router = Router();

// Public endpoint (auth shart emas)
router.get('/verify/:serialNumber', verifyCertificate);

// Auth talab qilinadi
router.use(authenticate);

router.get('/', getCertificates);
router.get('/:id', getCertificateById);
router.post('/', createCertificate);
router.post('/upload', upload.single('file'), uploadCertificate);
router.put('/:id', updateCertificate);
router.post('/:id/reissue', reissueCertificate);
router.post('/:id/revoke', requireRole('super_admin'), revokeCertificate);
router.get('/:id/download', downloadCertificate);
router.delete('/:id', deleteCertificate);

export default router;
