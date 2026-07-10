"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const certificates_controller_1 = require("./certificates.controller");
// Multer sozlamasi
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, './uploads/certificates');
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `cert-${(0, uuid_1.v4)()}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('Faqat PDF, JPG, PNG formatlar qabul qilinadi'));
        }
    },
});
const router = (0, express_1.Router)();
// Public endpoint (auth shart emas)
router.get('/verify/:serialNumber', certificates_controller_1.verifyCertificate);
// Auth talab qilinadi
router.use(auth_middleware_1.authenticate);
router.get('/', certificates_controller_1.getCertificates);
router.get('/:id', certificates_controller_1.getCertificateById);
router.post('/', certificates_controller_1.createCertificate);
router.post('/upload', upload.single('file'), certificates_controller_1.uploadCertificate);
router.put('/:id', certificates_controller_1.updateCertificate);
router.post('/:id/reissue', certificates_controller_1.reissueCertificate);
router.post('/:id/revoke', (0, auth_middleware_1.requireRole)('super_admin'), certificates_controller_1.revokeCertificate);
exports.default = router;
//# sourceMappingURL=certificates.routes.js.map