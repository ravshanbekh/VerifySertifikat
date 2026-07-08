import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { config } from '../../config/env';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../../middleware/auth.middleware';

// Serial raqam generatsiya
const generateSerialNumber = async (series: string): Promise<string> => {
  const count = await prisma.certificate.count({
    where: { serial_series: series },
  });
  const num = String(count + 1).padStart(6, '0');
  return `${series}-${num}`;
};

// QR kod generatsiya va saqlash
const generateQRCode = async (serialNumber: string): Promise<string> => {
  const verifyUrl = `${config.baseUrl.replace(':4000', ':3000')}/c/${serialNumber}`;
  const qrDir = path.join(config.uploadDir, 'qrcodes');
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

  const filename = `qr-${serialNumber.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
  const filePath = path.join(qrDir, filename);
  await QRCode.toFile(filePath, verifyUrl, { width: 300, margin: 2 });
  return `/uploads/qrcodes/${filename}`;
};

// Public: sertifikatni tekshirish
export const verifyCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serialNumber } = req.params;
    const cert = await prisma.certificate.findUnique({
      where: { serial_number: serialNumber as string },
      select: {
        id: true,
        serial_series: true,
        serial_number: true,
        full_name: true,
        course_name: true,
        course_description: true,
        course_start_date: true,
        course_end_date: true,
        status: true,
        file_url: true,
        qr_code_url: true,
        created_at: true,
      },
    });

    if (!cert) {
      res.status(404).json({
        success: false,
        found: false,
        message: 'Sertifikat topilmadi',
      });
      return;
    }

    res.json({
      success: true,
      found: true,
      data: {
        ...cert,
        is_valid: cert.status === 'active',
        is_revoked: cert.status === 'revoked',
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// Admin: barcha sertifikatlar ro'yxati
export const getCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { serial_number: { contains: search, mode: 'insensitive' } },
        { course_name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [total, certificates] = await Promise.all([
      prisma.certificate.count({ where }),
      prisma.certificate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { created_by: { select: { full_name: true, email: true } } },
      }),
    ]);

    res.json({
      success: true,
      data: certificates,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// Admin: bitta sertifikat
export const getCertificateById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { id: req.params.id as string },
      include: {
        created_by: { select: { full_name: true, email: true } },
        audit_logs: {
          include: { user: { select: { full_name: true } } },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });
    if (!cert) {
      res.status(404).json({ success: false, message: 'Topilmadi' });
      return;
    }
    res.json({ success: true, data: cert });
  } catch {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// Admin: yangi sertifikat yaratish (generatsiya)
export const createCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      serial_series = 'ITLA',
      serial_number: customSerial,
      full_name,
      course_name,
      course_description,
      course_start_date,
      course_end_date,
    } = req.body;

    if (!full_name || !course_name || !course_start_date || !course_end_date) {
      res.status(400).json({ success: false, message: 'Majburiy maydonlar to\'ldirilmagan' });
      return;
    }

    // Serial raqam
    let serialNumber = customSerial;
    if (!serialNumber) {
      serialNumber = await generateSerialNumber(serial_series);
    }

    // Mavjudligini tekshirish
    const existing = await prisma.certificate.findUnique({ where: { serial_number: serialNumber } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Bu seriya raqam allaqachon mavjud' });
      return;
    }

    // QR kod
    const qrCodeUrl = await generateQRCode(serialNumber);

    const cert = await prisma.certificate.create({
      data: {
        serial_series,
        serial_number: serialNumber,
        full_name,
        course_name,
        course_description,
        course_start_date: new Date(course_start_date),
        course_end_date: new Date(course_end_date),
        qr_code_url: qrCodeUrl,
        is_generated: true,
        created_by_id: req.user!.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'created',
        certificate_id: cert.id,
        ip_address: req.ip,
      },
    });

    res.status(201).json({ success: true, data: cert, message: 'Sertifikat yaratildi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// Admin: fayl yuklash orqali sertifikat
export const uploadCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Fayl tanlanmagan' });
      return;
    }

    const {
      serial_series = 'ITLA',
      serial_number: customSerial,
      full_name,
      course_name,
      course_description,
      course_start_date,
      course_end_date,
    } = req.body;

    if (!full_name || !course_name || !course_start_date || !course_end_date) {
      res.status(400).json({ success: false, message: 'Majburiy maydonlar to\'ldirilmagan' });
      return;
    }

    let serialNumber = customSerial;
    if (!serialNumber) {
      serialNumber = await generateSerialNumber(serial_series);
    }

    const existing = await prisma.certificate.findUnique({ where: { serial_number: serialNumber } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Bu seriya raqam allaqachon mavjud' });
      return;
    }

    const fileUrl = `/uploads/certificates/${req.file.filename}`;
    const qrCodeUrl = await generateQRCode(serialNumber);

    const cert = await prisma.certificate.create({
      data: {
        serial_series,
        serial_number: serialNumber,
        full_name,
        course_name,
        course_description,
        course_start_date: new Date(course_start_date),
        course_end_date: new Date(course_end_date),
        file_url: fileUrl,
        qr_code_url: qrCodeUrl,
        is_generated: false,
        created_by_id: req.user!.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'uploaded',
        certificate_id: cert.id,
        ip_address: req.ip,
      },
    });

    res.status(201).json({ success: true, data: cert, message: 'Sertifikat yuklandi' });
  } catch {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// Admin: sertifikatni tahrirlash
export const updateCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { full_name, course_name, course_description, course_start_date, course_end_date } = req.body;

    const cert = await prisma.certificate.findUnique({ where: { id: req.params.id as string } });
    if (!cert) {
      res.status(404).json({ success: false, message: 'Topilmadi' });
      return;
    }
    if (cert.status === 'revoked') {
      res.status(400).json({ success: false, message: 'Bekor qilingan sertifikatni tahrirlash mumkin emas' });
      return;
    }

    const updated = await prisma.certificate.update({
      where: { id: req.params.id as string },
      data: {
        ...(full_name && { full_name }),
        ...(course_name && { course_name }),
        ...(course_description !== undefined && { course_description }),
        ...(course_start_date && { course_start_date: new Date(course_start_date) }),
        ...(course_end_date && { course_end_date: new Date(course_end_date) }),
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'updated',
        certificate_id: cert.id,
        details: { before: cert, after: req.body },
        ip_address: req.ip,
      },
    });

    res.json({ success: true, data: updated, message: 'Yangilandi' });
  } catch {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// Super-Admin: sertifikatni bekor qilish
export const revokeCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cert = await prisma.certificate.findUnique({ where: { id: req.params.id as string } });
    if (!cert) {
      res.status(404).json({ success: false, message: 'Topilmadi' });
      return;
    }
    if (cert.status === 'revoked') {
      res.status(400).json({ success: false, message: 'Sertifikat allaqachon bekor qilingan' });
      return;
    }

    const updated = await prisma.certificate.update({
      where: { id: req.params.id as string },
      data: { status: 'revoked' },
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'revoked',
        certificate_id: cert.id,
        ip_address: req.ip,
      },
    });

    res.json({ success: true, data: updated, message: 'Sertifikat bekor qilindi' });
  } catch {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// Admin: qayta chiqarish (reissue)
export const reissueCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cert = await prisma.certificate.findUnique({ where: { id: req.params.id as string } });
    if (!cert) {
      res.status(404).json({ success: false, message: 'Topilmadi' });
      return;
    }

    // Yangi QR kod qayta yaratish
    const qrCodeUrl = await generateQRCode(cert.serial_number);

    const updated = await prisma.certificate.update({
      where: { id: req.params.id as string },
      data: { qr_code_url: qrCodeUrl, status: 'active' },
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'reissued',
        certificate_id: cert.id,
        ip_address: req.ip,
      },
    });

    res.json({ success: true, data: updated, message: 'Sertifikat qayta chiqarildi' });
  } catch {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
