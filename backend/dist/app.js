"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middleware/error.middleware");
// Routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const certificates_routes_1 = __importDefault(require("./modules/certificates/certificates.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const audit_routes_1 = __importDefault(require("./modules/audit/audit.routes"));
const app = (0, express_1.default)();
// Rate limit trust proxy
app.set('trust proxy', 1);
// Upload papkalarini yaratish
const uploadDirs = [
    './uploads',
    './uploads/certificates',
    './uploads/qrcodes',
];
uploadDirs.forEach((dir) => {
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
});
// Rate limiter (public verify uchun)
const verifyLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 daqiqa
    max: 20,
    message: { success: false, message: 'Juda ko\'p so\'rov. 1 daqiqadan keyin urinib ko\'ring.' },
});
// Global rate limiter
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
});
// Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // uploads uchun
}));
app.use((0, cors_1.default)({
    origin: env_1.config.frontendUrl,
    credentials: true,
}));
app.use(globalLimiter);
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Static fayllar (uploadlar)
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/certificates', certificates_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api/audit-logs', audit_routes_1.default);
// Public verify endpoint (rate limited)
app.get('/api/verify/:serialNumber', verifyLimiter, async (req, res) => {
    const { verifyCertificate } = await Promise.resolve().then(() => __importStar(require('./modules/certificates/certificates.controller')));
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
app.use(error_middleware_1.errorHandler);
// Server ishga tushirish
app.listen(env_1.config.port, () => {
    console.log(`✅ Server ishga tushdi: http://localhost:${env_1.config.port}`);
    console.log(`📦 Muhit: ${env_1.config.nodeEnv}`);
});
exports.default = app;
//# sourceMappingURL=app.js.map