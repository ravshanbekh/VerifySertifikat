"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetUserPassword = exports.updateUserRole = exports.deleteUser = exports.createUser = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../../config/database");
// Barcha xodimlar ro'yxati (super_admin)
const getUsers = async (_req, res) => {
    try {
        const users = await database_1.prisma.user.findMany({
            select: { id: true, full_name: true, email: true, role: true, created_at: true },
            orderBy: { created_at: 'desc' },
        });
        res.json({ success: true, data: users });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
};
exports.getUsers = getUsers;
// Yangi xodim qo'shish (super_admin)
const createUser = async (req, res) => {
    try {
        const { full_name, email, password, role = 'operator' } = req.body;
        if (!full_name || !email || !password) {
            res.status(400).json({ success: false, message: 'Barcha maydonlarni to\'ldiring' });
            return;
        }
        const existing = await database_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(400).json({ success: false, message: 'Bu email allaqachon mavjud' });
            return;
        }
        const password_hash = await bcryptjs_1.default.hash(password, 12);
        const user = await database_1.prisma.user.create({
            data: { full_name, email, password_hash, role },
            select: { id: true, full_name: true, email: true, role: true, created_at: true },
        });
        res.status(201).json({ success: true, data: user });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
};
exports.createUser = createUser;
// Xodimni o'chirish (super_admin)
const deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            res.status(400).json({ success: false, message: 'O\'zingizni o\'chira olmaysiz' });
            return;
        }
        await database_1.prisma.user.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Xodim o\'chirildi' });
    }
    catch {
        res.status(404).json({ success: false, message: 'Topilmadi' });
    }
};
exports.deleteUser = deleteUser;
// Rol o'zgartirish (super_admin)
const updateUserRole = async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            res.status(400).json({ success: false, message: 'O\'z rolingizni o\'zgartira olmaysiz' });
            return;
        }
        const { role } = req.body;
        if (!['operator', 'super_admin'].includes(role)) {
            res.status(400).json({ success: false, message: 'Noto\'g\'ri rol' });
            return;
        }
        const user = await database_1.prisma.user.update({
            where: { id: req.params.id },
            data: { role },
            select: { id: true, full_name: true, email: true, role: true },
        });
        res.json({ success: true, data: user });
    }
    catch {
        res.status(404).json({ success: false, message: 'Topilmadi' });
    }
};
exports.updateUserRole = updateUserRole;
// Parolni reset qilish (super_admin)
const resetUserPassword = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password || password.length < 6) {
            res.status(400).json({ success: false, message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
            return;
        }
        const password_hash = await bcryptjs_1.default.hash(password, 12);
        await database_1.prisma.user.update({ where: { id: req.params.id }, data: { password_hash } });
        res.json({ success: true, message: 'Parol yangilandi' });
    }
    catch {
        res.status(404).json({ success: false, message: 'Topilmadi' });
    }
};
exports.resetUserPassword = resetUserPassword;
//# sourceMappingURL=users.controller.js.map