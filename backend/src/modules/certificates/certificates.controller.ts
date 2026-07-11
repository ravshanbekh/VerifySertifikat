import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { config } from '../../config/env';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../../middleware/auth.middleware';
import { generateCertificateImage, convertPngToPdf, COURSE_SERIES_MAP } from './certificate-generator';

// Serial raqam generatsiya (KK FYYMMNNN formatida, chiziqlarsiz)
const generateSerialNumber = async (
  courseCode: string,
  branchCode: string,
  signingDateStr?: string
): Promise<string> => {
  const date = signingDateStr ? new Date(signingDateStr) : new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `${courseCode} ${branchCode}${yy}${mm}`;

  // Ma'lumotlar bazasidan ushbu prefiks bilan boshlanadigan oxirgi sertifikatni qidirish
  const latestCert = await prisma.certificate.findFirst({
    where: {
      serial_number: {
        startsWith: prefix,
      },
    },
    orderBy: {
      serial_number: 'desc',
    },
  });

  let nextNum = 1;
  if (latestCert) {
    const lastPart = latestCert.serial_number.slice(-3);
    const numPart = parseInt(lastPart, 10);
    if (!isNaN(numPart)) {
      nextNum = numPart + 1;
    }
  }

  const nnn = String(nextNum).padStart(3, '0');
  return `${prefix}${nnn}`;
};

// Kurs nomidan seriya prefiksini aniqlash
const getSeriesFromCourse = (courseName: string): string => {
  const entry = COURSE_SERIES_MAP[courseName];
  if (entry) return entry.prefix;
  // Nomalum kurs uchun: birinchi 2 harf (katta)
  return courseName.slice(0, 2).toUpperCase();
};

// Kursga mos tavsifni olish
const getDescriptionFromCourse = (courseName: string, customDesc?: string): string => {
  if (customDesc && customDesc.trim()) return customDesc.trim();
  const entry = COURSE_SERIES_MAP[courseName];
  return entry?.description || '';
};

// QR kod generatsiya va saqlash (faqat keyingi foydalanish uchun saqlanadi, shablon o'zgarmaydi)
const generateQRCode = async (serialNumber: string): Promise<string> => {
  const verifyUrl = `${config.frontendUrl}/c/${serialNumber}`;
  const qrDir = path.join(config.uploadDir, 'qrcodes');
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

  const filename = `qr-${serialNumber.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
  const filePath = path.join(qrDir, filename);
  await QRCode.toFile(filePath, verifyUrl, { width: 300, margin: 2 });
  return `/uploads/qrcodes/${filename}`;
};

// Sertifikat PNG + PDF generatsiya qilish
const generateCertificateFiles = async (
  serialNumber: string,
  fullName: string,
  courseName: string,
  courseDescription: string,
  courseEndDate: Date,
): Promise<{ pngUrl: string; pdfUrl: string }> => {
  const certDir = path.join(config.uploadDir, 'generated');
  if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });

  const safeName = serialNumber.replace(/[^a-zA-Z0-9]/g, '-');
  const pngPath = path.join(certDir, `cert-${safeName}.png`);
  const pdfPath = path.join(certDir, `cert-${safeName}.pdf`);

  await generateCertificateImage(
    { fullName, courseName, courseDescription, courseEndDate, serialNumber },
    pngPath,
  );
  await convertPngToPdf(pngPath, pdfPath);

  return {
    pngUrl: `/uploads/generated/cert-${safeName}.png`,
    pdfUrl: `/uploads/generated/cert-${safeName}.pdf`,
  };
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
      serial_number: customSerial,
      full_name,
      course_name,
      course_description,
      course_start_date,
      course_end_date,
      branch_code,
      course_code,
      signing_date,
    } = req.body;

    if (!full_name || !course_name || !course_start_date || !course_end_date) {
      res.status(400).json({ success: false, message: 'Majburiy maydonlar to\'ldirilmagan' });
      return;
    }

    // Kurs nomiga qarab seriya prefiksi (KK)
    const finalCourseCode = course_code || getSeriesFromCourse(course_name);
    const finalBranchCode = branch_code || '1';
    const finalSigningDate = signing_date || course_start_date || new Date().toISOString();
    
    const finalDescription = getDescriptionFromCourse(course_name, course_description);

    // Serial raqam
    let serialNumber = customSerial;
    if (!serialNumber) {
      serialNumber = await generateSerialNumber(finalCourseCode, finalBranchCode, finalSigningDate);
    }

    // Mavjudligini tekshirish
    const existing = await prisma.certificate.findUnique({ where: { serial_number: serialNumber } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Bu seriya raqam allaqachon mavjud' });
      return;
    }

    // QR kod (saqlanadi lekin shablon ichiga qo'shilmaydi)
    const qrCodeUrl = await generateQRCode(serialNumber);

    // Sertifikat PNG + PDF generatsiya
    const endDate = new Date(course_end_date);
    let pngUrl: string | undefined;
    let pdfUrl: string | undefined;
    try {
      const files = await generateCertificateFiles(
        serialNumber,
        full_name,
        course_name,
        finalDescription,
        endDate,
      );
      pngUrl = files.pngUrl;
      pdfUrl = files.pdfUrl;
    } catch (genErr) {
      console.error('Sertifikat generatsiyada xato:', genErr);
      // Generatsiya xato bo'lsa ham sertifikat saqlanadi
    }

    const cert = await prisma.certificate.create({
      data: {
        serial_series: finalCourseCode,
        serial_number: serialNumber,
        full_name,
        course_name,
        course_description: finalDescription,
        course_start_date: new Date(course_start_date),
        course_end_date: endDate,
        qr_code_url: qrCodeUrl,
        file_url: pdfUrl, // PDF manzili
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

    res.status(201).json({
      success: true,
      data: { ...cert, png_url: pngUrl },
      message: 'Sertifikat yaratildi',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// Admin: sertifikat faylini (PNG yoki PDF) yuklash
export const downloadCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { id: req.params.id as string },
    });
    if (!cert) {
      res.status(404).json({ success: false, message: 'Topilmadi' });
      return;
    }

    const format = (req.query.format as string) || 'pdf';
    const safeName = cert.serial_number.replace(/[^a-zA-Z0-9]/g, '-');
    const certDir = path.join(config.uploadDir, 'generated');
    const filePath = path.join(certDir, `cert-${safeName}.${format}`);

    const pngPath = path.join(certDir, `cert-${safeName}.png`);
    const pdfPath = path.join(certDir, `cert-${safeName}.pdf`);
    if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });

    // Always regenerate to apply font/style fixes
    await generateCertificateImage(
      {
        fullName: cert.full_name,
        courseName: cert.course_name,
        courseDescription: cert.course_description || '',
        courseEndDate: cert.course_end_date,
        serialNumber: cert.serial_number,
      },
      pngPath,
    );
    await convertPngToPdf(pngPath, pdfPath);

    const mimeType = format === 'pdf' ? 'application/pdf' : 'image/png';
    res.setHeader('Content-Disposition', `attachment; filename="${cert.serial_number}.${format}"`);
    res.setHeader('Content-Type', mimeType);
    fs.createReadStream(filePath).pipe(res);
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
      serial_series: customSeries,
      serial_number: customSerial,
      full_name,
      course_name,
      course_description,
      course_start_date,
      course_end_date,
      branch_code,
      course_code,
      signing_date,
    } = req.body;

    if (!full_name || !course_name || !course_start_date || !course_end_date) {
      res.status(400).json({ success: false, message: 'Majburiy maydonlar to\'ldirilmagan' });
      return;
    }

    const finalCourseCode = course_code || customSeries || getSeriesFromCourse(course_name);
    const finalBranchCode = branch_code || '1';
    const finalSigningDate = signing_date || course_start_date || new Date().toISOString();

    let serialNumber = customSerial;
    if (!serialNumber) {
      serialNumber = await generateSerialNumber(finalCourseCode, finalBranchCode, finalSigningDate);
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
        serial_series: finalCourseCode,
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

    // Qayta generatsiya qilish
    const safeName = cert.serial_number.replace(/[^a-zA-Z0-9]/g, '-');
    const certDir = path.join(config.uploadDir, 'generated');
    const pngPath = path.join(certDir, `cert-${safeName}.png`);
    const pdfPath = path.join(certDir, `cert-${safeName}.pdf`);
    if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });

    await generateCertificateImage(
      {
        fullName: cert.full_name,
        courseName: cert.course_name,
        courseDescription: cert.course_description || '',
        courseEndDate: cert.course_end_date,
        serialNumber: cert.serial_number,
      },
      pngPath,
    );
    await convertPngToPdf(pngPath, pdfPath);

    const updated = await prisma.certificate.update({
      where: { id: req.params.id as string },
      data: {
        qr_code_url: qrCodeUrl,
        file_url: `/uploads/generated/cert-${safeName}.pdf`,
        status: 'active'
      },
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// Admin: sertifikatni o'chirish
export const deleteCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cert = await prisma.certificate.findUnique({ where: { id: req.params.id as string } });
    if (!cert) {
      res.status(404).json({ success: false, message: 'Topilmadi' });
      return;
    }

    // Fayllarni o'chirish
    const safeName = cert.serial_number.replace(/[^a-zA-Z0-9]/g, '-');
    const certDir = path.join(config.uploadDir, 'generated');
    const qrDir = path.join(config.uploadDir, 'qrcodes');

    const pngPath = path.join(certDir, `cert-${safeName}.png`);
    const pdfPath = path.join(certDir, `cert-${safeName}.pdf`);
    const qrPath = path.join(qrDir, `qr-${safeName}.png`);

    if (fs.existsSync(pngPath)) fs.unlinkSync(pngPath);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);

    // Agar yuklangan sertifikat bo'lsa (fayldan yuklangan)
    if (cert.file_url && !cert.is_generated) {
      const uploadedPath = path.join(process.cwd(), cert.file_url);
      if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
    }

    await prisma.certificate.delete({ where: { id: req.params.id as string } });

    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'deleted',
        details: { serial_number: cert.serial_number, full_name: cert.full_name },
        ip_address: req.ip,
      },
    });

    res.json({ success: true, message: 'Sertifikat muvaffaqiyatli o\'chirildi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
