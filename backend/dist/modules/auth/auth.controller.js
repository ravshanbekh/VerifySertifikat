"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.refreshToken = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const generateTokens = (user) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, full_name: user.full_name }, env_1.config.jwt.secret, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { expiresIn: env_1.config.jwt.expiresIn });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, env_1.config.jwt.refreshSecret, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { expiresIn: env_1.config.jwt.refreshExpiresIn });
    return { accessToken, refreshToken };
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email va parol kiritilishi shart' });
            return;
        }
        const user = await database_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ success: false, message: 'Email yoki parol noto\'g\'ri' });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isPasswordValid) {
            res.status(401).json({ success: false, message: 'Email yoki parol noto\'g\'ri' });
            return;
        }
        const { accessToken, refreshToken } = generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
        });
        res.json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;
        if (!token) {
            res.status(400).json({ success: false, message: 'Refresh token taqdim etilmagan' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwt.refreshSecret);
        const user = await database_1.prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi' });
            return;
        }
        const { accessToken, refreshToken: newRefreshToken } = generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
        });
        res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
    }
    catch {
        res.status(401).json({ success: false, message: 'Refresh token yaroqsiz' });
    }
};
exports.refreshToken = refreshToken;
const logout = async (_req, res) => {
    res.json({ success: true, message: 'Muvaffaqiyatli chiqildi' });
};
exports.logout = logout;
const getMe = async (req, res) => {
    try {
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, full_name: true, email: true, role: true, created_at: true },
        });
        res.json({ success: true, data: user });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
};
exports.getMe = getMe;
//# sourceMappingURL=auth.controller.js.map