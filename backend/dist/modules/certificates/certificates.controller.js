"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reissueCertificate = exports.revokeCertificate = exports.updateCertificate = exports.uploadCertificate = exports.downloadCertificate = exports.createCertificate = exports.getCertificateById = exports.getCertificates = exports.verifyCertificate = void 0;
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const qrcode_1 = __importDefault(require("qrcode"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const certificate_generator_1 = require("./certificate-generator");
// Serial raqam generatsiya (8 xonali)
const generateSerialNumber = async (series) => {
    const count = await database_1.prisma.certificate.count({
        where: { serial_series: series },
    });
    const num = String(count + 1).padStart(8, '0');
    return `${series}-${num}`;
};
// Kurs nomidan seriya prefiksini aniqlash
const getSeriesFromCourse = (courseName) => {
    const entry = certificate_generator_1.COURSE_SERIES_MAP[courseName];
    if (entry)
        return entry.prefix;
    // Nomalum kurs uchun: birinchi 2 harf (katta)
    return courseName.slice(0, 2).toUpperCase();
};
// Kursga mos tavsifni olish
const getDescriptionFromCourse = (courseName, customDesc) => {
    if (customDesc && customDesc.trim())
        return customDesc.trim();
    const entry = certificate_generator_1.COURSE_SERIES_MAP[courseName];
    return entry?.description || '';
};
// QR kod generatsiya va saqlash (faqat keyingi foydalanish uchun saqlanadi, shablon o'zgarmaydi)
const generateQRCode = async (serialNumber) => {
    const verifyUrl = `${env_1.config.frontendUrl}/c/${serialNumber}`;
    const qrDir = path_1.default.join(env_1.config.uploadDir, 'qrcodes');
    if (!fs_1.default.existsSync(qrDir))
        fs_1.default.mkdirSync(qrDir, { recursive: true });
    const filename = `qr-${serialNumber.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    const filePath = path_1.default.join(qrDir, filename);
    await qrcode_1.default.toFile(filePath, verifyUrl, { width: 300, margin: 2 });
    return `/uploads/qrcodes/${filename}`;
};
// Sertifikat PNG + PDF generatsiya qilish
const generateCertificateFiles = async (serialNumber, fullName, courseName, courseDescription, courseEndDate) => {
    const certDir = path_1.default.join(env_1.config.uploadDir, 'generated');
    if (!fs_1.default.existsSync(certDir))
        fs_1.default.mkdirSync(certDir, { recursive: true });
    const safeName = serialNumber.replace(/[^a-zA-Z0-9]/g, '-');
    const pngPath = path_1.default.join(certDir, `cert-${safeName}.png`);
    const pdfPath = path_1.default.join(certDir, `cert-${safeName}.pdf`);
    await (0, certificate_generator_1.generateCertificateImage)({ fullName, courseName, courseDescription, courseEndDate, serialNumber }, pngPath);
    await (0, certificate_generator_1.convertPngToPdf)(pngPath, pdfPath);
    return {
        pngUrl: `/uploads/generated/cert-${safeName}.png`,
        pdfUrl: `/uploads/generated/cert-${safeName}.pdf`,
    };
};
// Public: sertifikatni tekshirish
const verifyCertificate = async (req, res) => {
    try {
        const { serialNumber } = req.params;
        const cert = await database_1.prisma.certificate.findUnique({
            where: { serial_number: serialNumber },
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
    }
    catch {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
};
exports.verifyCertificate = verifyCertificate;
// Admin: barcha sertifikatlar ro'yxati
const getCertificates = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { full_name: { contains: search, mode: 'insensitive' } },
                { serial_number: { contains: search, mode: 'insensitive' } },
                { course_name: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status)
            where.status = status;
        const [total, certificates] = await Promise.all([
            database_1.prisma.certificate.count({ where }),
            database_1.prisma.certificate.findMany({
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
    }
    catch {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
};
exports.getCertificates = getCertificates;
// Admin: bitta sertifikat
const getCertificateById = async (req, res) => {
    try {
        const cert = await database_1.prisma.certificate.findUnique({
            where: { id: req.params.id },
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
    }
    catch {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
};
exports.getCertificateById = getCertificateById;
// Admin: yangi sertifikat yaratish (generatsiya)
const createCertificate = async (req, res) => {
    try {
        const { serial_number: customSerial, full_name, course_name, course_description, course_start_date, course_end_date, } = req.body;
        if (!full_name || !course_name || !course_start_date || !course_end_date) {
            res.status(400).json({ success: false, message: 'Majburiy maydonlar to\'ldirilmagan' });
            return;
        }
        // Kurs nomiga qarab seriya prefiksi
        const serial_series = getSeriesFromCourse(course_name);
        const finalDescription = getDescriptionFromCourse(course_name, course_description);
        // Serial raqam
        let serialNumber = customSerial;
        if (!serialNumber) {
            serialNumber = await generateSerialNumber(serial_series);
        }
        // Mavjudligini tekshirish
        const existing = await database_1.prisma.certificate.findUnique({ where: { serial_number: serialNumber } });
        if (existing) {
            res.status(400).json({ success: false, message: 'Bu seriya raqam allaqachon mavjud' });
            return;
        }
        // QR kod (saqlanadi lekin shablon ichiga qo'shilmaydi)
        const qrCodeUrl = await generateQRCode(serialNumber);
        // Sertifikat PNG + PDF generatsiya
        const endDate = new Date(course_end_date);
        let pngUrl;
        let pdfUrl;
        try {
            const files = await generateCertificateFiles(serialNumber, full_name, course_name, finalDescription, endDate);
            pngUrl = files.pngUrl;
            pdfUrl = files.pdfUrl;
        }
        catch (genErr) {
            console.error('Sertifikat generatsiyada xato:', genErr);
            // Generatsiya xato bo'lsa ham sertifikat saqlanadi
        }
        const cert = await database_1.prisma.certificate.create({
            data: {
                serial_series,
                serial_number: serialNumber,
                full_name,
                course_name,
                course_description: finalDescription,
                course_start_date: new Date(course_start_date),
                course_end_date: endDate,
                qr_code_url: qrCodeUrl,
                file_url: pdfUrl, // PDF manzili
                is_generated: true,
                created_by_id: req.user.id,
            },
        });
        // Audit log
        await database_1.prisma.auditLog.create({
            data: {
                user_id: req.user.id,
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
};
exports.createCertificate = createCertificate;
// Admin: sertifikat faylini (PNG yoki PDF) yuklash
const downloadCertificate = async (req, res) => {
    try {
        const cert = await database_1.prisma.certificate.findUnique({
            where: { id: req.params.id },
        });
        if (!cert) {
            res.status(404).json({ success: false, message: 'Topilmadi' });
            return;
        }
        const format = req.query.format || 'pdf';
        const safeName = cert.serial_number.replace(/[^a-zA-Z0-9]/g, '-');
        const certDir = path_1.default.join(env_1.config.uploadDir, 'generated');
        const filePath = path_1.default.join(certDir, `cert-${safeName}.${format}`);
        if (!fs_1.default.existsSync(filePath)) {
            // Fayl yo'q bo'lsa qayta generatsiya
            const pngPath = path_1.default.join(certDir, `cert-${safeName}.png`);
            const pdfPath = path_1.default.join(certDir, `cert-${safeName}.pdf`);
            if (!fs_1.default.existsSync(certDir))
                fs_1.default.mkdirSync(certDir, { recursive: true });
            await (0, certificate_generator_1.generateCertificateImage)({
                fullName: cert.full_name,
                courseName: cert.course_name,
                courseDescription: cert.course_description || '',
                courseEndDate: cert.course_end_date,
                serialNumber: cert.serial_number,
            }, pngPath);
            if (format === 'pdf') {
                await (0, certificate_generator_1.convertPngToPdf)(pngPath, pdfPath);
            }
        }
        const mimeType = format === 'pdf' ? 'application/pdf' : 'image/png';
        res.setHeader('Content-Disposition', `attachment; filename="${cert.serial_number}.${format}"`);
        res.setHeader('Content-Type', mimeType);
        fs_1.default.createReadStream(filePath).pipe(res);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
};
exports.downloadCertificate = downloadCertificate;
// Admin: fayl yuklash orqali sertifikat
const uploadCertificate = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'Fayl tanlanmagan' });
            return;
        }
        const { serial_series = 'ITLA', serial_number: customSerial, full_name, course_name, course_description, course_start_date, course_end_date, } = req.body;
        if (!full_name || !course_name || !course_start_date || !course_end_date) {
            res.status(400).json({ success: false, message: 'Majburiy maydonlar to\'ldirilmagan' });
            return;
        }
        let serialNumber = customSerial;
        if (!serialNumber) {
            serialNumber = await generateSerialNumber(serial_series);
        }
        const existing = await database_1.prisma.certificate.findUnique({ where: { serial_number: serialNumber } });
        if (existing) {
            res.status(400).json({ success: false, message: 'Bu seriya raqam allaqachon mavjud' });
            return;
        }
        const fileUrl = `/uploads/certificates/${req.file.filename}`;
        const qrCodeUrl = await generateQRCode(serialNumber);
        const cert = await database_1.prisma.certificate.create({
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
                created_by_id: req.user.id,
            },
        });
        await database_1.prisma.auditLog.create({
            data: {
                user_id: req.user.id,
                action: 'uploaded',
                certificate_id: cert.id,
                ip_address: req.ip,
            },
        });
        res.status(201).json({ success: true, data: cert, message: 'Sertifikat yuklandi' });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
};
exports.uploadCertificate = uploadCertificate;
// Admin: sertifikatni tahrirlash
const updateCertificate = async (req, res) => {
    try {
        const { full_name, course_name, course_description, course_start_date, course_end_date } = req.body;
        const cert = await database_1.prisma.certificate.findUnique({ where: { id: req.params.id } });
        if (!cert) {
            res.status(404).json({ success: false, message: 'Topilmadi' });
            return;
        }
        if (cert.status === 'revoked') {
            res.status(400).json({ success: false, message: 'Bekor qilingan sertifikatni tahrirlash mumkin emas' });
            return;
        }
        const updated = await database_1.prisma.certificate.update({
            where: { id: req.params.id },
            data: {
                ...(full_name && { full_name }),
                ...(course_name && { course_name }),
                ...(course_description !== undefined && { course_description }),
                ...(course_start_date && { course_start_date: new Date(course_start_date) }),
                ...(course_end_date && { course_end_date: new Date(course_end_date) }),
            },
        });
        await database_1.prisma.auditLog.create({
            data: {
                user_id: req.user.id,
                action: 'updated',
                certificate_id: cert.id,
                details: { before: cert, after: req.body },
                ip_address: req.ip,
            },
        });
        res.json({ success: true, data: updated, message: 'Yangilandi' });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
};
exports.updateCertificate = updateCertificate;
// Super-Admin: sertifikatni bekor qilish
const revokeCertificate = async (req, res) => {
    try {
        const cert = await database_1.prisma.certificate.findUnique({ where: { id: req.params.id } });
        if (!cert) {
            res.status(404).json({ success: false, message: 'Topilmadi' });
            return;
        }
        if (cert.status === 'revoked') {
            res.status(400).json({ success: false, message: 'Sertifikat allaqachon bekor qilingan' });
            return;
        }
        const updated = await database_1.prisma.certificate.update({
            where: { id: req.params.id },
            data: { status: 'revoked' },
        });
        await database_1.prisma.auditLog.create({
            data: {
                user_id: req.user.id,
                action: 'revoked',
                certificate_id: cert.id,
                ip_address: req.ip,
            },
        });
        res.json({ success: true, data: updated, message: 'Sertifikat bekor qilindi' });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
};
exports.revokeCertificate = revokeCertificate;
// Admin: qayta chiqarish (reissue)
const reissueCertificate = async (req, res) => {
    try {
        const cert = await database_1.prisma.certificate.findUnique({ where: { id: req.params.id } });
        if (!cert) {
            res.status(404).json({ success: false, message: 'Topilmadi' });
            return;
        }
        // Yangi QR kod qayta yaratish
        const qrCodeUrl = await generateQRCode(cert.serial_number);
        const updated = await database_1.prisma.certificate.update({
            where: { id: req.params.id },
            data: { qr_code_url: qrCodeUrl, status: 'active' },
        });
        await database_1.prisma.auditLog.create({
            data: {
                user_id: req.user.id,
                action: 'reissued',
                certificate_id: cert.id,
                ip_address: req.ip,
            },
        });
        res.json({ success: true, data: updated, message: 'Sertifikat qayta chiqarildi' });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
};
exports.reissueCertificate = reissueCertificate;
//# sourceMappingURL=certificates.controller.js.map