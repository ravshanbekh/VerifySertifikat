"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reissueCertificate = exports.revokeCertificate = exports.updateCertificate = exports.uploadCertificate = exports.createCertificate = exports.getCertificateById = exports.getCertificates = exports.verifyCertificate = void 0;
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const qrcode_1 = __importDefault(require("qrcode"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Serial raqam generatsiya
const generateSerialNumber = async (series) => {
    const count = await database_1.prisma.certificate.count({
        where: { serial_series: series },
    });
    const num = String(count + 1).padStart(6, '0');
    return `${series}-${num}`;
};
// QR kod generatsiya va saqlash
const generateQRCode = async (serialNumber) => {
    const verifyUrl = `${env_1.config.baseUrl.replace(':4000', ':3000')}/c/${serialNumber}`;
    const qrDir = path_1.default.join(env_1.config.uploadDir, 'qrcodes');
    if (!fs_1.default.existsSync(qrDir))
        fs_1.default.mkdirSync(qrDir, { recursive: true });
    const filename = `qr-${serialNumber.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    const filePath = path_1.default.join(qrDir, filename);
    await qrcode_1.default.toFile(filePath, verifyUrl, { width: 300, margin: 2 });
    return `/uploads/qrcodes/${filename}`;
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
        const { serial_series = 'ITLA', serial_number: customSerial, full_name, course_name, course_description, course_start_date, course_end_date, } = req.body;
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
        const existing = await database_1.prisma.certificate.findUnique({ where: { serial_number: serialNumber } });
        if (existing) {
            res.status(400).json({ success: false, message: 'Bu seriya raqam allaqachon mavjud' });
            return;
        }
        // QR kod
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
                qr_code_url: qrCodeUrl,
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
        res.status(201).json({ success: true, data: cert, message: 'Sertifikat yaratildi' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
};
exports.createCertificate = createCertificate;
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