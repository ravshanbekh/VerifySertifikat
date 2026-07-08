import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth.middleware';

// Barcha xodimlar ro'yxati (super_admin)
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, full_name: true, email: true, role: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// Yangi xodim qo'shish (super_admin)
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, password, role = 'operator' } = req.body;
    if (!full_name || !email || !password) {
      res.status(400).json({ success: false, message: 'Barcha maydonlarni to\'ldiring' });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Bu email allaqachon mavjud' });
      return;
    }
    const password_hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { full_name, email, password_hash, role },
      select: { id: true, full_name: true, email: true, role: true, created_at: true },
    });
    res.status(201).json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// Xodimni o'chirish (super_admin)
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.user!.id) {
      res.status(400).json({ success: false, message: 'O\'zingizni o\'chira olmaysiz' });
      return;
    }
    await prisma.user.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Xodim o\'chirildi' });
  } catch {
    res.status(404).json({ success: false, message: 'Topilmadi' });
  }
};

// Rol o'zgartirish (super_admin)
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.user!.id) {
      res.status(400).json({ success: false, message: 'O\'z rolingizni o\'zgartira olmaysiz' });
      return;
    }
    const { role } = req.body;
    if (!['operator', 'super_admin'].includes(role)) {
      res.status(400).json({ success: false, message: 'Noto\'g\'ri rol' });
      return;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { role },
      select: { id: true, full_name: true, email: true, role: true },
    });
    res.json({ success: true, data: user });
  } catch {
    res.status(404).json({ success: false, message: 'Topilmadi' });
  }
};

// Parolni reset qilish (super_admin)
export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      res.status(400).json({ success: false, message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
      return;
    }
    const password_hash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: req.params.id as string }, data: { password_hash } });
    res.json({ success: true, message: 'Parol yangilandi' });
  } catch {
    res.status(404).json({ success: false, message: 'Topilmadi' });
  }
};
